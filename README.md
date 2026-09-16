# Multi-TV Hello World

A monorepo for building TV apps across multiple platforms using Yarn workspaces, including Vega OS (Fire TV), Expo TV (Android TV / Apple TV), and web.

![Screenshots](./images/screenshots.png)

## Introduction

This project demonstrates how to share React Native code across multiple TV platforms using a Yarn workspaces monorepo. It includes:

- A shared package with common components, screens, and utilities
- A Vega app targeting Fire TV
- An Expo TV app targeting Android TV and Apple TV

### Supported Platforms

| Platform      | Target Devices       |
| ------------- | -------------------- |
| Vega (Kepler) | Fire TV              |
| Expo TV       | Android TV, Apple TV |
| Expo Web      | Browser              |

## Project Structure

```
├── package.json                 # Root workspace config (Yarn 4)
├── packages/
│   ├── shared/                  # @multitv/shared
│   │   ├── src/
│   │   │   ├── components/      # Header, HeaderLogo, Tile, ApiDemo, IconReactNativeAnimated
│   │   │   ├── screens/         # HomeScreen
│   │   │   ├── data/            # Tile definitions
│   │   │   ├── services/        # HTTP client (fetch-based)
│   │   │   ├── utils/           # Scaling utilities
│   │   │   └── assets/          # Platform logos, background images
│   │   └── index.ts             # Public API exports
│   ├── expotv/                  # @multitv/expotv
│   │   ├── app/                 # Expo Router pages
│   │   ├── components/          # TV-specific components
│   │   ├── layouts/             # Tab layouts (native + web)
│   │   ├── hooks/               # useScale, useColorScheme, useTextStyles
│   │   ├── constants/           # Colors, TextStyles
│   │   └── assets/              # Images, fonts, TV icons
│   └── vega/                    # @multitv/vega (symlink)
│       ├── src/
│       │   └── App.tsx
│       ├── test/
│       ├── manifest.toml
│       └── package.json
```

## Prerequisites

