// ⚠️ CRITICAL: These polyfills MUST be imported before anything else
// They provide crypto and encoding APIs that @solana/web3.js needs
import { Platform } from "react-native";

// react-native-get-random-values — native only; web has crypto.getRandomValues built-in
if (Platform.OS !== "web") {
    require("react-native-get-random-values");
    // TextEncoder polyfill — web has this natively, native may not
    require("text-encoding");
}

import { Buffer } from "buffer";
(global as any).Buffer = Buffer;

// URL polyfill for React Native (not needed on web)
if (Platform.OS !== "web" && typeof URL === "undefined") {
    (global as any).URL = class URL {
        href: string;
        constructor(url: string) {
            this.href = url;
        }
        toString() {
            return this.href;
        }
    };
}


import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

// Hooks
import { useWallet } from "./src/hooks/useWallet";
import { useLocation } from "./src/hooks/useLocation";
import { useAirdrops } from "./src/hooks/useAirdrops";
import { useClaim } from "./src/hooks/useClaim";

// Screens
import { WalletScreen } from "./src/screens/WalletScreen";
import { MapScreen } from "./src/screens/MapScreen";
import { LeaderboardScreen } from "./src/screens/LeaderboardScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

const Tab = createBottomTabNavigator();

// ── Error Boundary to surface silent crashes on web ──
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
> {
    constructor(props: any) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: any) {
        console.error("[ErrorBoundary] Caught:", error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <View style={{ flex: 1, backgroundColor: "#0a0a1a", justifyContent: "center", alignItems: "center", padding: 24 }}>
                    <View style={{ backgroundColor: "rgba(255,0,0,0.1)", borderRadius: 12, padding: 20, borderWidth: 1, borderColor: "rgba(255,0,0,0.3)" }}>
                        <Text style={{ color: "#ff6b6b", fontSize: 16, fontWeight: "700", marginBottom: 8 }}>App Crash</Text>
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{this.state.error.toString()}</Text>
                    </View>
                </View>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    const wallet = useWallet();
    const location = useLocation();
    const { activeAirdrops, loading, refresh } = useAirdrops();
    const claim = useClaim(
        wallet.keypair,
        location.ready
            ? { latitude: location.latitude, longitude: location.longitude }
            : null
    );

    // ── Show wallet connection screen if not connected ──
    if (!wallet.connected) {
        return (
            <>
                <StatusBar style="light" />
                <WalletScreen
                    onGenerateWallet={wallet.generateLocalWallet}
                    onConnectPhantom={wallet.connectPhantom}
                    connecting={wallet.connecting}
                />
            </>
        );
    }

    // ── Main app with tab navigation ──
    return (
        <>
            <StatusBar style="light" />
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarStyle: {
                            backgroundColor: "#0a0a1a",
                            borderTopColor: "rgba(255, 255, 255, 0.06)",
                            borderTopWidth: 1,
                            height: 85,
                            paddingBottom: 20,
                            paddingTop: 8,
                        },
                        tabBarActiveTintColor: "#9945FF",
                        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.3)",
                        tabBarLabelStyle: {
                            fontSize: 11,
                            fontWeight: "600",
                        },
                        tabBarIcon: ({ color, size, focused }) => {
                            let iconName: string;
                            switch (route.name) {
                                case "Map":
                                    iconName = focused ? "map" : "map-outline";
                                    break;
                                case "Leaderboard":
                                    iconName = focused ? "trophy" : "trophy-outline";
                                    break;
                                case "Profile":
                                    iconName = focused ? "person" : "person-outline";
                                    break;
                                default:
                                    iconName = "ellipse";
                            }
                            return (
                                <View style={focused ? tabStyles.activeIcon : undefined}>
                                    <Ionicons name={iconName as any} size={size} color={color} />
                                </View>
                            );
                        },
                    })}
                >
                    <Tab.Screen name="Map">
                        {() => (
                            <MapScreen
                                location={location}
                                airdrops={activeAirdrops}
                                loading={loading}
                                onRefresh={refresh}
                                onClaim={claim.claimAirdrop}
                                canClaim={claim.canClaim}
                                claiming={claim.claiming}
                                claimSuccess={claim.success}
                                claimError={claim.error}
                                onResetClaim={claim.resetClaim}
                                balance={wallet.balance}
                                walletAddress={wallet.publicKey?.toBase58() || ""}
                            />
                        )}
                    </Tab.Screen>
                    <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
                    <Tab.Screen name="Profile">
                        {() => (
                            <ProfileScreen
                                walletAddress={wallet.publicKey?.toBase58() || ""}
                                balance={wallet.balance}
                                onRefreshBalance={wallet.refreshBalance}
                                onDisconnect={wallet.disconnect}
                            />
                        )}
                    </Tab.Screen>
                </Tab.Navigator>
            </NavigationContainer>
        </>
    );
}

const tabStyles = StyleSheet.create({
    activeIcon: {
        shadowColor: "#9945FF",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
    },
});
