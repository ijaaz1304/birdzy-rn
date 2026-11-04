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
