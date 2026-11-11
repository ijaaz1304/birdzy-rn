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
