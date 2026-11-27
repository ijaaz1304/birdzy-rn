# Birdzy — known gaps and owner decisions

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

Items below are source/documentation findings or explicit verification gaps. They are not a fresh production incident list. Each needs a named owner, current reproduction/evidence, priority, next action and target date during handover.

## 1. Review item

The current workspace includes a large uncommitted Explore/core-API change set. Review and identify the exact commit to hand over; a local working copy is not a released build.

- Owner: not yet assigned.
- Evidence/status: source or historical reference reviewed; current device/release status to confirm.
- Next action: reproduce or reconcile the relevant source/contract, record a decision, and link the verification result.

## 2. Review item

BirdLife species IDs, archetype IDs, and saved specimen IDs serve different purposes. Preserve their mapping in map selection, details, wishlist and saving.

- Owner: not yet assigned.
- Evidence/status: source or historical reference reviewed; current device/release status to confirm.
- Next action: reproduce or reconcile the relevant source/contract, record a decision, and link the verification result.

## 3. Review item

Legacy mushroom/mineral names remain in compatibility types and filenames. Follow the Bird API payload and adapters rather than interpreting a filename as the current domain.

- Owner: not yet assigned.
- Evidence/status: source or historical reference reviewed; current device/release status to confirm.
- Next action: reproduce or reconcile the relevant source/contract, record a decision, and link the verification result.

## 4. Review item

Recent checks in this chat: 79 focused tests, TypeScript, API lint and Android JavaScript bundle passed. A broader run reported four failures in the existing free-scan camera prompt harness. These are historical execution results, not a fresh sign-off for every handover reader.

- Owner: not yet assigned.
- Evidence/status: source or historical reference reviewed; current device/release status to confirm.
- Next action: reproduce or reconcile the relevant source/contract, record a decision, and link the verification result.

## 5. Review item

The Mapbox public token was configured locally. Device rendering, live backend contracts, provider restrictions, and store builds still need an owner-led check.

- Owner: not yet assigned.
- Evidence/status: source or historical reference reviewed; current device/release status to confirm.
- Next action: reproduce or reconcile the relevant source/contract, record a decision, and link the verification result.

## 2026-11-12 — step-by-step static test body removed

The Malaysia test body (`lat` 3.7 / `lng` 101.7, fixed date and size) is no longer forced by `archetypeService.stepByStep` on `codex/dark-mode` (removed in the Nov 23 dark-mode work; param rename/confirm 2026-11-25). Collection Near You, Catalogue Near You, and the wizard post the caller's location, date, and size. `region` is still stripped before the HTTP body, matching the API contract test. **Note:** `main` still contains `STEP_BY_STEP_TEST_REQUEST` until that branch is updated or this fix is merged.

- Owner: not yet assigned.
- Evidence/status: source updated 2026-11-23 / confirmed 2026-11-25 on dark-mode. Live empty-result check on a device is still open.
- Next action: open Collection → Near You with location allowed and confirm the catalogue list is not the generic empty state; merge/remove the override from `main` if that branch is still used for builds.

## 2026-11-23 — Wishlist add fails for birds with flight pattern “Mixed” (backend)

`PUT /core/archetypes/wishlist/add/{archetypeId}` returns HTTP 500 for at least the Besra (`6a61f6c65db631270434c4b1`). The response is `Specimen validation failed: flightPattern.0: 'Mixed' is not a valid enum value for path 'flightPattern.0'.`
- The app sends no body; the server builds the wishlist specimen from the archetype.
- The archetype data and `GET /core/archetypes/filteritems` both treat `Mixed` as a valid flight pattern, but the Specimen schema's `flightPattern` enum does not include it.
- So any archetype whose flight pattern includes `Mixed`, and possibly other values missing from that enum, cannot be wishlisted from the Catalogue, Search or Possible Matches.

