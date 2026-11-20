# Birdzy — handover change history

## 2026-11-20 — remove root Dark Mode design dump

- Deleted the untracked root `Dark Mode/` folder (~55MB design source). App dark assets remain under `src/assets/dark/supplied/` and `src/assets/dark/figma/`. Manifest `suppliedAssets` is now a path list; `verify:dark-assets` checks those files exist and fails if `Dark Mode/` returns. Updated DEVELOPMENT, QA, and HANDOVER_60_DAYS.
- Validation: `npm run verify:dark-assets` passed (402 registry references; 46 obsolete paths absent).

## 2026-11-20 — Explore Near You banner description

- Home / Catalogue Explore Near You card description under the heading is now "Discover bird sightings, hotspots, and species around your area." (`EXPLORE_HOME_STRINGS.description`). In dark mode the subtitle uses primary/white text (same as the heading); light mode keeps secondary grey. Dark-mode card/banner fill is `#091B21` (`homeSurfaceDark`), matching other apps. Updated FLOWS and PRODUCT.
- Validation: `HomeExploreNearYouSection` Jest — 4 tests passed. Not run: device visual check of wrap on small phones.

## 2026-11-20 — Appearance picker touch targets

- Settings → Appearance rows nested a touchable `RadioButton` inside a row pressable, so taps on the radio often did not change the theme. Rows now use a single `Pressable` with a non-interactive radio indicator, primary label color, and 52dp row height. `RadioButton` supports `interactive={false}` for the same pattern in Accordion. Settings toggles gained extra hit slop.
- Validation: not run (device). Theme Jest suites not re-run this change.

## 2026-11-19 — show Appearance and enable dark mode

- Settings → Appearance was hidden because `isDarkModeEnabledForApp()` returned false, and a Light Remote Config arm also hid the row and locked the theme. Dark mode is now on for the whole app. Appearance offers Light, Dark, and System on every build. `theme_default` only sets the first theme when the user has not chosen one. A stored Light value with no explicit choice can follow the system default. iOS `UIUserInterfaceStyle` is Automatic.
- Updated product, flow, development, QA, Firebase setup, and theme-experiment docs.
- Validation: 4 theme Jest suites / 15 tests passed; handover link checker passed. Not run: native rebuild, phone/tablet light/dark walkthrough. iOS Automatic appearance is not on an already installed binary until that binary is rebuilt. Owner for device contrast/cropping remains unassigned.

## 2026-11-18 — remove inherited mushroom artwork and dark fallbacks

- Re-audited 308 bundled PNG/WebP files with contact sheets/full-size spot checks. Deleted 46 identified mushroom or obsolete assets, including 44 rasters and both unused legacy subscription SVG backgrounds. Added `docs/dark-assets-manifest.json` and `npm run verify:dark-assets` to prevent broken references, deleted files returning and light assets behind Dark aliases.
- Remapped dark backgrounds, onboarding, cards, banners, quiz/personality, AI avatars, feed and popup artwork to supplied bird/generic resources. Home identify copy is now native/localized; dark onboarding has native illustrations/stats; neutral transparent gift/error art uses shared names rather than fake dark aliases. Quiz IDs remain unchanged, use a generic bird mascot and ignore inherited remote mushroom image overrides. Dark rollout gates remain unchanged.
- Updated development, API/data, QA, handover ownership, specialist asset audit/checklist and scripts guidance. Distinct bird quiz archetype art remains product follow-up, owner unassigned.
- Validation: TypeScript passed; 4 targeted Jest suites / 14 tests passed; dark-asset guard passed (387 registry references, 46 removed files); standalone image routing passed (322 bundled entries); targeted ESLint passed with inline-style warnings; documentation checker and `git diff --check` passed. The broader image-pipeline audit retains its pre-existing SettingsAccountDialog Image/import finding from the earlier check.
- Not run: native builds or phone/tablet acceptance. Full SVG preview could not be completed: local-file browser preview was blocked by browser URL policy; no bypass attempted. Simple existing SVG icons were retained. Native contrast/cropping and SVG fidelity remain open, owner unassigned.

