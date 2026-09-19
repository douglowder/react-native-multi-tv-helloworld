/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

const path = require('path');
const {getDefaultConfig: getExpoDefaultConfig} = require('expo/metro-config');
const {
  getDefaultConfig: getReactNativeDefaultConfig,
  mergeConfig,
} = require('@react-native/metro-config');
const { getMetroTools, getMonorepoRoot } = require("react-native-monorepo-tools");

const projectRoot = __dirname;
const monorepoRoot = getMonorepoRoot();
const metroTools = getMetroTools();

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
// The Kepler CLI registers the out-of-tree `kepler` platform through React
// Native's framework defaults, which only apply when @react-native/metro-config's
// getDefaultConfig runs. Call it for the platform redirect, then layer Expo's
// defaults on top.
const rnConfig = getReactNativeDefaultConfig(__dirname);
const defaultConfig = getExpoDefaultConfig(__dirname);

const config = {
  projectRoot: monorepoRoot,
  watchFolders: [monorepoRoot, ...metroTools.watchFolders],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      ...metroTools.extraNodeModules,
      // Alias lottie-react-native to the Kepler-compatible version
      // so shared package code resolves to the correct native module
      'lottie-react-native': path.resolve(projectRoot, 'node_modules', '@amazon-devices', 'lottie-react-native'),
    },
    blockList: metroTools.blockList,
  },
};

module.exports = mergeConfig(
  defaultConfig,
  {
    // Expo's Metro transform worker and its transform options are not
    // compatible with the Kepler runtime: the bundle builds and loads, but the
    // app never renders. Both must come from React Native together -- either
    // one alone still fails.
    transformerPath: rnConfig.transformerPath,
    transformer: {
      getTransformOptions: rnConfig.transformer.getTransformOptions,
    },
    resolver: {
      // Rewrites `react-native` to @amazon-devices/react-native-kepler when
      // bundling for the kepler platform.
      resolveRequest: rnConfig.resolver.resolveRequest,
    },
    serializer: {
      getModulesRunBeforeMainModule:
        rnConfig.serializer.getModulesRunBeforeMainModule,
      // The Kepler CLI calls getPolyfills() with no arguments; Expo's
      // implementation destructures { platform }.
      getPolyfills: rnConfig.serializer.getPolyfills,
      // KNOWN LIMITATION: Fast Refresh does not apply live with this config.
      // Metro rebuilds on save, but the change only appears after relaunching
      // the app. Fast Refresh works with React Native's config.

    },
  },
  config,
);
