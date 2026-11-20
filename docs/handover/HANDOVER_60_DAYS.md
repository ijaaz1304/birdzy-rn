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

## Dark asset acceptance — 18 November 2026

- [x] Re-audited bundled raster artwork, removed identified mushroom/obsolete resources and replaced dark routes with audited supplied dark assets. Added a repeatable asset-reference guard. See [development guidance](DEVELOPMENT.md#dark-asset-selection--18-november-2026).
- [x] Replaced inherited quiz photographs with a generic bird mascot and stopped legacy remote mushroom images overriding the bundled artwork. Existing archetype IDs remain unchanged.
- [ ] Owner unassigned: accept phone/tablet light/dark renders and contrast/cropping on iOS and Android before enabling the master gate.
- [ ] Owner unassigned: supply distinct bird archetype artwork and define a bird-specific remote quiz-image contract.


## Supplied dark artwork acceptance — 20 November 2026

- [x] Connected dark artwork through dark-only routes under `src/assets/dark/supplied/`; removed duplicate dark onboarding and Home illustrations. Root `Dark Mode/` design dump removed; supplied-path and light-route guards remain.
- [ ] Owner unassigned: accept iOS/Android phone/tablet dark artwork, onboarding copy/CTA placement, and Light → Dark → Light regression checks in QA_AND_OPERATIONS.md. Native builds/device walkthroughs remain unverified; no access or ownership change is claimed.

- [x] 20 November 2026: checked Figma selected/unselected pagination nodes and implemented dark teal CTA/dot tokens; source assertions confirm light CTA/dot tokens remain unchanged.
- [ ] Owner unassigned: verify dark pagination animation and teal primary CTA on iOS/Android phones/tablets and complete the Light regression check.


## Dark Home Figma acceptance — 20 November 2026

- [x] Implemented dark Home surface overrides, corresponding composite artwork, native discount/countdown/header promotion styling and Explore map asset from the supplied Figma nodes. Kept Light routes and root artwork folder.
- [ ] Owner unassigned: accept Home promotion geometry/contrast, live timers, dismiss/subscription actions and premium/expired-offer states on iOS/Android phones/tablets, including Light regression checks. No native-build/device acceptance or access grant is claimed.


## Shared dark CTA / Catalogue / details acceptance — 20 November 2026

- [x] Implemented referenced CTA, Catalogue/search/sound and details dark styles; reused premium card and preserved API/navigation/playback handlers. Source assertions confirmed the complete Light theme and Light semantic/detail/card tokens are unchanged.
- [ ] Owner unassigned: accept all shared dark-token consumers, Bird of the Day actions, real Catalogue play/stop/search and premium Details on iOS/Android phones/tablets; check Light regression and disabled/loading states. Native builds and device walkthrough remain unverified.
- [ ] Owner unassigned: resolve the existing SettingsAccountDialog image-pipeline audit finding before claiming the combined image-pipeline check passes.


## Dark background / tab / feed flow acceptance — 20 November 2026

- [x] Audited shared and explicit plain dark surface routes; set `#091B21`, retained artwork and Light mappings, corrected dark bottom navigation geometry/Identify art, feed accents and Ask AI background visibility. Community Rules uses the shared dark surface throughout its native content.
- [ ] Owner unassigned: accept iOS/Android phone/tablet plain-background consistency, bottom navigation safe areas/chooser/reset, Ask AI send/upload, feed create/details and community rules scroll/agree/close, plus Light regressions. Native builds/device walkthrough not performed.


## Post details / Settings sheet gallery acceptance — 20 November 2026

- [x] Added a Settings-accessible sheet gallery, exhaustive registered/limit mappings, standalone variants and preview context guards for collection, location and permission effects. Implemented referenced dark post-details geometry and comment/reply Reply/Copy actions.
- [ ] Owner unassigned: open every preview in Light/Dark on iOS/Android phone/tablet and confirm all actions are local; verify closing, keyboard and plan-price-unavailable states. Complete real comment/reply/copy/like/share and Light regression checks. Native builds/device checks not performed.


## Inactive offer / name-sound acceptance — 20 November 2026

- [x] Implemented dark full-price Home banner selection with live full-price plan data and dark name-sound alignment/contrast; retained Light branches and existing playback/subscription handlers.
- [ ] Owner unassigned: accept active/off/zero/disabled timer states, live localized/missing prices, full-price navigation and long-name sound layout/playback on iOS/Android phones/tablets. Native builds/device/store/audio checks not performed.


## Sound identification entry acceptance — 20 November 2026

- [x] Implemented dark first-screen artwork/layout from Figma 9380:170994 and retained Light/recording/crop branches. Source dimensions and short-screen spacing checked; recording timer/minimum-duration regression suites passed.
- [ ] Owner unassigned: accept phone/tablet Light/Dark rendering, short-screen/rotation spacing, location and real microphone permission/recording transitions on iOS/Android. Native builds/device tests remain open.


## Recorded-sound crop acceptance — 20 November 2026

- [x] Implemented dark crop design 9380:171133 for both crop entry points, full-recording default and chip reset, red frame/grips and tap-to-preview. Preserved Light defaults/controls and existing trim/identify services.
- [ ] Owner unassigned: verify tap-versus-drag gestures, crop bounds, real preview/identify audio, short/tablet layouts and screen-reader actions on iOS/Android physical devices; complete Light regressions. Native builds/device renders remain unverified.

- [x] 20 November 2026: matched the dark crop location view to the explicit light-card Figma reference, with dark text and blue underlined location.
- [ ] Owner unassigned: accept location-off/known/long-place states, edit/permission actions and Light regression on iOS/Android crop screens.
