# Birdzy — handover change history

## 2026-11-02 — establish the handover documentation baseline

- Added app-specific product, end-to-end flow, development, API/data, environment, QA/operations and release guides with source references.
- Added the 60-day ownership/access plan, known-gap register and documentation-maintenance instructions.
- Added blank dev/prod variable inventories. Existing environment files and credential values are not replaced by this documentation task.
- Preserved and linked existing specialist docs. Source snapshot: `main` / `d82a859`, including uncommitted local work where present.
- Validation for this entry: documentation links, script names, referenced local paths, template values and scope are checked by the handover validation script. No fresh all-app build/device/store/API verification is claimed.

Future fixes must append a dated entry describing behavior, relevant document updates, actual checks and remaining limitations. See [MAINTENANCE.md](MAINTENANCE.md).

## 2026-11-02 — prepare documentation-only publication

- Kept the Explore/core API implementation and other existing application changes out of this documentation commit.
- Marked local-only source references as unpublished paths instead of publishing links to absent source files.
- Revalidated the handover documentation links and blank environment examples.

## 2026-11-04 — Explore missing native Mapbox recovery

- Fixed the import-time crash when an installed binary lacks `RNMBXModule`: the public map component checks native availability before requiring the SDK-backed component. Shows an update message while nearby search/results remain available. Normal linked builds retain the existing interactive map.
- Split SDK-backed rendering into `src/features/explore/components/ExploreMapView.nativeMap.tsx`; documented native rebuild commands and recovery in the feature README and DEVELOPMENT.md. Owner/device acceptance remains open in HANDOVER_60_DAYS.md. No token or environment loading changes.
- Validation: TypeScript passed; both map files passed ESLint; all 30 Explore tests passed (4 suites); handover checker passed. These tests do not prove device map rendering or exercise the new UI fallback directly.
- Native verification attempted: Xcode simulator build of Birdzy-Dev/Debug-Dev failed before compilation because existing pod targets declare unsupported iOS deployment versions (8–13.4 with this Xcode requiring at least 15.0). No simulator was booted. Native rebuild/install and live map/fallback acceptance remain unverified; mobile owner unassigned.

## 2026-11-04 — Explore map POST correction

- User reported GET 404 for map GeoJSON. Compared Shroomzy source and changed Birdzy to POST with undefined body and unchanged bbox/filter query parameters. Preserved cancellation and separate map cooldown. Updated request regression assertions, feature README, API guides and open handover acceptance.
- Validation: all 30 Explore tests passed (4 suites); TypeScript and targeted ESLint passed. Handover link/example checker and whitespace checks passed. No authenticated live Bird POST or device map rendering verified; API/mobile owner unassigned for acceptance. No environment or token changes.

## 2026-11-04 — Explore location search repair

- Audited Explore and compared Plantzy/Shroomzy geocoding implementations. Found the separate geocoding key blank in active/dev/prod settings while Mapbox was configured. Added Mapbox Geocoding v6 forward suggestions when the original provider is unconfigured, following Plantzy's fallback approach. Existing configured primary provider remains preferred; no keys or environment loader changes. Temporary Mapbox results are not cached/persisted.
- Fixed delayed input blur restoring an obsolete selected location label by reading the latest selected label and clearing pending blur timers on selection. Updated feature README, ENVIRONMENT, FLOWS, QA and handover acceptance.
- Validation: live request with configured public token returned HTTP 200 and five Chennai features (credential not logged). All 36 Explore tests passed in 5 suites, including six provider regressions; TypeScript passed. Tests' fake clock was corrected to advance monotonically across cases so shared pacing does not stall later assertions. Targeted lint and documentation/whitespace checks run.
- Device keyboard, suggestion taps, clear/retype, expanded-map selection and nearby refresh remain open for incoming mobile owner (unassigned). No native rebuild/device test performed in this change; existing native build limitations remain separate.

## 2026-11-04 — Birdzy app-wide leftover audit

