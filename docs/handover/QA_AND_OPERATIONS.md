# Birdzy — QA and operations

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

## Verification levels

- **Source reviewed:** navigation/services/configuration inspected; not proof of execution.
- **Automated:** name the command, exact commit/environment and result; mocked native/network tests do not prove provider or device behavior.
- **Device:** record OS/device, build, account, permission state and successful/recovery path evidence.
- **Release:** attach signed artifact, store/sandbox transaction evidence, backend/config agreement and rollout approval.

This pack was generated from source inspection on 2 November 2026. App tests/builds were not freshly run across all five apps for this documentation-only task. Prior results, where mentioned, remain dated evidence; a checklist starts unchecked until the incoming owner demonstrates it.

## Minimum walkthrough

- [ ] Fresh installation, returning user, expired session, logout and second account.
- [ ] Permission grant/deny/settings recovery for camera, photo, notification and location features that the build exposes.
- [ ] Successful identification, no match, request error, usage limit, background/cancel and retry.
- [ ] Browse/search/filter/paginate; open details; save/edit/remove; refresh and verify durable server state.
- [ ] Purchase cancellation, pending/confirmation failure, restart recovery and restore with approved sandbox accounts.
- [ ] Deep-link/push navigation from terminated, backgrounded and foreground states, including deferred authentication.
- [ ] Theme, large text, keyboard, loading/empty/error UI and platform back navigation.
- [ ] App-specific flows below.

### Sound identification and audio library

- [ ] Test microphone denial, zero-length audio, interrupted recording, playback cleanup, no match, and saving the user recording.

Source: [src/features/camera/screens/SoundIdentifyScreen.tsx](../../src/features/camera/screens/SoundIdentifyScreen.tsx); [src/features/discovery/screens/AudioGalleryScreen.tsx](../../src/features/discovery/screens/AudioGalleryScreen.tsx).

### Step-by-step identification

- [ ] Change each answer and confirm the outgoing request changes. Missing location must not silently become an invented location.

Source: [src/features/discovery/screens/StepByStepScreen.tsx](../../src/features/discovery/screens/StepByStepScreen.tsx); [src/features/discovery/utils/runStepByStepAnalysis.ts](../../src/features/discovery/utils/runStepByStepAnalysis.ts).

### Explore Near You

- [ ] Check map token, denied location, manual search, delayed requests, map-only retry, clusters, full-screen return, pagination, and dark mode.

Source: [src/features/explore/screens/ExploreMapScreen.tsx](../../src/features/explore/screens/ExploreMapScreen.tsx); [src/features/explore/README.md](../../src/features/explore/README.md).

## Commands

- `npm run test:quiet`
- `npm run lint`
- `npm run prettier:check`
- `npm run verify:image-pipeline`

Also run the installed TypeScript compiler and targeted device checks for the changed paths. Review pretest/postinstall/release-note hooks before interpreting command side effects.

## Incident triage

1. Record app/version, platform, environment, account type, entry route and last successful action.
2. Determine whether failure is local permission/native state, stale account/cache, API/provider connectivity, backend contract, store entitlement or remote configuration.
3. Inspect redacted application logs, Crashlytics/error monitoring, the request status/reason and provider/backend status with the relevant owner.
4. Reproduce on a controlled account/device. Do not clear production user data, re-grant credits or repeat ambiguous purchase/upload mutations as a generic recovery step.
5. Implement/review the fix, verify the original failure and a successful path, then document changed behavior and any release/configuration action.

## Useful evidence to retain

A reproducible bug description, expected/actual state, redacted request/response shape, relevant ID type, screenshots/video, test command/output summary, affected commit, rollout/configuration change and who owns the next step. Never include session JWTs, full purchase receipts or personal media in general handover logs.

## Existing QA and operational references

- [docs/ANALYTICS_EVENTS_QA.md](../ANALYTICS_EVENTS_QA.md)
- [docs/sound-recording-device-qa.md](../sound-recording-device-qa.md)

## Explore location search regression

Run `npx jest __tests__/explore --runInBand`. The geocoding regression covers missing separate geocoding key with Mapbox available, coordinate order/range validation, no temporary Mapbox cache, minimum query length, cancellation and provider error handling. Explore UI regressions also cover Home banner permission labels and full-banner taps, Catalogue entry button/banner via `useExploreEntry`, equal Spotted Now / Year-round tab halves, empty/filtered empty wording, and Android vs iOS first-ask location copy. On both platforms, also verify suggestion taps while the keyboard is open, no old label restoration after selection, new coordinates driving results, and expanded-map search. These device checks remain open as of 2026-11-04.

### Explore entry and permission UI — 2026-11-11

