use anchor_lang::prelude::*;
use crate::state::{Airdrop, Treasury, AIRDROP_SIZE};
use crate::errors::SolDropError;

/// Create a new airdrop PDA.
///
/// Only the treasury authority (admin) can create airdrops.
/// Each airdrop is uniquely identified by its numeric `id` and stored as a PDA
/// seeded with `[b"airdrop", id.to_le_bytes()]`.
pub fn handler(
    ctx: Context<CreateAirdrop>,
    id: u64,
    latitude: i64,
    longitude: i64,
    reward_amount: u64,
    expiry_timestamp: i64,
    max_claims: u16,
    rarity: u8,
) -> Result<()> {
    // Validate authority
    require!(
        ctx.accounts.authority.key() == ctx.accounts.treasury.authority,
        SolDropError::Unauthorized
    );

    // Validate rarity (0-4)
    require!(rarity <= 4, SolDropError::InvalidRarity);

    // Validate expiry is in the future
    let clock = Clock::get()?;
    require!(
        expiry_timestamp > clock.unix_timestamp,
        SolDropError::InvalidExpiry
    );

    // Validate reward amount > 0
    require!(reward_amount > 0, SolDropError::InvalidRewardAmount);

    // Initialize the airdrop account
    let airdrop = &mut ctx.accounts.airdrop;
    airdrop.id = id;
    airdrop.latitude = latitude;
    airdrop.longitude = longitude;
    airdrop.reward_amount = reward_amount;
    airdrop.expiry_timestamp = expiry_timestamp;
    airdrop.max_claims = max_claims;
    airdrop.claims_count = 0;
    airdrop.rarity = rarity;
    airdrop.active = true;
    airdrop.creator = ctx.accounts.authority.key();
    airdrop.bump = ctx.bumps.airdrop;

    msg!(
        "Airdrop #{} created at ({}, {}) — {} lamports, rarity {}, expires {}",
        id,
        latitude,
        longitude,
        reward_amount,
        rarity,
        expiry_timestamp
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(id: u64)]
pub struct CreateAirdrop<'info> {
    #[account(
        init,
        payer = authority,
        space = AIRDROP_SIZE,
        seeds = [b"airdrop", id.to_le_bytes().as_ref()],
        bump,
    )]
    pub airdrop: Account<'info, Airdrop>,

    #[account(
        seeds = [b"treasury"],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
