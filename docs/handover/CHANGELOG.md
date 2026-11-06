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
