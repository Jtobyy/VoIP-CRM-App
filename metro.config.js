// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts = [
  ...new Set([...(defaultConfig.resolver.sourceExts || []), 'cjs', 'mjs', 'jsx']),
];
defaultConfig.resolver.resolverMainFields = ['react-native', 'module', 'main'];

module.exports = mergeConfig(defaultConfig, { resolver: defaultConfig.resolver });
