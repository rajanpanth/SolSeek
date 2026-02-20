/**
 * Web-only MapScreen using Leaflet + OpenStreetMap.
 * Metro automatically picks *.web.tsx over *.tsx on web platform.
 */
import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AirdropData } from "../hooks/useAirdrops";
import { LocationState } from "../hooks/useLocation";
import { ClaimModal } from "../components/ClaimModal";
import { haversineDistance } from "../utils/proximity";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { DEFAULT_MAP_REGION, CLAIM_RADIUS_METERS } from "../constants";

// Dynamically import Leaflet only on web (it manipulates DOM directly)
let L: any = null;

interface MapScreenProps {
    location: LocationState;
    airdrops: AirdropData[];
    loading: boolean;
    onRefresh: () => void;
    onClaim: (airdrop: AirdropData) => void;
    canClaim: (airdrop: AirdropData) => { eligible: boolean; reason?: string };
    claiming: boolean;
    claimSuccess: boolean;
    claimError: string | null;
    onResetClaim: () => void;
    balance: number;
    walletAddress: string;
}

export function MapScreen({
    location,
    airdrops,
    loading,
    onRefresh,
    onClaim,
    canClaim,
    claiming,
    claimSuccess,
    claimError,
    onResetClaim,
    balance,
    walletAddress,
}: MapScreenProps) {
    const [selectedDrop, setSelectedDrop] = useState<AirdropData | null>(null);
    const [showModal, setShowModal] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userCircleRef = useRef<any>(null);

    // Inject Leaflet CSS
    useEffect(() => {
        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }
    }, []);

    // Initialize Leaflet map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const initMap = async () => {
            L = await import("leaflet");

            // Fix default icon paths
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const center: [number, number] = location.ready
                ? [location.latitude, location.longitude]
                : [DEFAULT_MAP_REGION.latitude, DEFAULT_MAP_REGION.longitude];

            const map = L.map(mapContainerRef.current!, {
                center,
                zoom: 15,
                zoomControl: true,
            });

            // Dark-themed tiles from CartoDB
            L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                {
                    attribution: "© OpenStreetMap contributors © CARTO",
                    maxZoom: 19,
                }
            ).addTo(map);

            mapInstanceRef.current = map;
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update user location circle
    useEffect(() => {
        if (!mapInstanceRef.current || !L || !location.ready) return;

        if (userCircleRef.current) {
            userCircleRef.current.remove();
        }

        // Blue dot for user position
        const userIcon = L.divIcon({
            html: `<div style="width:16px;height:16px;background:#4a9eff;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(74,158,255,0.6)"></div>`,
            className: "",
            iconSize: [16, 16],
            iconAnchor: [8, 8],
        });

        const marker = L.marker([location.latitude, location.longitude], { icon: userIcon }).addTo(
            mapInstanceRef.current
        );

        // Claim radius circle
        const circle = L.circle([location.latitude, location.longitude], {
            radius: CLAIM_RADIUS_METERS,
            fillColor: "#9945FF",
            fillOpacity: 0.08,
            color: "#9945FF",
            weight: 1.5,
        }).addTo(mapInstanceRef.current);

        userCircleRef.current = L.layerGroup([marker, circle]).addTo(mapInstanceRef.current);

        // Pan to user
        mapInstanceRef.current.setView([location.latitude, location.longitude], 15);
    }, [location.ready, location.latitude, location.longitude]);

    // Render airdrop markers
    useEffect(() => {
        if (!mapInstanceRef.current || !L) return;

        // Clear old markers
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        airdrops.forEach((drop) => {
            const config = drop.rarityConfig;
            const icon = L.divIcon({
                html: `<div style="
                    font-size:24px;
                    line-height:1;
                    filter:drop-shadow(0 2px 6px ${config.glowColor});
                    cursor:pointer;
                ">${config.emoji}</div>`,
                className: "",
                iconSize: [30, 30],
                iconAnchor: [15, 15],
            });

            const marker = L.marker([drop.latitude, drop.longitude], { icon })
                .addTo(mapInstanceRef.current)
                .bindPopup(
                    `<div style="color:#fff;background:#1a1a2e;padding:8px;border-radius:8px;min-width:140px">
                        <b style="font-size:15px">${config.emoji} ${config.name}</b><br/>
                        <span style="color:#9945FF;font-weight:700">${(drop.rewardAmount / LAMPORTS_PER_SOL).toFixed(2)} SOL</span><br/>
                        <span style="font-size:11px;color:#aaa">${drop.claimsCount}/${drop.maxClaims} claimed</span>
                    </div>`,
                    { className: "soldrop-popup" }
                )
                .on("click", () => {
                    setSelectedDrop(drop);
                    setShowModal(true);
                });

            markersRef.current.push(marker);
        });
    }, [airdrops]);

    const centerOnUser = () => {
        if (mapInstanceRef.current && location.ready) {
            mapInstanceRef.current.setView([location.latitude, location.longitude], 16);
        }
    };

    return (
        <View style={styles.container}>
            {/* Top HUD */}
            <View style={styles.topBar}>
                <View style={styles.walletBadge}>
                    <Ionicons name="wallet" size={14} color="#9945FF" />
                    <Text style={styles.walletBalance}>{balance.toFixed(2)} SOL</Text>
                </View>
                <View style={styles.dropCountBadge}>
                    <Text style={styles.dropCountText}>
                        {airdrops.length} drops active
                    </Text>
                </View>
                <TouchableOpacity onPress={onRefresh} disabled={loading} style={styles.refreshBtn}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#9945FF" />
                    ) : (
                        <Ionicons name="refresh" size={18} color="#9945FF" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Leaflet Map Container */}
            <div
                ref={mapContainerRef as any}
                style={{ flex: 1, width: "100%", height: "100%" }}
            />

            {/* Floating action buttons */}
            <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
                <Ionicons name="locate" size={22} color="#9945FF" />
            </TouchableOpacity>

            {/* Location loading overlay */}
            {!location.ready && (
                <View style={styles.locationOverlay}>
                    <ActivityIndicator size="small" color="#9945FF" />
                    <Text style={styles.locationText}>  Finding your location...</Text>
                </View>
            )}

            {/* Claim Modal */}
            {selectedDrop && (
                <ClaimModal
                    visible={showModal}
                    airdrop={selectedDrop}
                    userLocation={
                        location.ready
                            ? { latitude: location.latitude, longitude: location.longitude }
                            : null
                    }
                    distance={
                        location.ready
                            ? haversineDistance(
                                { latitude: location.latitude, longitude: location.longitude },
                                { latitude: selectedDrop.latitude, longitude: selectedDrop.longitude }
                            )
                            : null
                    }
                    eligibility={canClaim(selectedDrop)}
                    claiming={claiming}
                    claimSuccess={claimSuccess}
                    claimError={claimError}
                    onClaim={() => onClaim(selectedDrop)}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedDrop(null);
                        onResetClaim();
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0a0a1a" },
    topBar: {
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        zIndex: 1000,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    walletBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(10,10,26,0.9)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(153,69,255,0.4)",
    },
    walletBalance: { color: "#fff", fontWeight: "700", fontSize: 13 },
    dropCountBadge: {
        flex: 1,
        backgroundColor: "rgba(10,10,26,0.9)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    dropCountText: { color: "rgba(255,255,255,0.7)", fontWeight: "600", fontSize: 12 },
    refreshBtn: {
        backgroundColor: "rgba(10,10,26,0.9)",
        padding: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    locateBtn: {
        position: "absolute",
        bottom: 24,
        right: 16,
        zIndex: 1000,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "rgba(10,10,26,0.95)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(153,69,255,0.4)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
    locationOverlay: {
        position: "absolute",
        bottom: 80,
        left: 12,
        zIndex: 1000,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(10,10,26,0.9)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(153,69,255,0.3)",
    },
    locationText: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
});