- Owner: backend, not yet assigned.
- Evidence/status: Android device logcat (`R9ZWA0A52AK`), 2026-11-23 14:49. The client id and request are correct.
- Next action: align the Specimen `flightPattern` enum with the archetype values: `Flapping`, `Diving`, `Undulating`, `Soaring`, `Mixed`, `Hovering`, `Erratic/zigzag`, `Skimming`, `Gliding`, `Low flight`. Check the other copied enums (habitat, diet, etc.) the same way. Then retest the wishlist add for Besra.
- Client workaround (2026-11-23): on this enum error, `archetypeService.addWishlistArchetype` falls back to `POST /core/specimen/add` with `isWishlisted: true`. The payload is built from the archetype details, and the values the server names as rejected are removed (`specimenEnumSanitizer.ts`).
  - Effect: those wishlist specimens are saved **without** the rejected value. For example, Besra's flight pattern loses “Mixed”.
  - Remove the workaround once the backend enums are fixed.
  - Open question for the backend: whether a specimen-only wishlist row (with no archetype wishlist PUT) is reported as `isWishlisted` on catalogue archetype lists after refetch.

## Shared open decisions

- Identify the primary and backup owner for product, mobile, backend, QA/release, billing, Firebase and design assets.
- Confirm current store builds, supported OS targets, remote rollout/flags and backend/provider contracts.
- Record the location of signing material and service credentials, with access verified by the incoming owner.
- Resolve differences between old generic README/migration notes and this source snapshot; preserve useful history with its date.
- Review local/uncommitted work and choose the exact commits that will be handed over. Do not assume a clean release branch from an edited working tree.

## Close an item only with evidence

Record the actual owner, changed commit/configuration, verification level and result, remaining limitation and closure date. If the backend/store owner must act, keep the item open rather than marking a frontend-only change as a full fix.

## 2026-11-04 native Mapbox verification

Explore now handles binaries missing Mapbox without an import crash, but installing a native rebuild is required for maps. The attempted simulator build was blocked by pre-existing pod deployment targets below Xcode's supported iOS minimum. Reconcile pod deployment targets with the app minimum and installed Xcode, reinstall pods, rebuild the correct flavor, and verify map tiles/selection on a device. Owner unassigned; acceptance open.

## 2026-11-04 audit status update

- The previous camera harness failure is fixed by supplying the required theme context. The final whole-app audit run passed 752 tests/70 suites, including notification-refresh, hydration and empty-list regressions; validation details are recorded in CHANGELOG.
- The previous pod minimum-version blocker is corrected in the Podfile and regenerated Pods project (all generated targets iOS 15.1); this does not by itself establish a successful native build or device map rendering.
- The initial “uncommitted Explore/core” description is historical: the audit began at commit `75d7054`, which already includes that work. Current audit/search changes remain local until reviewed/published.
- App-wide lint initially found 6 unused-import errors and 849 warnings. Errors were removed. Warnings remain (including 65 hook-dependency warnings) and need source-specific review; neither blanket dependency edits nor rule suppression were applied.
- Remote version enforcement still has no implemented latest/minimum-version contract. Installed version reporting is corrected; backend/product owner unassigned for the remote contract.
- Arbitrary discount-code redemption is unsupported. The legacy screen now opens real plans and no longer claims to apply a code. Product/store owner must define redemption eligibility before enabling it.
- Removed unused legacy AI helpers `getMushroomInfo` (hardcoded mineral facts) and `diagnoseRock` (always unsupported) after confirming there were no app callers. Bird details continue through the actual archetype/specimen services.
- Device, store-purchase, provider restrictions and live Bird PATCH/Explore acceptance remain open. A source/test audit cannot certify every deployed service or hardware behavior.

Final audit checks: TypeScript and app-wide ESLint error check passed; 752 whole-app tests plus 2 dedicated Mapbox wrapper regressions passed. Native compilation was interrupted, with build execution handed to the user on request. The 849-warning baseline remains a source-review backlog, not a build failure or a resolved item.

## 2026-11-27 — Explore optimization acceptance and baseline tooling

The [Explore audit/fixes](../audits/explore-optimization-2026-11-27.md) cover request scheduling, coherent TTL/snapshot caches, retry ownership, map-filter/location races, shared pending wishlist state, stable cluster input and image/search work. Targeted regressions pass. Device visuals/gestures/permissions, real map/list coverage, release frame times/heap and CDN policy remain unverified; owner unassigned.

The full repository suite still has the same two `cameraIdentifyReview.test.tsx` missing-ThemeProvider failures reproduced on the untouched baseline and optimized branch. TypeScript also reports two AskAIScreen legacy identification-type field errors. These unrelated areas were not changed to make an Explore-only result look green. No native build or live backend acceptance is claimed.
