use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("So1Drop1111111111111111111111111111111111111");

#[program]
pub mod soldrop {
    use super::*;

    /// Initialize the treasury PDA and fund it with SOL.
    ///
    /// # Arguments
    /// * `fund_amount` — Lamports to transfer from authority → treasury
    pub fn initialize_treasury(ctx: Context<InitializeTreasury>, fund_amount: u64) -> Result<()> {
        instructions::initialize_treasury::handler(ctx, fund_amount)
    }

    /// Create a new geo-located airdrop.
    ///
    /// # Arguments
    /// * `id`               — Unique numeric ID
    /// * `latitude`         — Latitude in micro-degrees (× 1e6)
    /// * `longitude`        — Longitude in micro-degrees (× 1e6)
    /// * `reward_amount`    — Reward in lamports
    /// * `expiry_timestamp` — Unix timestamp when this drop expires
    /// * `max_claims`       — Maximum number of claimers
    /// * `rarity`           — Rarity tier (0 = Fish … 4 = Whale)
    pub fn create_airdrop(
        ctx: Context<CreateAirdrop>,
        id: u64,
        latitude: i64,
        longitude: i64,
        reward_amount: u64,
        expiry_timestamp: i64,
        max_claims: u16,
        rarity: u8,
    ) -> Result<()> {
        instructions::create_airdrop::handler(
            ctx,
            id,
            latitude,
            longitude,
            reward_amount,
            expiry_timestamp,
            max_claims,
            rarity,
        )
    }

    /// Claim an airdrop reward.
    ///
    /// Creates a ClaimReceipt PDA to prevent double-claiming.
    /// Transfers SOL from treasury → claimer.
    pub fn claim_airdrop(ctx: Context<ClaimAirdrop>) -> Result<()> {
        instructions::claim_airdrop::handler(ctx)
    }
}
