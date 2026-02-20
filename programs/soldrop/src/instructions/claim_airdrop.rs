use anchor_lang::prelude::*;
use crate::state::{Airdrop, Treasury, ClaimReceipt, CLAIM_RECEIPT_SIZE};
use crate::errors::SolDropError;

/// Claim an airdrop reward.
///
/// This instruction:
///   1. Validates the airdrop is still active and not expired
///   2. Validates max claims have not been reached
///   3. Creates a ClaimReceipt PDA to prevent double-claiming
///   4. Transfers SOL from treasury PDA → claimer
///   5. Increments the claims counter
///
/// The ClaimReceipt PDA is seeded with `[b"claim", airdrop.key(), claimer.key()]`,
/// so if a wallet has already claimed, the PDA already exists and `init` will fail.
pub fn handler(ctx: Context<ClaimAirdrop>) -> Result<()> {
    let airdrop = &mut ctx.accounts.airdrop;
    let treasury = &mut ctx.accounts.treasury;
    let clock = Clock::get()?;

    // ── Validations ──────────────────────────────────────────────
    require!(airdrop.active, SolDropError::AirdropInactive);

    require!(
        clock.unix_timestamp < airdrop.expiry_timestamp,
        SolDropError::AirdropExpired
    );

    require!(
        airdrop.claims_count < airdrop.max_claims,
        SolDropError::MaxClaimsReached
    );

    // Check treasury has enough SOL (account lamports, not the tracking field)
    let treasury_lamports = treasury.to_account_info().lamports();
    let rent = Rent::get()?;
    let min_rent = rent.minimum_balance(treasury.to_account_info().data_len());
    let available = treasury_lamports
        .checked_sub(min_rent)
        .ok_or(SolDropError::InsufficientTreasuryFunds)?;
    require!(
        available >= airdrop.reward_amount,
        SolDropError::InsufficientTreasuryFunds
    );

    // ── Transfer SOL from treasury PDA → claimer ─────────────────
    // Since the treasury is a PDA, we transfer lamports directly
    // (no CPI needed — just modify lamports).
    **treasury.to_account_info().try_borrow_mut_lamports()? -= airdrop.reward_amount;
    **ctx.accounts.claimer.to_account_info().try_borrow_mut_lamports()? += airdrop.reward_amount;

    // ── Update state ─────────────────────────────────────────────
    airdrop.claims_count = airdrop
        .claims_count
        .checked_add(1)
        .ok_or(SolDropError::ArithmeticOverflow)?;

    // Deactivate if max claims reached
    if airdrop.claims_count >= airdrop.max_claims {
        airdrop.active = false;
    }

    // ── Populate claim receipt ────────────────────────────────────
    let receipt = &mut ctx.accounts.claim_receipt;
    receipt.airdrop = ctx.accounts.airdrop.key();
    receipt.claimer = ctx.accounts.claimer.key();
    receipt.claimed_at = clock.unix_timestamp;
    receipt.bump = ctx.bumps.claim_receipt;

    msg!(
        "Airdrop #{} claimed by {} — {} lamports transferred",
        airdrop.id,
        ctx.accounts.claimer.key(),
        airdrop.reward_amount
    );

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimAirdrop<'info> {
    #[account(
        mut,
        seeds = [b"airdrop", airdrop.id.to_le_bytes().as_ref()],
        bump = airdrop.bump,
    )]
    pub airdrop: Account<'info, Airdrop>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    /// The ClaimReceipt PDA prevents double-claiming.
    /// If this account already exists for this (airdrop, claimer) pair,
    /// the `init` constraint will fail, blocking the double claim.
    #[account(
        init,
        payer = claimer,
        space = CLAIM_RECEIPT_SIZE,
        seeds = [b"claim", airdrop.key().as_ref(), claimer.key().as_ref()],
        bump,
    )]
    pub claim_receipt: Account<'info, ClaimReceipt>,

    #[account(mut)]
    pub claimer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
