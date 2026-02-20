// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable web support
config.resolver.platforms = ["web", "ios", "android", "native"];

// Polyfill Node.js built-ins for web (@solana/web3.js needs these)
config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    events: path.resolve(__dirname, "node_modules/events"),
    stream: path.resolve(__dirname, "node_modules/stream-browserify"),
    crypto: path.resolve(__dirname, "node_modules/crypto-browserify"),
    assert: path.resolve(__dirname, "node_modules/assert"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    os: require.resolve("os-browserify/browser"),
    url: require.resolve("url"),
};

module.exports = config;