- Audited the existing known gaps, current routes/services, full Jest suite, TypeScript, app-wide ESLint, image routing and iOS pod setup. Initial full test result was 741 passed/4 failed (68 suites); all four failures were camera test hosts missing the required ThemeContext. Both ordinary and first-foreground test hosts now use the actual light theme.
- Notifications: added persisted account ownership, clearing on account changes/logout, guards for late subscription/refresh callbacks, and hydration protection against another account's saved state. Do not persist transient loading. Replaced no-op list refresh with the existing Firestore fetch service. Regressions cover isolation, same-owner retention, refresh, delayed sign-out results and late hydration.
- Specimen PATCH now preserves explicit empty editable arrays rather than losing requests to clear lists. Immutable/unknown fields remain excluded. Added a contract regression; live backend clearing acceptance is still open.
- Corrected installed app-version reporting through react-native-device-info. Latest/minimum version enforcement still needs a real backend/product contract. Changed the unsupported coupon “Apply” action to honest View Plans navigation; no arbitrary code redemption is claimed. Removed unused AI methods returning mineral facts/unsupported rock diagnosis after confirming no app callers.
- Removed six unused-import lint errors. The initial app-wide lint run also reported 849 warnings (419 inline styles, 240 no-void, 65 hook-dependency, 56 unused variables, 37 bitwise, 28 shadowing, 3 nested components, 1 consistent-this). Those warnings are not suppressed or claimed resolved.
- Raised outdated pod deployment targets to React Native's supported minimum in the Podfile hook. `npm run pod:install` passed (166 pods), and generated pod targets were all iOS 15.1. The pre-existing Hermes xattr cleanup emitted permission warnings but did not fail installation. Native build result is recorded below when complete; pod installation is not device acceptance.
- Updated API, flow, development, environment, QA, known-gap and handover documents. Restored links to Explore files now tracked in the repository, replacing historical docs-only publication caveats.
- Validation: final whole-app Jest run passed 752 tests in 70 suites, including the five notification regressions. Targeted API/collection/notification run passed 43 tests; installed-version regression and camera prompt tests passed. TypeScript and app-wide lint were rerun after the changes; final results follow below. Image pipeline and AppImage routing checks passed. Documentation link/blank-example and whitespace checks passed.
- Remaining acceptance: actual iOS/Android keyboard/location/map flows, Firestore account switching on devices, store price/offer eligibility and live Bird API mutation semantics. Mobile/backend/product/store/QA owners remain unassigned. No push or release performed by this audit.

### Final audit validation / build handoff

TypeScript completed successfully and app-wide ESLint completed with zero errors (`--quiet`; existing warnings remain). Added Mapbox wrapper regressions: both missing-native recovery and linked-native prop forwarding passed (2 tests), in addition to the full 752-test/70-suite run. The last TypeScript run includes the final service cleanup and notification persistence changes; runtime/device acceptance is still separate. Android dev release pre-check passed.

The iOS build progressed beyond the old deployment-target error into native compilation, but no successful build is claimed. The initial unrestricted build was interrupted to reduce resource pressure; the resumed two-job build was stopped when the user said they will run builds. Build and device acceptance are handed back to the user. No release/push performed.

## 2026-11-04 — Fix normal push failing on the personal mirror

- Reproduced the configuration behind the supplied GH013 report: origin had organization and personal push URLs. Organization main was already synchronized; the personal mirror rejected an earlier commit containing Mapbox public `pk.*` values. No secret `sk.*` values found in the inspected current/historical environment files; no values logged.
- Kept origin pointed at the organization repo and preserved the personal repository as the separate local `personal-mirror` remote. No force push, history rewrite, push-protection bypass, app code or token change. Documented local setup and explicit mirror limitations in RELEASE.md.
- Validation: organization fetch, push preview and actual pull/push passed before the change. Standard origin pull/push was rerun after separation; final result recorded below. Documentation checker and whitespace checks run. Explicit personal-mirror publication remains blocked by its historical push-protection finding and was not attempted.

Final verification: `git pull --ff-only origin main` returned Already up to date; `git push origin main:main` returned Everything up-to-date after remote separation. The two documentation updates remain uncommitted; remote configuration is already effective locally.

## 2026-11-04 — eMudhra Apple Firestore security patch

