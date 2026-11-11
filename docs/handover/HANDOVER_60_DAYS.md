# Birdzy — 60-day ownership handover

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

Planning starts **2 November 2026**. Sixty calendar days later is **1 January 2027**; confirm the actual last working day and holidays with the team. The phases below are a working sequence, not calendar appointments or claims of completed acceptance.

## Ownership record — complete with real people

- Outgoing mobile maintainer: to confirm.
- Incoming primary mobile owner: to confirm.
- Backup mobile owner: to confirm.
- Product/priority decision owner: to confirm.
- Backend/API owner and incident contact: to confirm.
- QA/device acceptance owner: to confirm.
- Release/signing/store owner: to confirm.
- Firebase/notification/configuration owner: to confirm.
- Billing/provider account owner: to confirm.
- Design/content/support owner: to confirm.

Record team-managed contact details and actual access grants here or link the approved internal access register. Repository read access alone does not transfer operational ownership.

## Days 1–10: inventory, access and first run

- [ ] Agree on primary/backup owners and the actual handover deadline.
- [ ] Review product and flows together; identify what is shipped versus flagged/planned.
- [ ] Capture the exact release branch/commit and disposition of local work.
- [ ] Give the incoming owner repository, API/docs, Firebase, design, stores, CI, signing and provider access as needed.
- [ ] Obtain development environment values through approved storage.
- [ ] Install from a clean checkout and run a development build independently.
- **Exit evidence:** clean-checkout commands, environment/native target, working app, open access blockers and their owners.

## Days 11–20: explain and demonstrate the product

- [ ] Walk through every flow in [FLOWS.md](FLOWS.md), including errors, permissions and entitlement boundaries.
- [ ] Trace one identification request, one save/edit and one purchase/restore through the source.
- [ ] Review analytics, remote configuration, notifications and support paths.
- [ ] Record app-specific caveats from [KNOWN_GAPS.md](KNOWN_GAPS.md).
- **Exit evidence:** walkthrough recording/notes, questions answered, updated flow docs and agreed priorities.

## Days 21–30: transfer development and debugging

- [ ] Incoming owner reproduces and fixes a small real issue with review from the outgoing maintainer.
- [ ] Incoming owner updates the affected docs and changelog in the same change.
- [ ] Run targeted checks and a device recovery path; explain why each check is relevant.
- [ ] Practice diagnosis of a permission issue, API failure and stale/pending purchase state.
- **Exit evidence:** reviewed change, regression evidence and an independent explanation of the fix.

## Days 31–40: shadow a release and recovery

- [ ] Confirm signing, sandbox testers, store products, release commands and artifact access.
- [ ] Prepare a release candidate or controlled internal build with the incoming owner operating the workflow.
- [ ] Exercise interruption/restore and app-specific native/provider flows.
- [ ] Demonstrate where to inspect crash/errors and pause a rollout; document actual rollback constraints.
- **Exit evidence:** signed/internal artifact or documented blocker, run links, QA results and recovery runbook.

## Days 41–50: incoming owner leads

- [ ] Incoming owner handles a real feature/fix and documentation update with minimal prompting.
- [ ] Backup owner completes the clean-checkout setup and one debugging exercise.
- [ ] Reconcile API/provider, product and docs differences; close or assign every known gap.
- [ ] Confirm pending backend/store/vendor actions have reachable owners.
- **Exit evidence:** independent change/release rehearsal, backup coverage and a prioritized remaining backlog.

## Days 51–60: final acceptance and continuity

- [ ] Review product, developer, environment, API, release and operational docs one final time.
- [ ] Verify incoming/backup ownership of credentials, signing, stores, CI, dashboards, design and support access.
- [ ] Record remaining issues with owner, priority, next step and target date.
- [ ] Confirm which exact release/build/commit is now owned by the incoming maintainer.
- [ ] Have product, engineering and release owners acknowledge the handover record.
- [ ] Transfer/remove personal access according to the team’s offboarding process after ownership/recovery access is verified.
- **Exit evidence:** named acceptance, release/build identifier, access register link, remaining backlog and escalation contacts.

