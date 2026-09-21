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

const projectRoot = __dirname;
// pnpm keeps the workspace list in pnpm-workspace.yaml rather than a
// `workspaces` field, so resolve the root directly. react-native-monorepo-tools
// looks for that field and its blockList assumes a Yarn layout.
const monorepoRoot = path.resolve(projectRoot, '..', '..');

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
const keplerInitializeCore = require.resolve(
  '@amazon-devices/react-native-kepler/Libraries/Core/InitializeCore',
);
const rnConfig = getReactNativeDefaultConfig(__dirname);
const defaultConfig = getExpoDefaultConfig(__dirname);

const config = {
  projectRoot: monorepoRoot,
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      // Alias lottie-react-native to the Kepler-compatible version so shared
      // package code resolves to the correct native module. Resolved rather
      // than hardcoded: pnpm hoists this to the workspace root, so a
      // packages/vega/node_modules path silently misses and Metro falls back
      // to the generic package, which does not render on Vega.
      'lottie-react-native': path.dirname(
        require.resolve('@amazon-devices/lottie-react-native/package.json'),
      ),
    },
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
      // The fork's InitializeCore reaches this list through React Native's
      // framework defaults, which only the React Native CLI installs. Under
      // `expo start` it is missing and the app never renders, so append it
      // explicitly. This package targets Kepler only, so hardcoding is safe.
      getModulesRunBeforeMainModule: (...args) => {
        const modules = rnConfig.serializer.getModulesRunBeforeMainModule(
          ...args,
        );
        return modules.includes(keplerInitializeCore)
          ? modules
          : [...modules, keplerInitializeCore];
      },
      // The Kepler CLI calls getPolyfills() with no arguments; Expo's
      // implementation destructures { platform }.
      getPolyfills: rnConfig.serializer.getPolyfills,
      // Note: under `react-native start` Fast Refresh does not apply live and
      // changes need an app relaunch. Under `expo start` it works.

    },
  },
  config,
);
