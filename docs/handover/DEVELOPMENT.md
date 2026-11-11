# Birdzy — developer guide

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

## Source snapshot and prerequisites

- React Native: `0.81.4`; React: `19.1.0`.
- Node engine declared by package.json: `>=20`.
- Dependency/install authority: [package.json](../../package.json) and [package-lock.json](../../package-lock.json).
- macOS/Xcode plus the repository Ruby/Bundler setup is needed for iOS; Android Studio, SDK, compatible JDK and emulator/device setup is needed for Android. Check native build files for their exact pinned requirements.
- Existing source naming may be inherited. Use current configuration, routes and request payloads to determine the active app domain.

## First successful development run

1. Obtain repository and dev-provider access from [the handover access list](HANDOVER_60_DAYS.md).
2. Review [Environment setup](ENVIRONMENT.md), obtain approved values and prepare the correct development environment files.
3. Install from the lockfile: `npm ci --legacy-peer-deps`. Review postinstall scripts first; they may apply native/library patches or generate assets.
4. For iOS, install Ruby dependencies with `bundle install` if the project uses its Gemfile, then use the checked-in pod installation command below.
5. Start Metro in one terminal and the selected native development target in another. Confirm the app's API environment, bundle/package ID and Firebase project before using an account.
6. Run the relevant checks and record the machine/toolchain/build details with the incoming owner. These instructions have not been re-executed across every app as part of this documentation-only change.

## Checked-in startup commands

- `npm run env:dev` — `node scripts/switch-env.js dev`
- `npm run start:dev` — `npm run env:dev && react-native start --reset-cache`
- `npm run android:dev` — `npm run env:dev && react-native run-android --mode=devDebug --appIdSuffix=dev`
- `npm run ios:dev` — `npm run env:dev && bash scripts/with-brew-ruby.sh react-native run-ios --scheme "Birdzy-Dev" --mode "Debug-Dev"`
- `npm run pod:install` — `bash scripts/with-brew-ruby.sh bash -c 'cd ios && bundle exec pod install'`

## Architecture and where to change things

- [App.tsx](../../App.tsx) — Provider composition and app startup/lifecycle.
- [src/navigation/RootNavigator.tsx](../../src/navigation/RootNavigator.tsx) — Root auth/onboarding and overlay routing.
- [src/navigation/MainTabs.tsx](../../src/navigation/MainTabs.tsx) — Primary tab entry points.
- [src/navigation/types.ts](../../src/navigation/types.ts) — Typed root/navigation contracts.
- [src/assets](../../src/assets) — Shared bundled artwork and icons; feature-local assets may live next to their feature.
- [src/config](../../src/config) — App configuration, strings and feature defaults.
- [src/design-system](../../src/design-system) — Shared theme/tokens and component presentation.
- [src/services](../../src/services) — API, provider and business integration code.
- [src/components](../../src/components) — Reusable UI and cross-cutting surfaces.
- [src/features](../../src/features) — Feature screens, state and orchestration.
- [scripts](../../scripts) — Environment, build, release, verification and generation helpers.
- [android/app/build.gradle](../../android/app/build.gradle) — Android app targets/flavors, versions and build configuration.
- [ios](../../ios) — Native iOS workspace/targets, entitlements and CocoaPods.
- [firebase.json](../../firebase.json) — Firebase deployment configuration.
- [firestore.rules](../../firestore.rules) — Firestore access rules.
- [storage.rules](../../storage.rules) — Storage access rules.
- [remoteconfig.template.json](../../remoteconfig.template.json) — Remote Config defaults/template tracked with the repo.
- [src/lib/firebase/config.ts](../../src/lib/firebase/config.ts) — Native Firebase app initialization.

## Approach to a bug fix or feature

1. Reproduce against an identified app, platform, environment and account state; capture the actual versus expected behavior.
2. Read [Flows](FLOWS.md), then trace the entry route → feature state → service/client → backend/provider response. Check existing specialist docs before copying a related app.
3. Make the smallest coherent change. Preserve lifecycle cancellation, stable IDs, account boundaries and purchase recovery.
4. Add a regression check for behavior that failed; run the relevant existing checks and targeted device path.
5. Update product behavior, flow/API/environment/release notes as appropriate, then [CHANGELOG.md](CHANGELOG.md). Record any remaining limitation and verification that was not run.
6. Have the incoming owner explain and reproduce the fix. Merge/release responsibility belongs to the approved repository/release owners.

