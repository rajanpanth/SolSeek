import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";

// ─────────────────────────────────────────────────
// Solana Configuration
// ─────────────────────────────────────────────────

// IMPORTANT: Replace this with your deployed program ID after `anchor deploy`
// Using System Program ID as placeholder — deploy contract and update this!
export const PROGRAM_ID = new PublicKey(
    "11111111111111111111111111111111"
);

// Use devnet for the hackathon MVP
export const SOLANA_CLUSTER = "devnet";
export const SOLANA_RPC_URL = clusterApiUrl("devnet");
export const connection = new Connection(SOLANA_RPC_URL, "confirmed");

// ─────────────────────────────────────────────────
// PDA Seeds
// ─────────────────────────────────────────────────

export const TREASURY_SEED = "treasury";
export const AIRDROP_SEED = "airdrop";
export const CLAIM_SEED = "claim";

// ─────────────────────────────────────────────────
// Game Constants
// ─────────────────────────────────────────────────

/** Proximity radius in meters — user must be within this distance to claim */
export const CLAIM_RADIUS_METERS = 30;

/** Cooldown between claims in seconds */
export const CLAIM_COOLDOWN_SECONDS = 60;

/** Phantom deeplink base URL */
export const PHANTOM_DEEPLINK_BASE = "https://phantom.app/ul/v1";

/** App scheme for deeplink callbacks */
export const APP_SCHEME = "soldrop";

// ─────────────────────────────────────────────────
// Map Constants
// ─────────────────────────────────────────────────

export const DEFAULT_MAP_REGION = {
    latitude: 27.7172,
    longitude: 85.324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

/**
 * Convert micro-degrees (stored on-chain) to decimal degrees.
 * On-chain: 40_748_817 → 40.748817°
 */
export const microDegreesToDegrees = (micro: number): number => micro / 1_000_000;

/**
 * Convert decimal degrees to micro-degrees for on-chain storage.
 * 40.748817° → 40_748_817
 */
export const degreesToMicroDegrees = (deg: number): number =>
    Math.round(deg * 1_000_000);