- Previous local FirebaseFirestore: 12.8.0. Added a Firebase 12.19.0 base override and exact FirebaseFirestore 12.19.3 requirement, preserving current React Native Firebase JS APIs and the CocoaPods integration. This is a temporary native override needing native compatibility acceptance, not a tested wrapper major upgrade.
- Initial global 12.19.3 attempt could not resolve the separately versioned Analytics pod; the final base-plus-Firestore-pin approach uses published component versions. Lockfile/dependency verification results are recorded below after resolution.
- No Android App Distribution Gradle plugin references found in the app build configuration; no Android security dependency edit needed for this finding. No app logic, credentials, environment loading or JS package versions changed. Existing unrelated local work preserved.
- Updated environment/release docs, added [app-specific security remediation instructions](../firebase-emudhra.md), and recorded open release ownership/acceptance. Builds, device tests, store uploads and rollout are not run; the user handles builds.

Validation completed: CocoaPods update passed; FirebaseFirestore and FirebaseFirestoreInternal both resolve to 12.19.3; installed Manifest.lock matches the repository lock; Podfile SHA-1/checksum and Ruby syntax passed. Handover link/blank-example validation and whitespace checks passed. No builds/device tests/releases performed. Branch base: `main` at `1ca722a82760236f7b397ad74c33ee2f5bcfb15c` selected after fetching all remote heads and comparing their most recent commits; no default/dev-branch assumption.

## 2026-11-06 — save the identification photo with Add to Collection

- Identification Add to Collection now uploads the user photo to the already-allowed `posts/images` Storage path and stores the public `storage.googleapis.com` URL. Identified, Wishlist, and custom collections send that URL first on `POST /core/specimen/add`. Specimen update is not given image fields. An existing specimen is replaced by a new row so the photo can be stored. Display unwraps a catalogue path glued onto the photo URL.
- Updated [FLOWS.md](FLOWS.md) and [API_AND_DATA.md](API_AND_DATA.md). No Storage rules deploy and no environment or credential change.
- Validation: `npx jest __tests__/collection/userCollectionPhoto.test.ts __tests__/collection/birdSpecimenPayloads.test.ts --no-coverage` passed 2 suites / 12 tests. No device add, carousel, or live API check was run. Owner for that acceptance is unassigned.

## 2026-11-04 — Developer Firebase upgrade handoff

Created [a consolidated five-app upgrade plan](../NATURE_APPS_FIREBASE_UPGRADE_PLAN.md) explaining the iOS security patch, exact Podfile/lock changes, per-app source branches and security commits, conditional Android App Distribution plugin work, production archive routes, tooling caveats and open release/QA ownership. Rechecked current local wrappers, locks and package scripts and consulted the official Firebase advisory. No dependency/application changes or builds performed in this documentation change. Validation: handover checker passed (14 pages, 284 local links); new document links and all five referenced security commit lockfiles checked; git diff --check passed. Store binaries, device acceptance and rollout remain unverified.

## 2026-11-04 — Cursor and Claude security handoff prompts

Added separate copy-ready Cursor Agent and Claude/Claude Code prompts to [the five-app Firebase upgrade plan](../NATURE_APPS_FIREBASE_UPGRADE_PLAN.md). Prompts start with the existing security branches, avoid duplicate/broad upgrades, preserve local work and credentials, distinguish Android plugin use from SDK metadata, and keep user-run builds and release approval explicit. No application or dependency change. Validation: documentation checker, new document local-link checks and whitespace checks passed. Prompts were reviewed as text; they were not executed in Cursor or Claude.

## 2026-11-04 — Generic product-level security brief

Rewrote the upgrade document as a reusable product/release brief at the user's request. Removed app names, code locations, commands, branch/commit details and implementation instructions. Retained the issue, affected platform/service or tooling, patched component targets, validation/release actions and generic Cursor/Claude assessment prompts. Included other technologies to avoid applying native Android conclusions to every framework. Updated the handover index. No application or dependency changes. Validation: documentation checker, document structure/content checks and whitespace checks passed; prompts were not executed and no release status was newly certified.

## 2026-11-04 — Word security brief