## Access and knowledge-transfer checklist

- [ ] Git repository, protected branches, review process and issue tracker.
- [ ] Figma/design files, bundled assets, content owners and copy/translation source.
- [ ] Dev/prod API contracts, backend owner, test accounts and service status/debugging access.
- [ ] Firebase projects, native app registration, Firestore/Storage, messaging, Crashlytics, analytics and Remote Config.
- [ ] Google/Apple sign-in configuration and allowed app/signing identities.
- [ ] App Store Connect / Play Console, sandbox testers, subscription/consumable products and server notifications.
- [ ] Android keystore/upload key and iOS certificates/profiles, with recovery and renewal responsibility.
- [ ] CI/build runner, required secret names, artifact storage, previous good build and release monitoring.
- [ ] Maps/geocoding, attribution, external media, feedback and any app-specific services.
- [ ] QA devices, platform accounts, hardware/tool-specific testing and support escalation.

## Acceptance evidence log

For each phase append: date, operator, app/branch/commit, environment/build, action performed, evidence link, result, blocker and follow-up owner. Do not check boxes based only on the creation of these documents.

## Explore-specific transfer

- [ ] Mapbox account/token restrictions and billing owner, geocoding provider access, map API contract and species/observation ID mapping.
- [ ] Actual device evidence for map loading/retry, selection, expansion, location denial and explicit place search.

- [ ] 2026-11-04: Incoming mobile owner (unassigned) to verify the rebuilt iOS/Android Mapbox module, interactive Explore and missing-module fallback; device acceptance remains open.

- [ ] 2026-11-04: API/mobile owner (unassigned) to confirm successful authenticated POST map GeoJSON response on the Bird deployment after the GET 404 correction.

- [ ] 2026-11-04: Mobile owner (unassigned) to verify Explore city search/selection with keyboard open, clear/retype and expanded map on both platforms. Provider HTTP acceptance passed; device interaction remains open.

- [ ] 2026-11-04 audit: Assign mobile/backend/QA owners and verify account-isolated notifications, actual Firestore refresh, specimen list clearing, discount-to-plans navigation, and rebuilt native maps on both platforms. Mock/service checks are recorded in CHANGELOG; device/store acceptance remains open.

- [ ] 2026-11-04: User will run native builds. Audit build was stopped at user request; record resulting build links, map/device checks and release acceptance here.

- [ ] 2026-11-04: eMudhra patch acceptance — assign mobile/release and QA owners; verify patched iOS Firestore dependencies, production archive, Firebase device flows, TestFlight, published version and user update adoption. Builds are user-run; release/device acceptance remains open. See [remediation guide](../firebase-emudhra.md).

## Remote push acceptance — 2026-11-09

- [ ] Owner unassigned. Verify Android foreground, background and Recents-exit delivery and taps, plus signed iOS Debug and TestFlight/APNs delivery and taps. See [the device QA notes](../../docs/handover/QA_AND_OPERATIONS.md#remote-push-in-background-and-after-app-exit). Builds and physical-device checks are open.


## Duplicate-call lifecycle acceptance — 11 November 2026

- [x] Implemented source guards and automated lifecycle regressions for the audited request/listener/mutation paths.
- [ ] Owner unassigned. Complete the duplicate-call device/backend/sandbox checklist in QA_AND_OPERATIONS.md, attach build/device/network-trace evidence and profile list renders on both platforms.
- [ ] Owner unassigned. Resolve the remaining project-wide test/compiler baseline issues recorded in CHANGELOG.md before release acceptance.

## Explore entry UI acceptance — 11 November 2026

- [x] Source: shared `useExploreEntry`, Home/Catalogue banners, equal Spotted Now / Year-round tabs, empty-state wording/style, Android first-ask copy.
- [ ] Owner unassigned. Complete the Explore entry and permission UI checklist in QA_AND_OPERATIONS.md on physical devices (Android + iOS).
