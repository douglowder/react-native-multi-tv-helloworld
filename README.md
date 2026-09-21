# Multi-TV Hello World

A monorepo for building TV apps across multiple platforms using pnpm workspaces, including Vega OS (Fire TV), Expo TV (Android TV / Apple TV), and web.

![Screenshots](./images/screenshots.png)

## Introduction

This project demonstrates how to share React Native code across multiple TV platforms using a pnpm workspaces monorepo. It includes:

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
├── package.json                 # Root scripts
├── pnpm-workspace.yaml          # Workspace list, nodeLinker, Expo patches
├── patches/                     # Patches adding the kepler platform to Expo
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

## Package Manager

The workspace uses [pnpm](https://pnpm.io/). `pnpm-workspace.yaml` holds the
workspace list and three settings that matter:

```yaml
nodeLinker: hoisted
```

A hoisted `node_modules` is the layout the Vega CLI and the React Native CLI
expect. The default isolated layout is not used here.

```yaml
overrides:          # one copy of each patched Expo package
patchedDependencies: # the kepler platform patches in patches/
```

Two copies of each Expo package would otherwise be installed, so `overrides`
pins a single version and `patchedDependencies` patches that version. The patch
files live in `patches/`.

Workspace dependencies use the `workspace:` protocol, which pnpm requires:

```json
"@multitv/shared": "workspace:*"
```

### Writing config that survives the hoisted layout

Two things to avoid when adding Metro or build configuration:

- **Do not hardcode `node_modules` paths.** pnpm hoists most packages to the
  workspace root, so a `packages/vega/node_modules/...` path can silently miss.
  Metro then falls back to whatever else resolves, and the app builds and loads
  but never renders. Use `require.resolve` instead -- see the
  `lottie-react-native` alias in `packages/vega/metro.config.js`.
- **Do not use `react-native-monorepo-tools`.** It finds the monorepo root
  through a `workspaces` field in `package.json`, which pnpm replaces with
  `pnpm-workspace.yaml`, and its block list assumes a Yarn layout.

EAS builds pick up pnpm through `corepack: true` in `packages/vega/eas.json`
together with the `packageManager` field in the root `package.json`.

## Prerequisites

### Core Requirements

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v12 or higher)
- [Git](https://git-scm.com/)

### Platform-Specific Requirements

**Vega (Fire TV)**

Vega development requires the Vega SDK. The `@amazon-devices` packages resolve from the public npm registry, so no extra registry configuration is needed.

1. [Install the Vega Developer Tools](https://developer.amazon.com/docs/vega/latest/install-vega-sdk.html)

**Expo TV**

- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio with an Android TV system image (for Android TV)
- Xcode (for Apple TV)

## Quick Start

```bash
# Install all workspace dependencies
pnpm install

# Build the Vega/Fire TV app (debug)
pnpm vega:build

# Run on Vega Virtual Device (Mac M-series)
pnpm vega:vvd:mseries

# Run on Vega Virtual Device (Intel Mac)
pnpm vega:vvd:intel

# Run on a Fire TV Stick (pass DSN)
pnpm vega:firetv <DSN>

# Prebuild Expo TV native projects
pnpm expotv:prebuild

# Run on Android TV
pnpm expotv:android

# Run on Apple TV
pnpm expotv:ios

# Run on web
pnpm expotv:web
```

## Build and Run

You can build and run using either the CLI or the [Vega Studio IDE extension](https://developer.amazon.com/docs/vega/0.22/setup-extension.html). We recommend the IDE, which provides build, run, and device management directly from the sidebar panel. Vega Studio also has [monorepo support](https://developer.amazon.com/docs/vega/0.22/monorepo-support.html) that automatically detects the workspace layout and imports Vega sub-packages when you open the project.

### Vega (Fire TV) CLI

Build the project:

```bash
# Debug build (recommended for development, enables Fast Refresh).
# Bundles with Expo: expo export:embed, then Hermes, then the native build.
pnpm --filter @multitv/vega run build:debug

# Release build. Still bundles through the Vega CLI -- see "Known Issues".
pnpm --filter @multitv/vega run build:release
```

The packager is `expo start`. Fast Refresh and Expo dev tooling such as Atlas
(`EXPO_ATLAS=1`, served at `/_expo/atlas`) work against it.

Run on a Vega virtual device:

```bash
vega virtual-device start

# Mac M-series (aarch64) - using package script
pnpm vega:vvd:mseries

# Intel Mac (x86_64) - using package script
pnpm vega:vvd:intel

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
pnpm vvd:start                          # boot the virtual device
pnpm start                              # Metro, in a second terminal
pnpm vvd:port                           # let the device reach Metro on 8081
pnpm vvd:install path/to/vega_aarch64.vpkg
pnpm vvd:launch
```

A debug package installed this way loads its bundle from Metro, so Fast Refresh
works. When you are finished:

```bash
pnpm vvd:uninstall
pnpm vvd:stop
```

Run on a Fire TV Stick (replace `<DSN>` with your device serial number):

```bash
# Using the package script
pnpm vega:firetv <DSN>

# Or directly
vega run-app packages/vega/build/armv7-release/vega_armv7.vpkg com.amazondeveloper.hellosharedworkspace.main -d <DSN>
```

The `vega run-app` command takes the form `vega run-app <Vpkg path> <App ID> -d <device>`. The App ID is the interactive component id from `manifest.toml` (here, `com.amazondeveloper.hellosharedworkspace.main`). Use `VirtualDevice` for the VVD or the device serial number (DSN) for a Fire TV Stick. See the [Vega CLI reference](https://developer.amazon.com/docs/vega/0.22/cli-tools.html) for details.

[Fast Refresh](https://reactnative.dev/docs/fast-refresh) is available in debug builds. See [Set Up Fast Refresh](https://developer.amazon.com/docs/vega/latest/fast-refresh.html) for configuration.

### Expo TV

> **Note:** Apple TV (iOS) must run on port 8081. Avoid running Vega and Expo TV builds at the same time, as they use separate Metro instances that can conflict.

Prebuild the native projects first:

```bash
pnpm expotv:prebuild
```

Then run on your target platform:

```bash
# Android TV
pnpm expotv:android

# Apple TV
pnpm expotv:ios

# Web
pnpm expotv:web
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

**`metro.config.js` extends both `expo/metro-config` and
`@react-native/metro-config`.** Expo's defaults are the base; four settings are
taken from React Native because Expo's equivalents are not compatible with the
Kepler runtime:

- `transformerPath` and `transformer.getTransformOptions`. Expo replaces Metro's
  transform worker and inverts the options it consumes. Mixing one side's worker
  with the other's options produces a bundle that loads but never renders, so
  both come from React Native together.
- `resolver.resolveRequest`, which rewrites `react-native` to
  `@amazon-devices/react-native-kepler` when bundling for `kepler`.
- `serializer.getModulesRunBeforeMainModule`, which appends the fork's
  `InitializeCore`. It reaches that list through React Native's framework
  defaults, which only the React Native CLI installs, so under `expo start` it
  must be added explicitly.
- `serializer.getPolyfills`, because the Vega CLI calls it with no arguments
  while Expo's implementation destructures `{ platform }`.

Expo does not know the `kepler` platform on its own. Four patches in
`patches/` add it to `@expo/metro-config`, `@expo/config`, `@expo/cli` and
`expo-modules-autolinking`, mirroring how `macos` and `tvos` are handled. Without
them the bundler stops with:

```
error: Invalid platform "kepler" selected.
Available platforms are: "ios", "android", "tvos", "macos".
```

The autolinking patch is what makes the `react-native` redirect work on Expo's
own resolver: `getSupportPackageForPlatform` maps `kepler` to
`@amazon-devices/react-native-kepler`, the same mechanism `react-native-macos`
uses.

One `expo-doctor` warning remains, about `projectRoot` pointing at the monorepo
root rather than `packages/vega`. That setting is required: the entry point is
the root `index.js`, and Metro refuses to serve assets from `packages/shared`
without it. Removing it still builds, but the app renders without its icons.

Release bundling is the one part that does not go through Expo — see
[Known Issues](#known-issues).

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

## Known Issues

### Release bundles cannot be built with Expo

The packager and the debug build use Expo (`expo start` and `expo export:embed`).
Release still bundles through the Vega CLI, because an Expo-produced release
bundle installs and loads on device but never renders.

The cause is not yet identified. What is established:

**Ruled out.** Each was tested by rebuilding and running on a virtual device:

- `build-vega --skip-bundling` is not at fault. A bundle produced by the Vega
  CLI builds and renders through that flag.
- Minification. An unminified Expo bundle (2.55 MB, against the Vega CLI's
  2.50 MB) fails the same way.
- The missing `keplerscript-app-system-bundles-config.json`. Copying it in
  changes nothing. It is written as `{}` by the bundle splitter in
  `@amazon-devices/keplerscript-commonmodules`.
- Module ID scheme. The Vega CLI normally emits hashed string IDs
  (`__r("cf70efd87f1a03bff289")`) where Expo emits numeric ones (`__r(0)`), but
  building with `DISABLE_APP_BUNDLE_SPLITTING=true` makes the Vega CLI emit
  numeric IDs too and the app still works.
- Expo's module-system polyfill guard. `@expo/cli/build/metro-require/require.js`
  installs itself only when `__DEV__ || !global.__d`, which looked like a good
  explanation for a debug/release split. Patching the guard away did not fix the
  release build.
- Missing `InitializeCore` invocation. A Vega CLI bundle ends with
  `__r(115); __r(0);` where Expo's ends with `__r(0);`, so the modules from
  `serializer.getModulesRunBeforeMainModule` are not invoked. `export:embed`
  does call that function -- a probe confirmed it returns two modules -- but
  discards the result, and the fork's `InitializeCore` is present in the bundle
  as module 115 while never being run. Hand-appending `__r(115);` before
  `__r(0);` and rebuilding did not fix it.
- The `hermes-stable` transform profile. `export:embed` forces
  `unstable_transformProfile: 'hermes-stable'` when it detects Hermes
  (`@expo/cli/build/src/export/embed/exportEmbedAsync.js`), which is a plausible
  mismatch against the Kepler Hermes fork. Rebuilding with
  `--unstable-transform-profile default` fails the same way.
- Anything specific to `export:embed`. `expo export --platform kepler`, the OTA
  path with none of the native build wrapping, produces a bundle that fails
  identically. The breakage is in Expo's shared Metro bundling, not in the embed
  command.
- Expo's supervising transform worker. `@expo/cli` replaces Metro's transform
  worker on every Expo bundling path;
  `transformer.expo_customTransformerPath: false` opts out, and the release
  build still fails.

**Still open.** Module IDs, startup invocation and entry sequence can all be made
to match a working Vega CLI bundle while the Expo bundle still fails, so the
remaining difference is in transformed module contents rather than bundle
structure. None of the switches above reach it.

### Fast Refresh needs `expo start`

Fast Refresh applies live under `expo start`. Under `react-native start` with
this Metro config, Metro rebuilds on save but the change appears only after
relaunching the app.

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
- [pnpm Workspaces](https://pnpm.io/workspaces)

## License

See [LICENSE](LICENSE) file.
