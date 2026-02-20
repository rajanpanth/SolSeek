import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WalletScreenProps {
    onGenerateWallet: () => void;
    onConnectPhantom: () => void;
    connecting: boolean;
}

const { width } = Dimensions.get("window");

export function WalletScreen({
    onGenerateWallet,
    onConnectPhantom,
    connecting,
}: WalletScreenProps) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Logo & Title */}
            <View style={styles.heroSection}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoEmoji}>🪂</Text>
                    <View style={styles.logoPulse} />
                </View>
                <Text style={styles.title}>SolSeek</Text>
                <Text style={styles.subtitle}>
                    Discover SOL airdrops{"\n"}in the real world
                </Text>
            </View>

            {/* Feature highlights */}
            <View style={styles.features}>
                <FeatureRow emoji="🗺️" text="Explore a live map of hidden drops" />
                <FeatureRow emoji="📍" text="Walk within 30m to unlock rewards" />
                <FeatureRow emoji="🐋" text="Find rare Whale drops worth 2 SOL" />
                <FeatureRow emoji="🏆" text="Compete on the global leaderboard" />
            </View>

            {/* Connection Buttons */}
            <View style={styles.buttonContainer}>
                {connecting ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#9945FF" />
                        <Text style={styles.loadingText}>Setting up your wallet...</Text>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={onGenerateWallet}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="flash" size={22} color="#fff" />
                            <Text style={styles.primaryButtonText}>Quick Start (Dev Wallet)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onConnectPhantom}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonEmoji}>👻</Text>
                            <Text style={styles.secondaryButtonText}>
                                Connect Phantom Wallet
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Footer */}
            <Text style={styles.footer}>Powered by Solana • Devnet</Text>
        </SafeAreaView>
    );
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
    return (
        <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{emoji}</Text>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0a0a1a",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    heroSection: {
        alignItems: "center",
        marginBottom: 48,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(153, 69, 255, 0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    logoEmoji: {
        fontSize: 48,
    },
    logoPulse: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: "rgba(153, 69, 255, 0.2)",
    },
    title: {
        fontSize: 42,
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.6)",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 24,
    },
    features: {
        marginBottom: 40,
        paddingHorizontal: 8,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    featureEmoji: {
        fontSize: 20,
        width: 36,
    },
    featureText: {
        fontSize: 15,
        color: "rgba(255, 255, 255, 0.8)",
        flex: 1,
    },
    buttonContainer: {
        gap: 14,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "#9945FF",
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: "#9945FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
    },
    secondaryButtonEmoji: {
        fontSize: 20,
    },
    secondaryButtonText: {
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: 17,
        fontWeight: "600",
    },
    loadingContainer: {
        alignItems: "center",
        gap: 12,
        paddingVertical: 20,
    },
    loadingText: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 15,
    },
    footer: {
        textAlign: "center",
        color: "rgba(255, 255, 255, 0.3)",
        fontSize: 12,
        marginTop: 32,
    },
});