Created [the Word version](../eMudhra_Security_Update_Brief.docx) of the generic product/release brief, including separate copy-ready Cursor and Claude prompts. Preserved generic platform scope and removed app-specific/code locations from the deliverable. Validation: final DOCX rendered to four pages and every page visually inspected; title styling, prompt lists, content presence, generic scope and document links checked. No app/dependency changes, builds or releases performed.

## 2026-11-09 — Background and cold-start push notifications

- Added Android data-only FCM display through the existing Notifee channel and aligned Debug and Release iOS APNs entitlements with their signing environments. The scene forwards cold-start notification responses to the installed notification-center delegate. Added data title/body fallback in the foreground and deduplicated the FCM tap listener.
- Updated [QA_AND_OPERATIONS.md](../../docs/handover/QA_AND_OPERATIONS.md) with the payload, signing and device QA cases.
- JS/TS syntax checks and the mocked Android background-handler smoke check passed. Xcode project and entitlement lint passed. SceneDelegate Swift syntax parsing passed.
- The repository-wide TypeScript check and handover link checker passed.
- Open with owner unassigned: signed builds and physical-device delivery and tap validation using the real server payloads. Direct APNs routing remains unverified.


## 2026-11-11 — Duplicate-call lifecycle audit and fixes

Concurrent profile requests share one in-flight result per account and JWT. A finished request cannot restore a replaced account. The visible profile loader also settles when a concurrent silent refresh applies the shared JWT result first. Device POSTs share only overlapping identical account/token/payload requests; settled requests can be retried. Token-refresh subscriptions share one native connection across mounted owners, retain it through JWT rotation, and dispose connections that resolve after cleanup. These guards limit side effects, rather than suppressing normal React state updates.

Collection loading has one pending load per screen/account, no separate mount+focus fetch, no recursive error timers, and no hidden-screen wishlist fetch followed by another focus fetch. A wishlist mutation that arrives while an older collection read is still open refreshes once after that read finishes, instead of keeping the stale counts. Catalogue appends and collection creation acquire synchronous guards. Overlapping likes share one mutation/owner notification. Foreground FCM setup has reference-counted ownership and late-setup cancellation; cold-start routing is consumed once. General API dedup keys include the session and exclude independently cancellable and multipart requests. IAP connection failure can be retried without an old rejection clearing a newer attempt. Existing identify attempt controls and receipt processing guards were inspected and retained.

Updated docs/handover/DEVELOPMENT.md, docs/handover/QA_AND_OPERATIONS.md, this changelog and HANDOVER_60_DAYS. Existing unrelated local Insecto Firestore/iOS work is preserved. No dependency, backend contract or environment change was introduced by this audit.

Follow-up audit: a visible `getProfile` that was abandoned after an account change cleared without resetting `isLoading`, which could leave the loader stuck. Ownership is now per visible load; a superseded or abandoned call clears only its own loader. Added a lifecycle regression for that case.

Validation: `npx jest __tests__/lifecycle --runInBand --no-coverage` passed (10 suites, 26 tests), including delayed wishlist refresh and the abandoned getProfile loader case. `python3 docs/handover/check_docs.py` reported OK (14 handover pages, 289 local links). Physical-device navigation, real push delivery, sandbox billing, release builds and render profiling were not run. QA/release owner remains unassigned; complete the documented acceptance checklist. Changes remain local.

## 2026-11-11 — Explore Near You entry, tabs, empty state and Android location copy

Ported the Shroomzy `fix/explore_bugs` Explore UI fixes into Birdzy (birds wording; Spotted Now instead of Growing Now):

- Home banner: whole panel tappable; "Enable Location" when location is off, "Explore Map" when on; no row counts. Shared [useExploreEntry](../../src/features/explore/useExploreEntry.tsx) + [useLocationPermissionGranted](../../src/features/explore/useLocationPermissionGranted.ts).
- Catalogue: "Explore Near You" pill and map banner above category tabs use the same entry hook; banner hidden while filters are applied; brand orange/yellow outline on the map edge.
- Explore tabs: Spotted Now / Year-round equal halves via [ExploreTabBar](../../src/features/explore/components/ExploreTabBar.tsx).
- Empty state: design wording (default / filtered / wide) and `EmptyState` `appearance="body"`.
- Android first-ask location popup: "Enable Location Access" with "Allow Location"; iOS App Review copy unchanged.