- [ ] Home: with location off, banner says "Enable Location"; tapping empty banner area opens the permission popup; after grant it says "Explore Map". Rows stay label-only (no counts).
- [ ] Catalogue: "Explore Near You" pill and map banner open the same permission flow; banner hidden while filters are applied; brand outline visible on the map edge in light and dark.
- [ ] Explore map: Spotted Now / Year-round take equal halves; empty list uses body appearance wording; filtered empty mentions filters.
- [ ] Android first-ask popup: "Enable Location Access" / "Allow Location". iOS unchanged: "Improve Identification With Location" / "Continue".

## App audit validation — 2026-11-04

The camera prompt tests now supply the real light-theme context, matching the app host, including the foreground-ready first-visit scenario. Notification regressions cover account isolation, same-account retention, actual service refresh and stale sign-out responses; specimen regressions cover clearing editable arrays. Version-store regression checks the installed native version. Run the full Jest suite plus TypeScript, app-wide ESLint and both image verification scripts.

Device acceptance remains open: sign out/switch accounts while the notification list is loading; open View Plans from the legacy discount route; clear an editable specimen list and reload it; verify native Mapbox tiles, search, expansion and selection on both platforms. Provider/store/backend availability is not established by mocked tests.


## Remote push in background and after app exit

Android registers an FCM background handler at the entry point. For a data-only payload, send high Android priority and include a nonblank `data.title` or `data.body`, plus the existing routing fields. The handler creates the shared Notifee channel before posting the banner. If FCM supplies a notification payload, Android displays that alert itself. Test Android with the app backgrounded and after removing it from Recents. Android Settings → Force stop blocks delivery until the app is reopened.

The iOS app target signs with the development APNs entitlement for Debug and production for Release, including the corresponding dev-bundle configurations where present. Verify the signed entitlement, provisioning profile, APNs topic and server environment together. The scene forwards cold-start notification responses to the installed notification-center delegate. The device API still receives an APNs token on iOS and an FCM token on Android. For a visible iOS banner after force-quit, send an APNs alert. Silent pushes do not provide reliable force-quit delivery.

On physical devices, send both Android payload shapes and a real APNs alert in foreground, background and after app exit. Verify one banner, the intended destination on tap, and the Release/TestFlight build with its production APNs sender. Also check a denied-permission device and Android data-only taps when the app is already running in the background. For direct APNs alerts, verify the sender payload is recognized by the notification delegate and routes to the correct destination.


## Duplicate-call regression acceptance — 11 November 2026

Run `npx jest __tests__/lifecycle --runInBand` for account/session isolation, in-flight sharing, retry, listener ownership and app-specific regression coverage. Tests use mocked native/backend services.

- [ ] Cold-start signed in/out; move Home → catalogue → details → collections and back. Record redacted endpoint/mutation counts per user action. Allow explicit refreshes, expired-cache fetches, paging and documented bounded recovery retries.
- [ ] Switch accounts while requests are delayed; old responses must not restore old account data. Rotate the JWT while a screen is focused.
- [ ] Go offline for an empty/list failure, wait beyond the old retry intervals, restore connectivity and explicitly refresh. There must be no growing timer/request loop.
- [ ] Trigger repeated end-of-list events and rapid like/create/save taps before a render commits; verify one active operation and a working subsequent action/retry.
- [ ] Enter/leave screens quickly, background/foreground, change permission and refresh the push token. Verify one native token/foreground callback, continued registration after JWT rotation and one cold-start destination.
- [ ] Use sandbox purchases to verify failed initialization retry and repeated callbacks; navigate away during identification and update subscription state mid-scan.
- [ ] Capture React Profiler/device performance evidence for the busiest lists. Normal renders are expected when state changes; no FPS or render-count improvement has been measured in this source audit.

Device/backend/sandbox acceptance and QA owner assignment remain open. Automated results are recorded in the handover changelog.


## App-local responsive audit — 12 November 2026

See [Birdzy responsive design audit](../audits/responsiveness-2026-11-11/05-birdzy-responsive-audit.md) for source findings, proposed fixes and the pending QA matrix. Original audit date: 11 November 2026. No application code changed.


## Responsiveness implementation batch 1 — 12 November 2026

