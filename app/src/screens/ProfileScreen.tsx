import React from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { shortenAddress } from "../utils/formatSol";
import { RARITY_CONFIGS, RarityTier } from "../constants/rarity";

interface ProfileScreenProps {
    walletAddress: string;
    balance: number;
    onRefreshBalance: () => void;
    onDisconnect: () => void;
}

export function ProfileScreen({
    walletAddress,
    balance,
    onRefreshBalance,
    onDisconnect,
}: ProfileScreenProps) {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <Text style={styles.headerTitle}>👤 Profile</Text>

                {/* Wallet Card */}
                <View style={styles.walletCard}>
                    <View style={styles.walletHeader}>
                        <Ionicons name="wallet" size={24} color="#9945FF" />
                        <Text style={styles.walletLabel}>Wallet</Text>
                    </View>
                    <Text style={styles.walletAddress}>{shortenAddress(walletAddress, 8)}</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceAmount}>{balance.toFixed(4)}</Text>
                        <Text style={styles.balanceCurrency}>SOL</Text>
                        <TouchableOpacity onPress={onRefreshBalance} style={styles.refreshBtn}>
                            <Ionicons name="refresh" size={16} color="#9945FF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Rarity Guide */}
                <Text style={styles.sectionTitle}>Rarity Guide</Text>
                <View style={styles.rarityGrid}>
                    {Object.values(RARITY_CONFIGS).map((config) => (
                        <View
                            key={config.tier}
                            style={[styles.rarityCard, { borderColor: config.color + "40" }]}
                        >
                            <Text style={styles.rarityEmoji}>{config.emoji}</Text>
                            <Text style={[styles.rarityName, { color: config.color }]}>
                                {config.name}
                            </Text>
                            <Text style={styles.rarityReward}>{config.reward} SOL</Text>
                            <Text style={styles.rarityProb}>
                                {(config.probability * 100).toFixed(0)}% chance
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Game Info */}
                <Text style={styles.sectionTitle}>How to Play</Text>
                <View style={styles.infoCard}>
                    <InfoRow
                        icon="walk"
                        text="Walk around to discover airdrops on the map"
                    />
                    <InfoRow
                        icon="location"
                        text="Get within 30m of a drop to unlock it"
                    />
                    <InfoRow icon="time" text="Claim before the timer runs out!" />
                    <InfoRow icon="shield-checkmark" text="60s cooldown between claims" />
                    <InfoRow icon="trophy" text="Climb the leaderboard with each claim" />
                </View>

                {/* Disconnect */}
                <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={onDisconnect}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out" size={20} color="#FF6B6B" />
                    <Text style={styles.disconnectText}>Disconnect Wallet</Text>
                </TouchableOpacity>

                {/* Footer */}
                <Text style={styles.version}>SolSeek v1.0.0 • Devnet MVP</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon as any} size={18} color="#9945FF" />
            <Text style={styles.infoText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0a0a1a",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 100,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#ffffff",
        marginBottom: 20,
    },
    walletCard: {
        backgroundColor: "rgba(153, 69, 255, 0.08)",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(153, 69, 255, 0.2)",
        marginBottom: 28,
    },
    walletHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    walletLabel: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 14,
        fontWeight: "600",
    },
    walletAddress: {
        color: "#fff",
        fontSize: 15,
        fontFamily: "monospace",
        marginBottom: 16,
        opacity: 0.8,
    },
    balanceRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 6,
    },
    balanceAmount: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "800",
    },
    balanceCurrency: {
        color: "#9945FF",
        fontSize: 18,
        fontWeight: "700",
    },
    refreshBtn: {
        marginLeft: 12,
        padding: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 14,
    },
    rarityGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 28,
    },
    rarityCard: {
        width: "30%",
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
    },
    rarityEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    rarityName: {
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 2,
    },
    rarityReward: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.7)",
        fontWeight: "600",
    },
    rarityProb: {
        fontSize: 10,
        color: "rgba(255, 255, 255, 0.4)",
        marginTop: 2,
    },
    infoCard: {
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderRadius: 16,
        padding: 16,
        gap: 14,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    infoText: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 14,
        flex: 1,
    },
    disconnectButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "rgba(255, 107, 107, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(255, 107, 107, 0.2)",
        marginBottom: 20,
    },
    disconnectText: {
        color: "#FF6B6B",
        fontSize: 16,
        fontWeight: "600",
    },
    version: {
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.2)",
        fontSize: 12,
    },
});