## 2026-11-18 — audit and wire suitable dark assets

- Created `codex/dark-mode` from local `main`. Corrected dark subscription carousel entries, paywall background selection, Home Go Pro, Identify tab, bird-of-the-day header/popup assets and sound-identification popup art. Light variants and rollout gates are unchanged.
- Audited all 59 dark-folder PNG/WebP files visually. Several contain inherited mushroom artwork or white backgrounds; these are explicitly recorded as follow-up in DEVELOPMENT and HANDOVER_60_DAYS. Retained raster paywall background because its SVG uses filters/blending; existing simple SVG icons remain vectors.
- Validation: `tsc --noEmit` passed; theme Jest suites passed (3 suites, 12 tests); standalone `verify-app-image-routing.js` passed (329 bundled entries); documentation checker passed; `git diff --check` passed. `npm run verify:image-pipeline` failed on pre-existing direct Image usage/import in unchanged SettingsAccountDialog.tsx; its chained routing check was run independently and passed.
- Not verified: native builds, phone/tablet rendering, cropping, SVG fidelity, dark contrast. Owner unassigned for artwork replacement and iOS/Android acceptance before enabling the master gate.

## 2026-11-12 — Sound matches header + step-by-step test payload

- Sound Possible Matches header: the ⋯ menu used a fixed-width middle spacer, so it sat next to back instead of the top-right. Middle slot is now `flex: 1` (`OtherPossibleMatchesScreen`).
- Step-by-step kept loading when live wizard location/size produced empty or stalled searches. The temporary shared test body from an earlier uncommitted chat was missing from `archetype.service.ts`. Restored `STEP_BY_STEP_TEST_REQUEST` (`lat` 3.7 / `lng` 101.7, `seenDate` 2026-06-26, `birdSize` `["Small","Medium-Small"]`) for every `stepByStep` call. Wizard loading path skips GPS resolution while that override is active so DiagnosisLoading cannot hang on location.
- Docs: API_AND_DATA + KNOWN_GAPS note the temporary override must be removed before release.
- Validation: source review of prior chat + current call sites. No device re-run of step-by-step or sound matches in this change; Metro was already running on a connected Android device.

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

## 2026-11-20 — Supplied dark artwork and onboarding duplicates