## Verification commands available here

- `npm run test:quiet` — `jest`
- `npm run lint` — `eslint src --ext .ts,.tsx`
- `npm run prettier:check` — `prettier --check "src/**/*.{js,jsx,ts,tsx,json,md}"`
- `npm run verify:image-pipeline` — `node scripts/verify-image-pipeline.js && node scripts/verify-app-image-routing.js`

TypeScript is configured in [tsconfig.json](../../tsconfig.json). Use the installed compiler with `npx tsc --noEmit`; if the current branch has a known configuration/baseline issue, record the failure separately instead of silently relaxing compiler settings.

## Native and generated work

After adding/changing a native dependency, update the lockfile, iOS pods and platform configuration as required, then rebuild the native app. A Metro restart cannot install a native module. Read existing `postinstall`, patch and asset-generation scripts before a clean checkout; do not delete a patch just to make installation green.

## Check documentation links and examples

Run `python3 docs/handover/check_docs.py` from the repository root after updating this pack. It checks handover links and ensures example environment values remain blank; it does not validate app runtime behavior.

## Mapbox native module missing (2026-11-04)

If Explore reports `@rnmapbox/maps native code not available`, the installed binary has no `RNMBXModule`. A public token or Metro reload cannot install native code. The Mapbox dependency, Podfile hooks and Android Maven repository are already configured. Rebuild and install the matching app flavor:

- iOS development: `npm run pod:install`, then `npm run ios:dev`.
- iOS production configuration: `npm run pod:install`, then `npm run ios:prod`.
- Android: `npm run android:dev` or `npm run android:prod` for the installed flavor.

Close the old app before opening the rebuilt installation. Verify Explore on that installation: map tiles, search, selection and expanded map, plus nearby results. Do not treat a JavaScript bundle as native-linking verification.

`ExploreMapView.tsx` checks `NativeModules.RNMBXModule` before loading the SDK-backed `ExploreMapView.nativeMap.tsx`. Older binaries display an update message while location search and nearby results remain accessible. This fallback does not provide an interactive map; a native rebuild is required. No environment variable names or loading behavior changed.

## App audit changes — 2026-11-04

The Podfile normalizes outdated pod deployment targets to React Native's minimum. Reinstall pods after pulling it. The version store reads the installed version from react-native-device-info; a deployed latest/minimum-version contract is still absent, so this is not a working remote update-enforcement system. Notifications persist an ownerUserId and clear unscoped/other-account cached state on owner assignment. Keep account generation checks when changing refresh behavior.


## Duplicate-call lifecycle audit — 11 November 2026

Concurrent profile requests share one in-flight result per account and JWT. A finished request cannot restore a replaced account. The visible profile loader also settles when a concurrent silent refresh applies the shared JWT result first. Device POSTs share only overlapping identical account/token/payload requests; settled requests can be retried. Token-refresh subscriptions share one native connection across mounted owners, retain it through JWT rotation, and dispose connections that resolve after cleanup. These guards limit side effects, rather than suppressing normal React state updates.

Collection loading has one pending load per screen/account, no separate mount+focus fetch, no recursive error timers, and no hidden-screen wishlist fetch followed by another focus fetch. A wishlist mutation during an older collection read schedules one refresh after that read finishes. Catalogue appends and collection creation acquire synchronous guards. Overlapping likes share one mutation/owner notification. Foreground FCM setup has reference-counted ownership and late-setup cancellation; cold-start routing is consumed once. General API dedup keys include the session and exclude independently cancellable and multipart requests. IAP connection failure can be retried without an old rejection clearing a newer attempt. Existing identify attempt controls and receipt processing guards were inspected and retained.

The source review followed startup/authentication → Home/focus → catalogue and collections → identify/details → community mutations → subscription/purchase callbacks, including push and reminder listeners that outlive a screen. The changes add no endpoint or environment variable. Physical-device render profiling and production request traces remain unverified.
