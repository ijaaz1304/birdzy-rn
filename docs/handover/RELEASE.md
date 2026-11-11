# Birdzy — build, release and recovery

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

## Before a build

1. Identify the exact commit/change set, target environment, package/bundle ID and intended distribution channel.
2. Review [Known gaps](KNOWN_GAPS.md) and run the changed-flow acceptance checks.
3. Confirm signing, store/provider access, backend compatibility, Firebase configuration and current store product IDs.
4. Inspect the chosen script. Build/release helpers may switch `.env`, bump native versions, rewrite release notes or generate artifacts; cleanup and uninstall scripts may remove local state.
5. Use a dedicated release workspace or account for release work so a development experiment does not silently become production configuration.

## Checked-in build and release commands

The following commands exist in this repository; their existence does not prove they passed on the current machine/branch. Build artifacts are not uploaded or published by this documentation task.

- `npm run ios:build:dev` — `npm run env:dev && cd ios && xcodebuild -workspace Birdzy.xcworkspace -scheme Birdzy-Dev -configuration Release-Dev -sdk iphoneos archive -archivePath build/Birdzy-Dev.xcarchive`
- `npm run ios:build:prod` — `npm run env:prod && cd ios && xcodebuild -workspace Birdzy.xcworkspace -scheme Birdzy -configuration Release -sdk iphoneos archive -archivePath build/Birdzy.xcarchive`
- `npm run android:build:dev:apk` — `npm run env:dev && npm run android:check:dev && cd android && ./gradlew assembleDevRelease`
- `npm run android:build:dev:aab` — `npm run env:dev && npm run android:check:dev && cd android && ./gradlew bundleDevRelease`
- `npm run android:build:prod:apk` — `npm run env:prod && npm run android:check:prod && cd android && ./gradlew assembleProdRelease`
- `npm run android:build:prod:aab` — `npm run env:prod && npm run android:check:prod && cd android && ./gradlew bundleProdRelease`

## iOS targets and Android flavors

The `ios:dev` / `ios:prod` or archive commands above contain the scheme names when supplied by the project. Confirm them against the shared Xcode schemes and native target configuration. Android flavor/task names come from this repo’s scripts and Gradle files; never substitute another app’s flavor or signing identity.

## CI/CD and infrastructure operations

No workflow YAML was found under `.github/workflows` in this snapshot. Existing CI/CD docs may describe a planned or external pipeline; obtain its actual URL, owner and last successful run.

Available infrastructure commands (run only for the intended environment with release ownership):

- `npm run firebase:deploy:dev`
- `npm run firebase:deploy:prod`
- `npm run firebase:deploy:all`
- `npm run firebase:deploy:dev:rules`
- `npm run firebase:deploy:prod:rules`
- `npm run firebase:deploy:all:rules`
- `npm run firebase:deploy:dev:indexes`
- `npm run firebase:deploy:prod:indexes`
- `npm run remoteconfig:push:dev`
- `npm run remoteconfig:push:prod`
- `npm run remoteconfig:push:all`

## Release acceptance record

- [ ] Exact code commit, version/build number and artifact location recorded.
- [ ] Checks and device walkthrough evidence attached; failures have explicit disposition.
- [ ] Guest/account, capture/gallery, saves, purchase/restore and deep links tested on both supported platforms.
- [ ] App-specific critical journeys from [Flows](FLOWS.md) verified.
- [ ] Backend/provider changes and any migration are coordinated and reversible where possible.
- [ ] Store release notes, rollout owner, monitoring window and support response agreed.
- [ ] Relevant product/flow/environment/API docs and [CHANGELOG.md](CHANGELOG.md) updated.

## Recovery approach

First determine whether the problem is a client build, backend/provider outage, configuration change, bad store product state or data migration. Preserve the failing version and redacted diagnostics. Use a previous compatible build or a verified feature switch only when that rollback path exists; do not assume a store release or a server-side migration is instantly reversible.

The incoming owner must demonstrate where to pause a rollout, who can change provider/backend configuration, how to restore a known-good configuration, and how to verify data/entitlement consistency afterward. Record actual console links and owners in the handover checklist. No ownership is implied by access to this Git checkout.

## Git pull/push destinations — 2026-11-04

Use `origin` for `https://github.com/Trackzio-Mobile-Apps/birdzy-react-native.git`. The local checkout previously had two push URLs under origin, so one push could succeed for the organization and still fail overall when the personal mirror rejected it. This checkout now keeps `https://github.com/ijaaz1304/birdzy-rn.git` as the separate `personal-mirror` remote; ordinary origin pushes no longer publish there. Remotes are local Git configuration and are not installed by pulling documentation.

Check `git remote -v` after cloning/configuring a checkout. Normal commands are `git pull --ff-only origin main` and `git push origin main:main`. Do not add the personal mirror as a second origin push URL. Mirror publication is a separate deliberate operation (`git push personal-mirror main:main`) after both tips are intentionally aligned.

GitHub previously rejected the personal mirror because commit `75d7054` contains Mapbox values in the tracked environment files. Inspection confirmed those Mapbox values use the public `pk.*` prefix, not `sk.*`; values are intentionally omitted here. The owner later allowed that finding as a false positive, so explicit personal-mirror pushes can proceed. Keep org and personal `main` in sync with a normal merge (no force push) when they diverge. Other checkouts with the old dual-push setup need the same local remote separation.

## eMudhra Firestore security release — 2026-11-04

Follow [the app remediation guide](../firebase-emudhra.md). Verify both FirebaseFirestore and FirebaseFirestoreInternal resolve to 12.19.3 before archiving; an umbrella/Analytics version of 12.19.0 is expected for this backport approach. Native builds, TestFlight, real-device acceptance, store build-number selection and rollout remain with the release owner/user. Existing installed builds stay affected until users update.
