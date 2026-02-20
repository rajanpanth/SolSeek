use anchor_lang::prelude::*;

// ─────────────────────────────────────────────
// Account size constants
// ─────────────────────────────────────────────

/// 8 (discriminator) + 32 (authority) + 8 (total_deposited) + 1 (bump)
pub const TREASURY_SIZE: usize = 8 + 32 + 8 + 1;

/// 8 (disc) + 8 (id) + 8 (lat) + 8 (lon) + 8 (reward) + 8 (expiry)
/// + 2 (max_claims) + 2 (claims_count) + 1 (rarity) + 1 (active)
/// + 32 (creator) + 1 (bump)
pub const AIRDROP_SIZE: usize = 8 + 8 + 8 + 8 + 8 + 8 + 2 + 2 + 1 + 1 + 32 + 1;

/// 8 (disc) + 32 (airdrop) + 32 (claimer) + 8 (claimed_at) + 1 (bump)
pub const CLAIM_RECEIPT_SIZE: usize = 8 + 32 + 32 + 8 + 1;

// ─────────────────────────────────────────────
// Rarity tiers
// ─────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum Rarity {
    Fish = 0,     // 0.1 SOL  — very common
    Turtle = 1,   // 0.25 SOL — common
    Dolphin = 2,  // 0.5 SOL  — uncommon
    Shark = 3,    // 1 SOL    — rare
    Whale = 4,    // 2 SOL    — very rare
}

impl Rarity {
    pub fn reward_lamports(&self) -> u64 {
        match self {
            Rarity::Fish => 100_000_000,      // 0.1 SOL
            Rarity::Turtle => 250_000_000,    // 0.25 SOL
            Rarity::Dolphin => 500_000_000,   // 0.5 SOL
            Rarity::Shark => 1_000_000_000,   // 1 SOL
            Rarity::Whale => 2_000_000_000,   // 2 SOL
        }
    }
}

// ─────────────────────────────────────────────
// Account structs
// ─────────────────────────────────────────────

#[account]
pub struct Treasury {
    /// Admin who controls the treasury
    pub authority: Pubkey,
    /// Cumulative SOL deposited (tracking only)
    pub total_deposited: u64,
    /// PDA bump
    pub bump: u8,
}

#[account]
pub struct Airdrop {
    /// Unique numeric ID for this airdrop
    pub id: u64,
    /// Latitude × 1e6 (micro-degrees), e.g. 40.748817 → 40_748_817
    pub latitude: i64,
    /// Longitude × 1e6 (micro-degrees)
    pub longitude: i64,
    /// Reward in lamports
    pub reward_amount: u64,
    /// Unix timestamp when this drop expires
    pub expiry_timestamp: i64,
    /// Maximum number of users who can claim
    pub max_claims: u16,
    /// Current number of claims
    pub claims_count: u16,
    /// Rarity tier (0-4)
    pub rarity: u8,
    /// Whether the drop is still active
    pub active: bool,
    /// The admin who created this drop
    pub creator: Pubkey,
    /// PDA bump
    pub bump: u8,
}

#[account]
pub struct ClaimReceipt {
    /// The airdrop that was claimed
    pub airdrop: Pubkey,
    /// The wallet that claimed it
    pub claimer: Pubkey,
    /// Unix timestamp of claim
    pub claimed_at: i64,
    /// PDA bump
    pub bump: u8,
}
