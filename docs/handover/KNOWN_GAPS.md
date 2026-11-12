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

## 2026-11-12 — step-by-step static test body still active

`archetypeService.stepByStep` forces a Malaysia test payload and ignores wizard/catalogue answers. Needed so API testing is not stuck on empty `lat/lng` 0 or GPS waits, but it is not production behavior. Owner must remove `STEP_BY_STEP_TEST_REQUEST` and restore `resolveBirdDiscoveryLocation` in `runStepByStepAnalysis.ts` once backend search with real answers is confirmed.

- Owner: not yet assigned.
- Evidence/status: restored from an earlier uncommitted chat change that had been lost from the working tree.
- Next action: confirm live results with the test body, then remove the override and re-verify with real wizard location/date/size.

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
