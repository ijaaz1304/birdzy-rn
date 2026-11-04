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
