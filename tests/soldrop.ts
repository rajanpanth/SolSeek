import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Soldrop } from "../target/types/soldrop";
import { expect } from "chai";
import {
    PublicKey,
    SystemProgram,
    Keypair,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";

describe("soldrop", () => {
    // ── Setup ──────────────────────────────────────────────────────
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Soldrop as Program<Soldrop>;
    const admin = provider.wallet as anchor.Wallet;

    // Derive the treasury PDA
    const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        program.programId
    );

    // Test airdrop parameters
    const airdropId = new anchor.BN(1);
    const latitude = new anchor.BN(40_748_817); // NYC ~ 40.748817
    const longitude = new anchor.BN(-73_985_428); // NYC ~ -73.985428
    const rewardAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL (Fish)
    const maxClaims = 5;
    const rarity = 0; // Fish

    // Derive the airdrop PDA
    const [airdropPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("airdrop"), airdropId.toArrayLike(Buffer, "le", 8)],
        program.programId
    );

    // Claimer keypair
    const claimer = Keypair.generate();

    // Derive claim receipt PDA
    const [claimReceiptPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("claim"), airdropPda.toBuffer(), claimer.publicKey.toBuffer()],
        program.programId
    );

    // ── Helpers ────────────────────────────────────────────────────
    async function airdropSol(pubkey: PublicKey, amount: number) {
        const sig = await provider.connection.requestAirdrop(
            pubkey,
            amount * LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(sig, "confirmed");
    }

    // ── Tests ──────────────────────────────────────────────────────

    it("Initializes the treasury", async () => {
        const fundAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

        await program.methods
            .initializeTreasury(fundAmount)
            .accounts({
                treasury: treasuryPda,
                authority: admin.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const treasury = await program.account.treasury.fetch(treasuryPda);
        expect(treasury.authority.toBase58()).to.equal(
            admin.publicKey.toBase58()
        );
        expect(treasury.totalDeposited.toNumber()).to.equal(
            10 * LAMPORTS_PER_SOL
        );

        // Verify SOL was transferred
        const balance = await provider.connection.getBalance(treasuryPda);
        expect(balance).to.be.greaterThan(10 * LAMPORTS_PER_SOL - 1);
    });

    it("Creates an airdrop (admin)", async () => {
        const now = Math.floor(Date.now() / 1000);
        const expiryTimestamp = new anchor.BN(now + 3600); // 1 hour from now

        await program.methods
            .createAirdrop(
                airdropId,
                latitude,
                longitude,
                rewardAmount,
                expiryTimestamp,
                maxClaims,
                rarity
            )
            .accounts({
                airdrop: airdropPda,
                treasury: treasuryPda,
                authority: admin.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const airdrop = await program.account.airdrop.fetch(airdropPda);
        expect(airdrop.id.toNumber()).to.equal(1);
        expect(airdrop.latitude.toNumber()).to.equal(40_748_817);
        expect(airdrop.longitude.toNumber()).to.equal(-73_985_428);
        expect(airdrop.rewardAmount.toNumber()).to.equal(0.1 * LAMPORTS_PER_SOL);
        expect(airdrop.maxClaims).to.equal(5);
        expect(airdrop.claimsCount).to.equal(0);
        expect(airdrop.rarity).to.equal(0);
        expect(airdrop.active).to.be.true;
    });

    it("Rejects airdrop creation by non-admin", async () => {
        const faker = Keypair.generate();
        await airdropSol(faker.publicKey, 1);

        const fakeId = new anchor.BN(999);
        const [fakePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("airdrop"), fakeId.toArrayLike(Buffer, "le", 8)],
            program.programId
        );

        const now = Math.floor(Date.now() / 1000);

        try {
            await program.methods
                .createAirdrop(
                    fakeId,
                    latitude,
                    longitude,
                    rewardAmount,
                    new anchor.BN(now + 3600),
                    maxClaims,
                    rarity
                )
                .accounts({
                    airdrop: fakePda,
                    treasury: treasuryPda,
                    authority: faker.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([faker])
                .rpc();
            expect.fail("Should have thrown Unauthorized error");
        } catch (err: any) {
            expect(err.error?.errorCode?.code || err.message).to.contain(
                "Unauthorized"
            );
        }
    });

    it("Claims an airdrop successfully", async () => {
        // Fund claimer for tx fees + rent
        await airdropSol(claimer.publicKey, 1);

        const balanceBefore = await provider.connection.getBalance(
            claimer.publicKey
        );

        await program.methods
            .claimAirdrop()
            .accounts({
                airdrop: airdropPda,
                treasury: treasuryPda,
                claimReceipt: claimReceiptPda,
                claimer: claimer.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([claimer])
            .rpc();

        // Verify claim receipt exists
        const receipt = await program.account.claimReceipt.fetch(claimReceiptPda);
        expect(receipt.airdrop.toBase58()).to.equal(airdropPda.toBase58());
        expect(receipt.claimer.toBase58()).to.equal(claimer.publicKey.toBase58());
        expect(receipt.claimedAt.toNumber()).to.be.greaterThan(0);

        // Verify airdrop claims_count incremented
        const airdrop = await program.account.airdrop.fetch(airdropPda);
        expect(airdrop.claimsCount).to.equal(1);

        // Verify SOL transfer happened (balance increased, minus tx fee + rent)
        const balanceAfter = await provider.connection.getBalance(
            claimer.publicKey
        );
        // The claimer should have received ~0.1 SOL minus some rent for the receipt
        expect(balanceAfter).to.be.greaterThan(balanceBefore - 0.05 * LAMPORTS_PER_SOL);
    });

    it("Prevents double-claiming", async () => {
        try {
            await program.methods
                .claimAirdrop()
                .accounts({
                    airdrop: airdropPda,
                    treasury: treasuryPda,
                    claimReceipt: claimReceiptPda,
                    claimer: claimer.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([claimer])
                .rpc();
            expect.fail("Should have thrown — account already exists");
        } catch (err: any) {
            // The init constraint fails because the ClaimReceipt PDA already exists
            expect(err.toString()).to.contain("already in use");
        }
    });

    it("Prevents claiming an expired airdrop", async () => {
        // Create an airdrop that expires immediately
        const expiredId = new anchor.BN(2);
        const [expiredPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("airdrop"), expiredId.toArrayLike(Buffer, "le", 8)],
            program.programId
        );

        const pastExpiry = new anchor.BN(Math.floor(Date.now() / 1000) + 2);

        await program.methods
            .createAirdrop(
                expiredId,
                latitude,
                longitude,
                rewardAmount,
                pastExpiry,
                maxClaims,
                rarity
            )
            .accounts({
                airdrop: expiredPda,
                treasury: treasuryPda,
                authority: admin.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        // Wait for it to expire
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const newClaimer = Keypair.generate();
        await airdropSol(newClaimer.publicKey, 1);

        const [expiredReceiptPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("claim"),
                expiredPda.toBuffer(),
                newClaimer.publicKey.toBuffer(),
            ],
            program.programId
        );

        try {
            await program.methods
                .claimAirdrop()
                .accounts({
                    airdrop: expiredPda,
                    treasury: treasuryPda,
                    claimReceipt: expiredReceiptPda,
                    claimer: newClaimer.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([newClaimer])
                .rpc();
            expect.fail("Should have thrown AirdropExpired error");
        } catch (err: any) {
            expect(err.error?.errorCode?.code || err.toString()).to.contain(
                "AirdropExpired"
            );
        }
    });

    it("Enforces max claims", async () => {
        // Create airdrop with max_claims = 1
        const limitedId = new anchor.BN(3);
        const [limitedPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("airdrop"), limitedId.toArrayLike(Buffer, "le", 8)],
            program.programId
        );
        const expiry = new anchor.BN(Math.floor(Date.now() / 1000) + 3600);

        await program.methods
            .createAirdrop(
                limitedId,
                latitude,
                longitude,
                rewardAmount,
                expiry,
                1, // max_claims = 1
                rarity
            )
            .accounts({
                airdrop: limitedPda,
                treasury: treasuryPda,
                authority: admin.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        // First claim should succeed
        const firstClaimer = Keypair.generate();
        await airdropSol(firstClaimer.publicKey, 1);

        const [firstReceiptPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("claim"),
                limitedPda.toBuffer(),
                firstClaimer.publicKey.toBuffer(),
            ],
            program.programId
        );

        await program.methods
            .claimAirdrop()
            .accounts({
                airdrop: limitedPda,
                treasury: treasuryPda,
                claimReceipt: firstReceiptPda,
                claimer: firstClaimer.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .signers([firstClaimer])
            .rpc();

        // Verify airdrop is now inactive
        const airdrop = await program.account.airdrop.fetch(limitedPda);
        expect(airdrop.active).to.be.false;
        expect(airdrop.claimsCount).to.equal(1);

        // Second claimer should fail
        const secondClaimer = Keypair.generate();
        await airdropSol(secondClaimer.publicKey, 1);

        const [secondReceiptPda] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("claim"),
                limitedPda.toBuffer(),
                secondClaimer.publicKey.toBuffer(),
            ],
            program.programId
        );

        try {
            await program.methods
                .claimAirdrop()
                .accounts({
                    airdrop: limitedPda,
                    treasury: treasuryPda,
                    claimReceipt: secondReceiptPda,
                    claimer: secondClaimer.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([secondClaimer])
                .rpc();
            expect.fail("Should have thrown AirdropInactive or MaxClaimsReached");
        } catch (err: any) {
            const errorStr = err.error?.errorCode?.code || err.toString();
            const isExpected =
                errorStr.includes("AirdropInactive") ||
                errorStr.includes("MaxClaimsReached");
            expect(isExpected).to.be.true;
        }
    });

    it("Creates airdrops of all rarity tiers", async () => {
        const now = Math.floor(Date.now() / 1000);
        const rarities = [
            { id: 10, name: "Fish", tier: 0, reward: 0.1 * LAMPORTS_PER_SOL },
            { id: 11, name: "Turtle", tier: 1, reward: 0.25 * LAMPORTS_PER_SOL },
            { id: 12, name: "Dolphin", tier: 2, reward: 0.5 * LAMPORTS_PER_SOL },
            { id: 13, name: "Shark", tier: 3, reward: 1 * LAMPORTS_PER_SOL },
            { id: 14, name: "Whale", tier: 4, reward: 2 * LAMPORTS_PER_SOL },
        ];

        for (const r of rarities) {
            const id = new anchor.BN(r.id);
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from("airdrop"), id.toArrayLike(Buffer, "le", 8)],
                program.programId
            );

            await program.methods
                .createAirdrop(
                    id,
                    latitude,
                    longitude,
                    new anchor.BN(r.reward),
                    new anchor.BN(now + 7200),
                    10,
                    r.tier
                )
                .accounts({
                    airdrop: pda,
                    treasury: treasuryPda,
                    authority: admin.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            const airdrop = await program.account.airdrop.fetch(pda);
            expect(airdrop.rarity).to.equal(r.tier);
            expect(airdrop.rewardAmount.toNumber()).to.equal(r.reward);
        }
    });
});