- Retained the original root `Dark Mode/` folder and copied matching PNGs byte-for-byte into `src/assets/dark/supplied/`. Replaced dark-only registry routes for onboarding/auth, Home, Ask AI, feed/catalogue/collection empty states, post-auth illustrations, upgrade and permission sheets. Existing light/shared registry routes are unchanged and protected by the asset verifier.
- Removed the extra dark onboarding top illustration overlay; the supplied backgrounds already include artwork. Dark auth uses its full background without the light bird-circle overlay. Light auth keeps its existing split layout. Dark Android tablet slides show native copy. Home dark cards use supplied composite artwork without duplicate icons.
- Updated DEVELOPMENT.md, QA_AND_OPERATIONS.md, HANDOVER_60_DAYS.md and asset provenance/guard documentation. No environment/API change.
- Validation: `npm run verify:dark-assets` passed (395 registry references, 46 obsolete paths absent, retained-source parity and light-route checks); `npm run verify:image-pipeline` passed with its existing SettingsAccountDialog raw Image audit finding; targeted ESLint passed with 0 errors / 44 warnings; `python3 docs/handover/check_docs.py` passed (14 pages, 302 local links; optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native builds or simulator/physical-device render checks. Owner unassigned: complete phone/tablet iOS/Android cropping, copy/CTA, contrast and light/dark switching acceptance in QA_AND_OPERATIONS.md. Earlier local Appearance/settings/radio/accordion changes were preserved.


## 2026-11-20 — Figma dark pagination and teal primary CTA

- Implemented Figma nodes 9373:171149 (selected) and 9373:171150 (unselected) using the existing 8×8 animated pagination circles. Dark selected fill is `#16B6B4`; unselected is the same teal at 20% opacity.
- Added dark-specific app tokens and applied the teal primary CTA fill to the design-system theme, legacy dark theme and onboarding CTA constant. Light CTA and pagination colors are unchanged. No environment/API change. Updated development, QA and handover acceptance notes.
- Validation: loaded actual TypeScript theme modules with the installed compiler and asserted dark CTA/dot values, legacy dark CTA, onboarding dark CTA and unchanged light CTA/dot values; all passed. Targeted ESLint passed without errors or warnings. `python3 docs/handover/check_docs.py` and `git diff --check` passed.
- Not performed: simulator/device render verification or native builds. Owner unassigned: accept animation, contrast and phone/tablet light/dark appearance on both platforms.

## 2026-11-20 — Dark Home surfaces and Figma promotions

- Applied the requested dark wizard background `#072C38` and Identify by Photo background `#0E2230`; selected the supplied dark photo panel. Dark sound identification uses the teal fill and 60% white panel shown in Figma. Light branches retain their existing values/assets.
- Implemented Home Figma nodes 9375:227597, 9375:212474 and 9375:212475: crowned-bird 335×160 offer with native left-aligned headline/timer/teal CTA, teal bordered sticky countdown with pill timers/nest/badge, teal-to-purple Go Pro/premium header with medal, matching Bird of the Day/Ask AI/Library cards, and dark Explore surfaces/map. Corrected the previous Bird of the Day mapping from a 72×72 icon to the 323×272 composite card. Existing countdown state, offer eligibility, navigation and dismiss callbacks remain connected.
- Added `DarkHomePromotions.tsx`, dark-specific Home tokens and local Figma map artwork. Retained original `Dark Mode/` files and recorded new runtime-copy provenance. Updated development, QA and handover acceptance notes. No environment/API change.
- Validation: `tsc --noEmit --pretty false` passed; targeted ESLint returned 0 errors / 34 warnings; dark asset verifier passed (400 registry references, 46 obsolete paths absent, original-copy parity and light-route guards); image-pipeline verifier passed with the existing SettingsAccountDialog raw Image audit finding. Confirmed nonempty local assets and expected banner/card/photo/library/medal dimensions. Documentation checker passed (14 pages, 302 links, one optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native builds, simulator screenshots or physical-device tests. Owner unassigned: complete dark Home promotion/Explore action, geometry and contrast acceptance and Light regression checks on iOS/Android phones/tablets. Figma image inspection and source dimensions do not establish device-render fidelity.

## 2026-11-20 — Shared dark CTAs, Bird of the Day, Catalogue and details

- Implemented Figma CTA nodes 9375:212793 / 9375:212792: shared dark primary fill `#16B6B4`, white medium text, 24-point corners and soft glow; Bird of the Day View details uses the dark surface/border and Refresh retains primary styling. Updated shared buttons, popup helpers, subscription CTA constants/intro, camera Identify and post-auth overrides. Light button branches retain their original tokens.
- Replaced inherited dark semantic cream/grey primary values with the referenced bird palette (`#091B21`, `#091421`, `#072C38`, teal brand/focus colors, white inverse text). Catalogue node 9399:156319 now uses dark card surfaces, teal active tabs, single-line names and 12/16 scientific-name copy. Search node 9399:156329 uses the dark focused fill and teal edge/cursor. Bundled exact Figma search/volume/mute SVGs; play/stop handlers and dynamic species imagery/content remain unchanged.
- Applied Details node 9399:159869 dark surfaces/CTA tokens and reused `SubscribeToPremiumCard` for dark locked-section overlays, with bird-specific native copy and a teal Get Premium CTA. Kept Light overlays, existing premium criteria and navigation. Updated asset provenance, development, QA and acceptance notes. No environment/API change.
- Validation: TypeScript `tsc --noEmit --pretty false` passed. Targeted ESLint completed with 0 errors / 114 warnings. Runtime source assertions compared the entire Light semantic palette/theme and Light detail/card/subscription CTA constants with HEAD and passed; asserted dark surface/CTA/focus values also passed. Dark asset guard passed (400 registry references; 46 obsolete paths absent; Light-route/source-copy guards); Figma SVGs are nonempty, parse successfully and retain intrinsic dimensions inside 24-point render slots. Separate AppImage routing verifier passed. Handover checker passed (14 pages, 302 local links, optional sibling portfolio link unavailable); `git diff --check` passed.
- Combined `npm run verify:image-pipeline` did not pass: its existing SettingsAccountDialog raw Image/import audit finding exits nonzero before the routing stage. This corrects earlier entries that described the audit output as passing; the separate routing check passes. The out-of-scope finding remains open, owner unassigned.
- Not performed: native build, simulator/device screenshots, real audio playback or purchase tests. Owner unassigned: accept shared dark-token consumers, Bird of the Day actions, Catalogue search/play/stop, locked Details navigation and Light regression on iOS/Android phones/tablets. Source checks do not establish rendered fidelity.

## 2026-11-20 — Dark background sweep, bottom tabs, Ask AI and feed/community

- Reviewed Figma nodes 9380:171015, 9380:186844, 9403:59273, 9406:7211 and 9406:7208. References include mixed light/dark styles; applied the requested dark native palette while retaining their layout/artwork and preserving Light branches.
- Standardized plain dark defaults to `#091B21` through semantic surfaces and explicit auth/profile, feed/card, collection/edit, sheet/modal, location-input, subscription retry and tooltip overrides. Kept supplied background images, designed accent panels and the focused search state; camera/media preview backgrounds remain functional media surfaces.
- Updated dark bottom tabs: 16-point side icons, 14/20 labels, full tab-width 2-point teal selection line, 56-point row plus safe area, and 48-point native teal Identify circle using exact locally bundled Figma bird/frame SVGs. Removed the runtime use of a full-screen background as the dark Identify tab icon. Existing tab analytics/reset/measurement and chooser behavior remain connected. Light tab geometry/artwork unchanged.
- Ask AI retains supplied night-sky art at full opacity without the old fade. Feed keeps its header art/dynamic content, with dark cards and teal active tabs/Create label. Community Rules keeps configured scrollable content, existing agree/close behavior and dark native surfaces/teal CTA. Updated developer, QA, acceptance and specialist Feed docs; no environment/API change. Original `Dark Mode/` folder remains intact.
- Validation: TypeScript `tsc --noEmit --pretty false` passed. Targeted ESLint completed with 0 errors / 141 warnings. Source assertions verified plain dark theme/feed/sheet/collection backgrounds, teal tab selection and the distinct focus token; full Light theme and audited Light flow constants match HEAD. Dark asset guard passed (400 registry references, 46 obsolete paths absent, original-copy/Light-route guards); standalone AppImage routing verifier passed. SVG assets are nonempty, parse correctly and preserve intrinsic dimensions in the 24-point scan slot. Handover checker passed (14 pages, 302 local links; one optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native build, simulator/device render or navigation/send/create/agree tests. Owner unassigned: complete iOS/Android phone/tablet dark background, tab safe-area/chooser/reset, Ask AI, feed/details/create, Community Rules and Light regression acceptance in QA_AND_OPERATIONS.md. The existing SettingsAccountDialog image-pipeline audit finding remains open.

## 2026-11-20 — Figma post details and Settings bottom-sheet gallery

- Applied Figma node 9406:7143 as dark-only post-details overrides: compact 52-point header, 8-point author/content gaps, 116-point comment field, 32-point Send pill with disabled styling, 16-point bottom action icons and separate reply header/body rows. Dynamic post/avatar/comment data and existing send/like/share handlers remain in place; Light geometry is retained.
- Added CommentActionSheet with Reply and Copy text from comment/reply More controls, using the existing reply composer and system clipboard. No comment deletion/report endpoint was introduced.
- Added Settings → Previews → Bottom sheets and the typed BottomSheetGallery route. The gallery covers all 15 AppSheet types, all nine limit categories, 50%/70% offer/promotion variants and standalone post/comment action, password, location, removal, plan-selection and plan-switch sheets. A typed Registry and LimitType Record enforce complete registered/limit coverage when types change.
- Added SheetPreviewContext (default false, provided only by the gallery). Preview collection queries use local fixtures; collection create/rename/remove, permission requests/effects and manual location geocoding return before external actions. Other sample callbacks close previews without purchase/account/report/password changes. Pricing hooks may still read plan information. Corrected the Switch Plan dark panel's previously fixed white surface while exposing it in the gallery. Original dark artwork folder remains intact; no environment/API change.
- Updated flow, development, feature-catalogue, QA, handover acceptance and specialist Feed notes.
- Validation: TypeScript `tsc --noEmit --pretty false` passed. Targeted ESLint returned 0 errors / 47 warnings. Executed eight actual extracted preview handlers in an isolated JavaScript context without service/native/network globals: create, rename, notification enable, location enable, both AppSheet collection loaders, standalone geocoding submit and removal all returned/used fixtures successfully. Dark asset guard passed (400 registry references, 46 obsolete paths absent, Light-route/source-copy guards); standalone AppImage routing verifier passed. Handover checker passed (14 pages, 306 local links; optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native build, device/simulator renders, opening every sheet, actual clipboard/comment/reply/purchase/permission tests. Owner unassigned: complete the gallery action-isolation, keyboard/dismissal and post-details acceptance in QA_AND_OPERATIONS.md on iOS/Android phones/tablets in Light/Dark. The pre-existing SettingsAccountDialog image-pipeline audit finding remains open.

## 2026-11-20 — Inactive Home offer and identification sound-control alignment

- Implemented Figma 9375:212476 as HomeFullPriceBanner, reusing the supplied crowned-bird background and native Upgrade to Pro / unlimited features / teal Subscribe now content. Annual price/monthly equivalent use the full-price plan hook and existing formatter; no sample price is hardcoded and unavailable price rows are omitted.
- Dark Home shows this banner when the discount phase is inactive/disabled or the displayed countdown reaches zero. Preserved premium exclusion, dismissal, analytics and full-price navigation (`discount50: false`, plan modal open). Existing Light banner/artwork and active-flag behavior remain unchanged.
- Fixed Figma 9375:213219 dark identification/Bird Details name-sound control: full-width name container with 20-point insets, flexible name copy, non-shrinking 48×48 button at the right edge, `#091B21` fill / `#333333` border and white glyph at its intrinsic dimensions within a 24-point slot. Existing sound availability/play/stop/end logic and Light styles remain unchanged.
- Updated flow/development/feature-catalogue/QA/acceptance notes. No environment/API change; original Dark Mode folder retained.
- Validation: TypeScript passed; targeted ESLint completed with 0 errors / 79 warnings. Executed the actual Home conditional for active-positive, inactive-cooldown, active-zero, inactive-zero and unchanged Light-active cases; all five passed. Source geometry assertions confirmed full-width dark name row, page inset, fixed/non-shrinking 48-point control, dark fill and 24-point icon slot. Dark asset verifier passed (400 references, 46 obsolete paths absent, Light-route/source-copy guards); standalone AppImage routing and handover links/examples passed (14 pages, 307 links; optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native builds/device renders, store-price purchase/navigation or real sound playback. Owner unassigned: complete phone/tablet iOS/Android long-name icon, playback, inactive-banner price/CTA and Light regression acceptance. Existing SettingsAccountDialog image-pipeline audit finding remains open.

## 2026-11-20 — Figma first sound-identification screen

- Implemented dark entry phase from Figma 9380:170994: retained supplied night-sky background and bird/wave artwork, reference hero/copy/location arrangement, removed the extra dark tagline and anchored the 72-point record target with 48-point teal microphone circle near the safe-area bottom. Bundled the exact Figma microphone SVG at intrinsic dimensions within its 24-point slot. Short-screen spacing reduces the reference 100-point top gap when needed.
- Dark location row uses readable dark surface/border with a grey track/white thumb; existing location, microphone permission, start-recording, minimum-duration, live recording, crop and identification handlers remain connected. Light entry and later recording/crop visual branches retained. Original Dark Mode folder preserved; new runtime copies/provenance added. No environment/API change.
- Updated development, QA, handover acceptance and specialist physical-device sound QA notes.
- Validation: TypeScript passed; targeted ESLint completed with 0 errors / 8 warnings. Existing recordingTimer and soundRecording.constants Jest suites passed (2 suites / 8 tests). Confirmed 438×336 hero and 750×1174 background dimensions, nonempty 17.5×21.5 SVG, reference aspect ratios and available-height fit at 812/667/568-point screen sizes. Dark asset guard passed (402 registry references; 46 obsolete paths absent; Light-route/source-copy checks); standalone AppImage routing passed. Handover checker passed (14 pages, 307 local links; optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native build, device/simulator rendering or physical microphone/location tests. Owner unassigned: complete the linked first-screen and sound-device acceptance checklist on iOS/Android phones/tablets. Existing SettingsAccountDialog combined image-pipeline audit finding remains open.

## 2026-11-20 — Figma recorded-sound crop UI

- Implemented Figma 9380:171133 dark crop layout in the shared recorded-sound content/preview: compact title/body spacing without duplicate headings/tagline, duration chips, 100-point rounded spectrogram, full-height red frame and grip handles, teal time endpoints, real session metadata/location and existing sticky Identify CTA. Both crop entry points use the supplied dark popup background.
- Dark begins with the full recording; selecting 9/18/27 seconds creates the existing fixed-length crop, and tapping the selected chip restores full. Dragging still moves the clamped fixed window. Dark preview now uses a tap gesture on the spectrogram with accessible play/pause guidance, replacing the large center overlay. Light keeps its previous default, overlay play control and crop geometry. Actual recorded spectrogram columns remain dynamic; no sample recording image replaces audio data.
- Bundled the exact Figma grip SVG at intrinsic dimensions and recorded provenance. Existing playback/trim/identification services, microphone logic and recording controls remain connected. Updated developer, QA, specialist sound-device and handover acceptance notes. No environment/API change; original Dark Mode folder retained.
- Validation: TypeScript passed; targeted ESLint completed with 0 errors / 16 warnings. Crop, recording finalization, timer and constants Jest suites passed (4 suites / 15 tests). Executed actual crop state initializers/selection handler to verify Dark full default, selection, same-chip reset and unchanged Light default/selection. Asset guard passed (402 registry references, 46 obsolete paths absent, Light/source-copy guards); standalone AppImage routing passed; handover checker passed (14 pages, 307 local links; optional sibling portfolio link unavailable); `git diff --check` passed. Grip asset is nonempty with a 13×5 intrinsic SVG rotated inside its 9×20 handle slot.
- Not performed: native builds/device renders, tap/drag arbitration, real playback/trim/identification or screen-reader tests. Owner unassigned: complete physical iOS/Android phone/tablet and Light regression acceptance in the sound-device and handover QA guides. Existing SettingsAccountDialog image-pipeline audit finding remains open.

## 2026-11-20 — Dark crop location card matches Figma

- Updated SoundRecordingCropContent's dark location view to Figma 9380:171133: light-grey `#F6F6F6` fill, `#E7E7E7` border, 8-point corners, 12-point padding and dark 14/20 text. Known locations remain blue/underlined and now include the reference angle brackets. The location-off variant has matching card contrast and a grey/white toggle.
- Fixed style precedence so the explicit card fill overrides the generic dark surface. This narrow reference-specific treatment supersedes the prior generic dark location card; Light styling and enable/edit/analyzing handlers are unchanged. Updated development, QA and handover acceptance notes; no API/environment change.
- Validation: TypeScript passed; targeted ESLint completed with 0 errors / 9 warnings; handover checker passed (14 pages, 307 links; optional sibling portfolio link unavailable); `git diff --check` passed. No device render or permission/edit-location interaction test performed. Owner unassigned: accept long-place wrapping and Light/Dark location states on iOS/Android.