Implemented on `feat/responsiveness`: scalable wrapping shared action labels, scalable stacked sound-row copy, scrollable camera permission content bounded above the bottom controls and below the top controls, measured-parent detail paging, list-card page reconciliation and host-sized screen backgrounds. See [implementation contracts](DEVELOPMENT.md#responsive-implementation-foundation--12-november-2026) and [audit progress](../audits/responsiveness-2026-11-11/05-birdzy-responsive-audit.md#implementation-progress--12-november-2026).

Automated validation: 8 focused Jest suites / 25 tests passed; `tsc --noEmit --pretty false` passed; scoped ESLint completed with 0 errors / 20 warnings. Node 22.23.1 was used from the existing nvm installation. Renderer tests verify props, callbacks and paging offsets, not Yoga or native visual rendering. No native build, simulator/device, screen-reader or full font/display matrix was run.

Device acceptance remains open, owner unassigned:

- [ ] At 320×568, 360×800, 393×852 and 430×932, enlarge OS text to 200%/maximum and combine with display enlargement. Long shared-button labels must wrap without clipping; inspect parent fixed-height overrides, especially nested popups.
- [ ] Deny camera permission, inspect allow-access and settings variants, scroll from explanation to CTA, trigger loading and return from Settings. Back/gallery must remain reachable and enlarged content must not hide under camera chrome; repeat in short/wide app windows.
- [ ] Open bird sounds with a long title, My Recording badge, timer and long location metadata; confirm full text, play/pause, countdown and list scroll in both themes.
- [ ] On bird details, select a nonfirst image and resize the active window or tablet column; confirm image, dots and next/previous actions agree. Repeat while loading and after fewer images are returned.
- [ ] On a list card with multiple photos, swipe, resize and let auto-advance resume; confirm selection, page alignment and missing-image fallback.
- [ ] Verify raster and custom-SVG ScreenContainer backgrounds cover actual screen/column bounds after resize without seams or unwanted safe-area padding.

Remaining audit work includes core-detail/home semantic text scaling, purchase/legal layouts, custom tab labels, generic/legacy carousels, AppModal/AppSheet and sound-identification short-height states. These are not closed by shared-component changes.


## Responsive device handoff — 12 November 2026

The full responsive source pass is implemented on `feat/responsiveness`; [audit status](../audits/responsiveness-2026-11-11/05-birdzy-responsive-audit.md#full-audit-implementation-pass--12-november-2026) maps every finding to its changes. The requester will perform simulator/device checks and explicitly asked the agent to skip further simulator testing. All checkboxes below remain open until actual evidence is recorded.

Automated results: full Jest run: 91 suites / 822 tests passed, with one API-services suite / two tests failing. The same two failures reproduce on an extracted clean HEAD `30dcbbf`: the branch's temporary step-by-step API payload differs from the expected location; these services were not changed. TypeScript passed. Scoped lint has no errors, with warnings remaining. Documentation/whitespace and final bundle checks are recorded in CHANGELOG.

Requester checklist (both platforms and themes):

- [ ] Default text at 320×568, 360×640, 360×800, 375×812, 393×852 and 430×932 logical windows; repeat key paths at 200%/maximum text and display enlargement. Keep width and height stress cases separate.
- [ ] Home: full titles/descriptions, stacked identification/discovery/corner cards, nearby map panel and labeled FAB. Header and tab labels must grow without hiding Identify or the last list row.
- [ ] Onboarding/post-auth: every slide, Skip/Continue/guest/auth actions, denied/loading/settings-return location/notification states and short-window copy fallback. Confirm no duplicated safe padding or artwork covering copy.
- [ ] Purchase: monthly/yearly/lifetime, discount/original price, longest localized amount/currency, trial/no-trial, loading/retry, disabled/busy selection, subscribe/restore and every legal link. Stacked plans and complete disclosure must be scroll-reachable. Use the approved sandbox account for actual transaction tests.
- [ ] Catalogue/search/wishlist/all collection variants/explore/other apps: normal and large-text column changes, long names, empty/error/loading, last items, filters and star actions. Confirm no half-width cards in one-column mode or FlatList column-change errors.
- [ ] Bird details: long names/facts, overview tabs, range/map sections, sound library and recording labels. Swipe a nonfirst image, resize or change display settings, refresh to fewer images, then verify arrows/dots/current photo agree.
- [ ] Camera/microphone/location/photo permissions: explanation and both actions at large text; keyboard where applicable; close/back/gallery stay reachable. Camera tip grid and standalone popup content must scroll on short windows.
- [ ] Sound: idle/record/pause/resume/processing, crop/full recording, denied mic, no-match/retry/save-note and audio gallery. Check long location/metadata, play/pause/timer and cropped waveform gestures inside scrolling content.
- [ ] Forms/sheets: feedback/report/create/rename/move/add collection/custom location with keyboard, multiline errors and long input. Verify focused field, final error, primary action and close stay reachable; custom keyboard lifts must not be doubled.
- [ ] Device rotation/window resize where reachable, Android gesture/three-button bars, cutouts, tablet column and safe insets. Background art fills its current host; map/preview/crop geometry remains consistent.

Record exact build, OS/device, logical viewport, font/display setting, locale, tier/variant and screenshot/video for each result. This handoff does not claim device success or release sign-off. The earlier simulator attempt stopped in CocoaPods framework copy/generated-header tasks before app visual verification; generated headers were regenerated afterward, and no new simulator attempt was made following the request to skip checks.

Final code-only handoff checks: iOS and Android production JavaScript bundles compiled successfully. Installed Firebase export-resolution fallback warnings remain. Native build/device testing is delegated to the requester; no simulator was launched for these final bundle checks. The final TypeScript check and whitespace/documentation checks passed.
