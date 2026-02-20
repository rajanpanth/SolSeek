use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{Treasury, TREASURY_SIZE};

/// Initialize the treasury PDA and fund it with SOL.
///
/// The treasury holds all SOL that will be distributed as airdrop rewards.
/// Only the initializing authority can later create airdrops.
pub fn handler(ctx: Context<InitializeTreasury>, fund_amount: u64) -> Result<()> {
    // Initialize the treasury account
    let treasury = &mut ctx.accounts.treasury;
    treasury.authority = ctx.accounts.authority.key();
    treasury.total_deposited = fund_amount;
    treasury.bump = ctx.bumps.treasury;

    // Transfer SOL from authority → treasury PDA
    if fund_amount > 0 {
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            fund_amount,
        )?;
    }

    msg!(
        "Treasury initialized by {} with {} lamports",
        ctx.accounts.authority.key(),
        fund_amount
    );
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        payer = authority,
        space = TREASURY_SIZE,
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