### Core Requirements

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Yarn](https://yarnpkg.com/) (v4.5.0 or higher)
- [Git](https://git-scm.com/)

### Platform-Specific Requirements

**Vega (Fire TV)**

Vega development requires the Vega SDK and Yarn configuration for Amazon device packages.

1. [Install the Vega Developer Tools](https://developer.amazon.com/docs/vega/latest/install-vega-sdk.html)
2. [Configure Yarn for Vega](https://developer.amazon.com/docs/vega/latest/configure-package-managers.html)

**Expo TV**

- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio with an Android TV system image (for Android TV)
- Xcode (for Apple TV)

## Quick Start

```bash
# Install all workspace dependencies
yarn

# Build the Vega/Fire TV app (debug)
yarn vega:build

# Run on Vega Virtual Device (Mac M-series)
yarn vega:vvd:mseries

# Run on Vega Virtual Device (Intel Mac)
yarn vega:vvd:intel

# Run on a Fire TV Stick (pass DSN)
yarn vega:firetv <DSN>

# Prebuild Expo TV native projects
yarn expotv:prebuild

# Run on Android TV
yarn expotv:android

# Run on Apple TV
yarn expotv:ios

# Run on web
yarn expotv:web
```

## Build and Run

You can build and run using either the CLI or the [Vega Studio IDE extension](https://developer.amazon.com/docs/vega/0.22/setup-extension.html). We recommend the IDE, which provides build, run, and device management directly from the sidebar panel. Vega Studio also has [monorepo support](https://developer.amazon.com/docs/vega/0.22/monorepo-support.html) that automatically detects the workspace layout and imports Vega sub-packages when you open the project.

### Vega (Fire TV) CLI

Build the project:

```bash
# Debug build (recommended for development, enables Fast Refresh)
yarn workspace @multitv/vega run build:debug

# Release build
yarn workspace @multitv/vega run build:release
```

Run on a Vega virtual device:

```bash
vega virtual-device start

# Mac M-series (aarch64) - using yarn script
yarn vega:vvd:mseries

# Intel Mac (x86_64) - using yarn script
yarn vega:vvd:intel

# Or directly with the Vega CLI
# Mac M-series (aarch64)
vega run-app packages/vega/build/aarch64-debug/vega_aarch64.vpkg com.amazondeveloper.hellosharedworkspace.main -d VirtualDevice

# Intel Mac (x86_64)
vega run-app packages/vega/build/x86_64-debug/vega_x86_64.vpkg com.amazondeveloper.hellosharedworkspace.main -d VirtualDevice
```

Run a prebuilt package against the packager (for example, a `.vpkg` downloaded
from an EAS build). Each step is a separate script, so you can repeat any one of
them without redoing the others. Run these from `packages/vega`:

```bash
yarn vvd:start                          # boot the virtual device
yarn start                              # Metro, in a second terminal
yarn vvd:port                           # let the device reach Metro on 8081
yarn vvd:install path/to/vega_aarch64.vpkg
yarn vvd:launch
```

A debug package installed this way loads its bundle from Metro, so Fast Refresh
works. When you are finished:

```bash
yarn vvd:uninstall
yarn vvd:stop
```

Run on a Fire TV Stick (replace `<DSN>` with your device serial number):

```bash
# Using the yarn script
yarn vega:firetv <DSN>

# Or directly
vega run-app packages/vega/build/armv7-release/vega_armv7.vpkg com.amazondeveloper.hellosharedworkspace.main -d <DSN>
```

The `vega run-app` command takes the form `vega run-app <Vpkg path> <App ID> -d <device>`. The App ID is the interactive component id from `manifest.toml` (here, `com.amazondeveloper.hellosharedworkspace.main`). Use `VirtualDevice` for the VVD or the device serial number (DSN) for a Fire TV Stick. See the [Vega CLI reference](https://developer.amazon.com/docs/vega/0.22/cli-tools.html) for details.

[Fast Refresh](https://reactnative.dev/docs/fast-refresh) is available in debug builds. See [Set Up Fast Refresh](https://developer.amazon.com/docs/vega/latest/fast-refresh.html) for configuration.

### Expo TV

> **Note:** Apple TV (iOS) must run on port 8081. Avoid running Vega and Expo TV builds at the same time, as they use separate Metro instances that can conflict.

Prebuild the native projects first:

```bash
yarn expotv:prebuild
```

Then run on your target platform:

```bash
# Android TV
yarn expotv:android

# Apple TV
yarn expotv:ios

# Web
yarn expotv:web
```

## EAS Builds

The Vega app builds on [EAS Build](https://docs.expo.dev/build/introduction/)
workers. Vega is not an EAS platform, so the build uses a
[custom build config](https://docs.expo.dev/custom-builds/get-started/) that
installs the Vega Developer Tools on the worker before bundling. Both macOS and
Linux workers work.

### Files

| File | Purpose |
| --- | --- |
| `packages/vega/eas.json` | The `vega` build profile, extending a shared `base` profile |
| `packages/vega/.eas/build/vega-build.yml` | Custom build steps: install the Vega SDK, build, upload |
| `packages/vega/.eas/workflows/build.yml` | Manual workflow, started from GitHub or the EAS dashboard |

### Running a build

From `packages/vega`:

```bash
eas build -p android -e vega
```

The `-p android` flag only selects a Linux worker image. Nothing
Android-specific runs; the platform flag is required because Vega is not one of
the platforms EAS knows about.

To start the same build from GitHub or the EAS dashboard, dispatch the
**Vega build workflow** manually.

### What the build does

1. Installs the Vega Developer Tools with `NONINTERACTIVE=true`, pinned to
   `VEGA_SDK_VERSION` in the `vega` profile. `SKIP_VVD_INSTALL=true` omits the
   virtual device, which cannot run on a headless worker and is not needed to
   produce a package.
2. Builds both debug and release `.vpkg` files for `armv7`, `x86_64`, and
   `aarch64`.
3. Uploads them as a single `vega_artifacts.tgz` build artifact.

Download and unpack the artifact, then install the package that matches your
device with the `vvd:*` scripts described in
[Vega (Fire TV) CLI](#vega-fire-tv-cli) above. A debug `.vpkg` installed that
way loads its bundle from Metro, so Fast Refresh works against a downloaded
build.

### Repository settings that EAS depends on

Two settings exist specifically to keep EAS builds working. Both are easy to
undo by accident.

**`.gitignore` must not ignore `.eas/build`.** EAS filters the uploaded archive
through `.gitignore`. A bare `build/` rule matches a directory of that name at
any depth, including `packages/vega/.eas/build`, which silently drops the custom
build config from the upload and fails the build. The rule is therefore anchored:

```gitignore
packages/vega/build/
```

**`metro.config.js` does not extend `expo/metro-config`.** `expo-doctor` warns
about this, but adopting Expo's config breaks the build today. The config
instead declares the extra `sourceExts` and `assetExts` that Expo's defaults
add, which satisfies part of the check while keeping the Kepler platform.

Vega bundles with the platform name `kepler`, which the Kepler CLI registers on
top of React Native's Metro defaults. Expo's `getDefaultConfig` sets an explicit
platform list:

```js
platforms: ['ios', 'android', 'tvos', 'macos']
```

`kepler` is not in it, so the bundler stops with:

```
error: Invalid platform "kepler" selected.
Available platforms are: "ios", "android", "tvos", "macos".
```

Adding `kepler` back to `resolver.platforms` gets past that error but not much
further: module resolution then pulls React Native internals from `react-native`
instead of `@amazon-devices/react-native-kepler`, and the bundle fails on files
such as `ReactDevToolsSettingsManager`, which ships only `.android.js` and
`.ios.js` variants. Expo's resolver defaults differ from React Native's here —
notably `unstable_conditionNames`, which Expo leaves empty and React Native sets
to `['react-native']`.

Making Expo's Metro config usable from Vega is therefore work on the Expo side:
it needs a supported way to declare an out-of-tree platform rather than a fixed
list. It may also need Vega to move to a newer React Native first. The versions
are some way apart today, and `expo-doctor` already reports the gap:

| Package | Expected by Expo SDK 57 | Used by Vega |
| --- | --- | --- |
| `react-native` | 0.86.3 | 0.83.0 |
| `typescript` | ~6.0.3 | 5.8.3 |

Until then, extending `@react-native/metro-config` is the supported path. The
Kepler build prints its own warning if the config does not:

> From React Native 0.73, your project's Metro config should extend
> `@react-native/metro-config` or it will fail to build.

One `expo-doctor` warning remains, about `projectRoot` pointing at the monorepo
root rather than `packages/vega`. That setting is required: the entry point is
the root `index.js`, and Metro refuses to serve assets from `packages/shared`
without it. Removing it still builds, but the app renders without its icons.

## Tech Stack

|              | Expo TV                    | Vega (Fire TV)                                     |
| ------------ | -------------------------- | -------------------------------------------------- |
| Framework    | Expo SDK 55                | Kepler (@amazon-devices/react-native-kepler 4.0.0) |
| React        | 19.2.0                     | 19.2.0                                             |
| React Native | react-native-tvos 0.83.6-0 | 0.83.0                                             |
| TypeScript   | ~5.9.2                     | 5.8.3                                              |

The shared package (`@multitv/shared`) provides:

- UI components: Header, HeaderLogo (with platform-specific variants), Tile, ApiDemo, IconReactNativeAnimated
- HomeScreen with tile-based navigation and focus management
- Scaling utilities for TV display dimensions (1920x1080 base). The scaling approach used here is simple and works for a demo, but for production apps you may want a more robust solution like responsive layouts or a design system.
- A fetch-based HTTP client

### Platform-Specific File Extensions

The shared package uses React Native's platform resolution to load the right assets per platform:

- `.kepler.tsx` for Vega/Fire TV
- `.android.tsx` for Android TV
- `.ios.tsx` for Apple TV
- `.web.tsx` for web

## Notes

The Expo TV app (`packages/expotv/`) was scaffolded from the default Expo TV template. Some boilerplate files from the template (e.g. `HelloWave`, `ParallaxScrollView`, `ExternalLink`) are still present and not used by the shared components. They're harmless but can be removed if you want a cleaner setup.

## Troubleshooting

### Metro Dependency Resolution

If Metro fails to resolve dependencies, check that `watchFolders` and `nodeModulesPaths` are correctly configured in the Metro config. The monorepo uses `react-native-monorepo-tools` to handle this.

### Vega Build Issues

Make sure the Vega CLI tools are installed and configured correctly.
See [Vega CLI Installation](https://developer.amazon.com/docs/vega/latest/install-vega-sdk.html).

### Fast Refresh Not Working

Fast Refresh only works with debug builds:

- `vega_aarch64.vpkg` from `aarch64-debug/` for M-series Mac
- `vega_x86_64.vpkg` from `x86_64-debug/` for Intel Mac
- `vega_armv7.vpkg` from `armv7-debug/` for Fire TV Stick

### Android NDK Error

If you see `[CXX1101] NDK did not have a source.properties file`, remove any empty NDK installation directories from your Android SDK.

## Related Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Native TvOS](https://github.com/react-native-tvos/react-native-tvos)
- [Vega Developer Portal](https://developer.amazon.com/docs/vega/vega.html)
- [Expo Documentation](https://docs.expo.dev/)
- [Yarn Workspaces](https://yarnpkg.com/features/workspaces)

## License

See [LICENSE](LICENSE) file.
