# 🪂 SolDrop — Geo-Based Airdrop Game on Solana

> A real-world exploration mobile game where users discover time-limited SOL airdrops on a global map. Walk, explore, and claim crypto rewards — built on Solana.

<img src="https://img.shields.io/badge/Solana-Devnet-purple?style=flat-square" alt="Solana" /> <img src="https://img.shields.io/badge/Anchor-0.30.1-blue?style=flat-square" alt="Anchor" /> <img src="https://img.shields.io/badge/Expo-52-black?style=flat-square" alt="Expo" />

---

## 🎮 Concept

SolDrop is like Pokémon Go for crypto. Airdrops appear randomly across the world with different rarity tiers and time limits. Users must physically walk to a drop's location (within 30 meters) to claim it on-chain.

### Rarity Tiers

| Tier   | Emoji | Reward    | Probability |
|--------|-------|-----------|-------------|
| 🐟 Fish   | 🐟 | 0.1 SOL  | 45%         |
| 🐢 Turtle | 🐢 | 0.25 SOL | 30%         |
| 🐬 Dolphin| 🐬 | 0.5 SOL  | 15%         |
| 🦈 Shark  | 🦈 | 1.0 SOL  | 8%          |
| 🐋 Whale  | 🐋 | 2.0 SOL  | 2%          |

---

## 📁 Project Structure

```
soldrop/
├── Anchor.toml              # Anchor workspace config
├── Cargo.toml               # Rust workspace
├── package.json             # Root dependencies (tests + CLI)
├── tsconfig.json            # TypeScript config
│
├── programs/soldrop/        # 🔗 ANCHOR SMART CONTRACT
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs           # Program entry point
│       ├── state.rs         # Account structs (Treasury, Airdrop, ClaimReceipt)
│       ├── errors.rs        # Custom error codes
│       └── instructions/
│           ├── mod.rs
│           ├── initialize_treasury.rs
│           ├── create_airdrop.rs
│           └── claim_airdrop.rs
│
├── tests/                   # 🧪 ANCHOR TESTS
│   └── soldrop.ts           # Full test suite (7 test cases)
│
├── app/                     # 📱 EXPO MOBILE APP
│   ├── App.tsx              # Root component + navigation
│   ├── app.json             # Expo config
│   ├── package.json
│   └── src/
│       ├── constants/       # Rarity tiers, program ID, game config
│       ├── hooks/           # useWallet, useLocation, useAirdrops, useClaim
│       ├── screens/         # WalletScreen, MapScreen, Leaderboard, Profile
│       ├── components/      # AirdropMarker, ClaimModal, CountdownTimer, RewardAnimation
│       └── utils/           # Proximity (haversine), formatting, QR stub
│
├── cli/                     # 🛠️ ADMIN CLI
│   └── spawn-drops.ts       # Batch-create random airdrops
│
└── docs/                    # 📚 DOCUMENTATION
    ├── TOKENOMICS.md        # Treasury design analysis
    ├── SECURITY.md          # Anti-cheat analysis + limitations
    └── DEMO_SCRIPT.md       # Hackathon pitch script
```

---

## 🔗 Smart Contract — Design Decisions

### Account Architecture

```
Treasury PDA
  Seeds: [b"treasury"]
  Holds: authority, total_deposited, bump
  Role:  Holds all SOL for airdrop rewards

Airdrop PDA
  Seeds: [b"airdrop", id.to_le_bytes()]
  Holds: id, lat, lon, reward, expiry, max_claims, claims_count, rarity, active
  Role:  Represents a single geo-located drop

ClaimReceipt PDA
  Seeds: [b"claim", airdrop.key(), claimer.key()]
  Holds: airdrop, claimer, claimed_at
  Role:  Prevents double-claiming (existence = already claimed)
```

### Why PDAs for Claims?

Instead of storing claimed wallets in a list (expensive, unbounded), we create a small PDA per claim. If the PDA already exists, Anchor's `init` constraint rejects the transaction automatically. This is O(1) and costs only ~0.001 SOL in rent per claim.

### Coordinate Storage

GPS coordinates are stored as **micro-degrees** (i64):
- `40.748817°` → `40_748_817` (integer)
- Gives ~0.1 meter precision
- No floating-point issues on-chain

---

## 🚀 Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) + [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) 0.30.1+
- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) + Expo Go app on your phone

### 1. Setup Solana

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Configure for devnet
solana config set --url devnet

# Create a wallet (if you don't have one)
solana-keygen new --no-bip39-passphrase

# Fund your wallet
solana airdrop 5
```

### 2. Build & Test the Smart Contract

```bash
# Install dependencies
npm install

# Build the Anchor program
anchor build

# Run tests (starts a local validator automatically)
anchor test
```

### 3. Deploy to Devnet

```bash
# Deploy
anchor deploy --provider.cluster devnet

# Note the program ID from the output and update:
# - programs/soldrop/src/lib.rs → declare_id!()
# - Anchor.toml → [programs.devnet]
# - app/src/constants/program.ts → PROGRAM_ID
# - cli/spawn-drops.ts → PROGRAM_ID

# Rebuild and redeploy with new ID
anchor build
anchor deploy --provider.cluster devnet
```

### 4. Spawn Test Airdrops

```bash
# Spawn 20 drops near your location
npx ts-node cli/spawn-drops.ts --count 20 --lat <YOUR_LAT> --lon <YOUR_LON>
```

### 5. Run the Mobile App

```bash
cd app
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

## 🔒 Anti-Cheat (MVP)

| Protection | Enforcement | Strength |
|------------|-------------|----------|
| Double-claim prevention | On-chain (ClaimReceipt PDA) | ✅ Strong |
| Expiry validation | On-chain (Clock) | ✅ Strong |
| Max claims per drop | On-chain (counter) | ✅ Strong |
| Admin-only creation | On-chain (authority check) | ✅ Strong |
| 30m proximity radius | Client-side (Haversine) | ⚠️ Weak |
| 60s cooldown | Client-side (state) | ⚠️ Weak |
| QR verification (Whale) | Stub | 🔶 Placeholder |

> See [docs/SECURITY.md](docs/SECURITY.md) for the full security analysis and roadmap.

---

## 💰 Tokenomics

The MVP uses a **Pre-Funded Treasury** model:
1. Admin creates a Treasury PDA
2. Admin transfers SOL to the treasury
3. Airdrops are created and funded from this pool
4. Users claim rewards, which are transferred from treasury → user wallet

> See [docs/TOKENOMICS.md](docs/TOKENOMICS.md) for a full analysis of 3 treasury models.

---

## 🎯 Bonus Features

- **NFT Badge Mint** — Whale tier claims can mint an NFT badge (future: Metaplex integration)
- **Global Leaderboard** — Aggregates ClaimReceipt accounts to rank top claimers
- **Heatmap** — Map overlay showing drop density (planned)
- **Admin CLI** — Batch-create drops with configurable rarity probabilities

---

## 🏆 Demo Script

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for a step-by-step hackathon pitch guide.

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Solana (Devnet) |
| Smart Contract | Anchor 0.30.1 (Rust) |
| Mobile | React Native (Expo 52) |
| Map | react-native-maps (Google Maps) |
| Wallet | Keypair + Phantom deeplink |
| Testing | ts-mocha + Chai |

---

## 📄 License

MIT — Built for hackathons, open for everyone.
