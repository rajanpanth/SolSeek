use anchor_lang::prelude::*;

#[error_code]
pub enum SolDropError {
    #[msg("This airdrop has expired")]
    AirdropExpired,

    #[msg("Maximum claims reached for this airdrop")]
    MaxClaimsReached,

    #[msg("You have already claimed this airdrop")]
    AlreadyClaimed,

    #[msg("Treasury has insufficient funds")]
    InsufficientTreasuryFunds,

    #[msg("You are not authorized to perform this action")]
    Unauthorized,

    #[msg("This airdrop is no longer active")]
    AirdropInactive,

    #[msg("Cooldown period has not elapsed. Wait before claiming again")]
    CooldownNotElapsed,

    #[msg("Invalid rarity tier")]
    InvalidRarity,

    #[msg("Invalid reward amount for the given rarity")]
    InvalidRewardAmount,

    #[msg("Expiry timestamp must be in the future")]
    InvalidExpiry,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