Updated [FLOWS.md](FLOWS.md), [QA_AND_OPERATIONS.md](QA_AND_OPERATIONS.md), [explore README](../../src/features/explore/README.md) and this changelog. No environment or credential changes.

Validation: `npx jest` on the seven new Explore/Home UI suites passed (7 suites / 21 tests). `python3 docs/handover/check_docs.py` reported OK (14 handover pages, 297 local links). Existing broader Explore API suites and device acceptance for Home/Catalogue entry, Android popup and map outline were not run; QA owner unassigned.

## 2026-11-09 — Camera permission copy aligned with Figma

- Compared the identify camera permission flow with Figma (node 8558:25287). Updated the shared camera permission copy in `src/config/strings/modals.strings.ts`: subtitle now reads "To identify birds around you, Birds AI needs access to your camera." and the button reads "Allow access" (sentence case). Used by the inline Allow Access screen and the camera permission prompt that reuses `getCameraPermissionUiCopy()`.
- Permission screen UI now matches Figma 8558:25313 / 8558:25342. New `src/features/camera/components/CameraPermissionGateChrome.tsx` renders the 40px back and flash buttons on top and, at the bottom, gallery (works; disabled while the native dialog is open), a greyed-out shutter (#B0B0B0) and a flip-camera button. Flash and flip are display-only. Screen background is now Figma grey/950 via the new `APP_COLORS.cameraPermissionSurface` (#091B21), and the permission content is centered on the full screen. The old take-photo PNG had a baked-in #111 background, so the inline state uses a new transparent `src/assets/camera/take_photo_illustration.svg` built from Figma 8567:1851 vectors; `CameraPermissionPopup` still uses the PNG.
- Validation: TypeScript has no Birdzy errors (the untracked `mushrooms-reactNative/` folder reports its own errors); ESLint `--quiet` on changed files passed. On a connected Android phone (Birdzy dev, Metro): revoked camera access, denied twice, and checked that Allow access and Go to settings both match Figma; gallery button opened the gallery and back returned to the screen. Not checked on iOS. Jest filtered to "camera": 64 Birdzy tests passed; the 5 failing suites are all in the untracked `mushrooms-reactNative/` folder. Handover docs checker passed.
- Follow-up pixel pass (Figma 8558:25313): `CameraPermissionInlineState` now uses the Figma popup layout exactly — max 335 wide (shrinks on narrow screens), header pt20/pb16/px20 gap 8, footer pt16/pb20/px20, so the text→button gap is 32 (was 16). Explicit Figma type: body Satoshi-Regular 16/24 −0.16 `#D1D1D1`, title Satoshi-Bold 20/28 white, button Satoshi-Medium 16/24 white on `#785284` (new tokens `cameraPermissionCta`, `cameraPermissionTextSecondary`; previously theme primary/`#725481`). Text uses `allowFontScaling={false}` (repo convention) so line breaks match Figma. Content stays centered on the full screen with a symmetric inset from `getCameraPermissionGateContentInset()` so it never overlaps the top/bottom bars on short screens. Re-checked both screens on the Android phone after resetting the denial count; TypeScript/ESLint clean on changed files.
- Still open: the "gallery granted + camera denied → Scanning Tips → close opens gallery" Figma dev-note case is not implemented; iOS allows only one native camera prompt, so Case 1's second native dialog is Android-only.

## 2026-11-11 — Sync org and personal-mirror main

- Org `origin/main` and `personal-mirror/main` had diverged after separate merges (Explore/lifecycle/security on org; UI polish / camera permission on personal). Merged personal-mirror into local main, resolved Explore banner + Bird details title conflicts by keeping org entry/location behavior and identification photo flow while retaining personal responsive banner scaling and `allowFontScaling` polish.
- Updated this changelog. No environment or credential changes.
- Validation: `python3 docs/handover/check_docs.py` reported OK (14 handover pages, 297 local links). Push both remotes to the same tip after the merge commit. Device acceptance not re-run in this sync.
