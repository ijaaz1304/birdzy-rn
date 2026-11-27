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

## Dark asset cleanup acceptance — 18 November 2026

Automated checks: `npm run verify:dark-assets`, `node scripts/verify-app-image-routing.js`, `npx tsc --noEmit`, and `npx jest src/features/theme src/features/quiz/data/quizImageMap.test.ts --runInBand --watchman=false`. The source guard prevents known removed paths and non-dark registry aliases; it does not classify image content.

Device acceptance is open (owner unassigned). The master theme gate is on and Appearance is visible. Check both themes on phone/tablet: all onboarding pages and native stats/copy/CTAs; auth and personality backgrounds; Home Identify banner, bird/AI cards and sound-library row; Identify tab and Go Pro; feed header; discount/rate/feedback and permission sheets; bird-of-the-day and sound-limit popups; all seven subscription slides; quiz intro/analysis/results. Confirm no mushroom artwork or baked-in mushroom text, and no overlapping copy or incorrect cropping. Native SVG fidelity, white panels in supplied dark artwork and contrast remain unverified. iOS Automatic appearance needs a native rebuild before it is on an installed binary.


## Supplied dark artwork acceptance — 20 November 2026

Run `npm run verify:dark-assets` for missing paths, supplied dark asset presence, unchanged light/shared registry mappings, obsolete-file checks, and absence of the root `Dark Mode/` dump. Run `npm run verify:image-pipeline` for bundled image routing. On iOS/Android phones and tablets, switch Light → Dark → Light and inspect all five onboarding pages: one illustration from the background only, readable native copy, no duplicate top artwork, working Next/Get started/auth buttons. Compare light onboarding with the previous build, including its split auth artwork. Review dark Home cards, Ask AI, feed/collection/catalogue empty states, post-auth notification/gift pages, permission sheets and upgrade sheets for crop and contrast. Device acceptance and native builds remain open.


### Dark pagination and CTA acceptance — 20 November 2026

On phone and tablet, verify dark onboarding pagination has equal 8×8 circles: selected teal `#16B6B4`, unselected teal at 20% opacity. Swipe between pages to check color interpolation and confirm primary buttons use the teal fill. Switch to Light and confirm existing purple CTA and light dot colors. Source token assertions and targeted lint passed; rendered device acceptance remains open.


### Dark Home Figma acceptance — 20 November 2026

Check Home in Dark with an active offer: wizard background `#072C38`, Identify by Photo `#0E2230` with dark inner artwork, readable Bird of the Day/Ask AI/Library cards, 50% offer with crowned bird on the right and live timer/CTA on the left, sticky countdown with teal border/pills and nest, teal/purple Go Pro header. Verify premium header state, expired-offer branch, close controls and subscription navigation. Explore should show an undimmed dark map with teal edge, markers, dark panel/button borders and working permission/entry actions. Compare Light before/after on iOS/Android phones/tablets; check narrow layouts, text wrapping and image cropping. Static asset/geometry checks are not device-render acceptance.


### Dark CTA / Catalogue / details acceptance — 20 November 2026

Compare Light → Dark → Light on iOS/Android phones/tablets. Check shared primary buttons, subscription intro/purchase CTAs, post-auth onboarding and camera Identify for teal/white contrast and disabled/loading behavior. Bird of the Day View details must open details; Refresh must retain its limit/upgrade behavior. Inspect Catalogue idle/focused/filled search borders and cursor, teal selected tabs, dynamic grid images/names, single-line labels and dark card edges. Tap sound to play, tap the mute icon to stop, and scroll/navigate away to confirm existing cleanup. Verify Details dark page/cards, Overview contrast, traits, selected size indicators, sounds and locked-section premium overlays; Get Premium must retain its subscription destination. Native visual fidelity and real playback remain device acceptance tasks.

The image pipeline audit currently exits nonzero for the existing raw Image/import finding in `SettingsAccountDialog.tsx`; the separate AppImage routing verifier passes. This finding is outside the requested screens.


### Dark tab/feed/community/background sweep — 20 November 2026

On iOS/Android phones/tablets, inspect plain dark page/sheet/form backgrounds for `#091B21`; check auth/profile, collection/edit and add/remove sheets, subscription retry UI, notifications, create-post/post-details and community rules. Keep supplied image backgrounds visible and verify accent-panel and focused-search contrast. Open all five bottom actions: dark selected line and label, 48-point Identify scan circle, safe-area spacing, repeated-tab reset and chooser navigation; compare Light tab sizing/artwork against the prior build.

Ask AI should show the night-sky illustration without the old dimming, readable prompt cards, and working composer/upload/send. Feed should retain its header art, dark cards and teal tabs/Create action. Open Community Rules, scroll through real configured content, dismiss via close, then agree via Okay and confirm existing feed behavior. Check details Add to Collection destination. Native visual/navigation acceptance remains open; token/source checks do not establish runtime completion.


### Post details and Settings sheet gallery acceptance — 20 November 2026

Open Settings → Previews → Bottom sheets in Light and Dark, then open every row. Check sample collection rows and selection, create/rename/remove forms, notification/location prompts, rating/feedback/report, community rules scrolling, all nine upgrade types, both offers, both password/location modes, plan selector/switch, promotion variants and post/comment menus. Actions must only close or update local preview state: verify no collection/account mutation, permission prompt/settings launch, password change, purchase or report submission. Plan/pricing reads may still occur. Ensure each sheet can close and reopen; check keyboard dismissal and back navigation.

Open a real post in Dark and verify 52-point header, 8-point author/content gaps, 116-point comment field, 32-point Send pill with a disabled grey state, 16-point bottom action icons and inset replies. Send comments/replies, toggle likes, expand/collapse replies and test More → Reply / Copy text for both comment and reply. Confirm selected text is copied correctly and subscription/navigation behavior is unchanged. Compare Light against the previous build. Native render and end-to-end acceptance remain open.


### Inactive Home banner and name-sound checks — 20 November 2026

For a non-premium account in Dark, inspect Home during an active positive discount countdown, inactive cooldown, zero countdown and disabled timer state. Confirm the full-price banner shows Upgrade to Pro, supplied crowned bird and teal Subscribe now in the latter states, without 50% discount copy. Check localized annual pricing, missing-price behavior, banner dismissal and `discount50: false` plan navigation. Verify premium users remain excluded and Light retains its prior banner.

Open dark identification results/Bird Details with a playable sound and with a long common/scientific name: volume control remains 48×48 at the row's right edge with 20-point page inset, dark fill/grey border and visible white glyph. Test play/stop/end and no-sound eligibility, then compare Light. Native store-price/layout/audio acceptance remains open.


### First sound-identification screen — 20 November 2026

Open Identify by Sound from Home and the Identify chooser in Dark. Check the night-sky background at the top, 219×168 bird/wave illustration, title/subtitle without the extra tagline, readable bordered location row, grey/white off toggle and bottom 48-point teal microphone circle in its 72-point target. Check short phones, tablets, safe areas and rotation for copy/record overlap. Enable location and edit an existing location through the current flow. Tap record and verify permission denial/grant/settings recovery, live recording, pause/stop/minimum length, crop and identification behavior. Compare Light entry against the prior build. Source geometry and timer tests do not establish physical microphone or device-render acceptance.


### Dark sound crop UI — 20 November 2026

Record a clip longer than 27 seconds and inspect both the in-place crop phase and standalone SoundCrop route in Dark: whole recording initially selected, all available duration chips, 100-point spectrogram, red frame/grips, teal endpoint labels, real timestamp/location and sticky Identify CTA. Select 9/18/27 seconds; drag the fixed window to both ends and confirm bounds/labels. Tap the selected chip to restore full. Tap the spectrogram to preview/pause; verify taps do not move selection and drags do not accidentally trigger playback. Check screen-reader play/pause action, analyzing/disabled states and long/short clips with fewer available chips.

Verify Identify sends either the full recording or the selected start/duration through the existing flow, and still handles no-bird/noise/limit states. Confirm real PCM spectrogram content, safe areas and short/tablet layouts. Compare Light default selection, center play control and crop behavior with the previous build. Automated crop/finalization/timer tests do not establish physical-device gesture/audio acceptance.


### Dark crop location-card follow-up — 20 November 2026

Inspect the sound crop screen in Dark with location off and with a long location: the full-width card is light grey with dark 14/20 text, a thin border and 8-point corners; a known place is blue/underlined inside angle brackets and can wrap without clipping. Tap to edit the known place and test the off toggle's permission flow. Check analyzing-disabled behavior and unchanged Light rendering. Device acceptance remains open.

## 2026-11-27 — Explore optimization acceptance

- [ ] Confirm strict Bird list HTTP body `{ location }`, existing endpoint/tab query and map-only trait filters. No bbox/radius/Mushroom/Plant fields should leak into the list body.
- [ ] Fail page two, retry and verify page two is resent with page one retained. A duplicate-only/non-advancing page must stop reads while preserving backend totals.
- [ ] Revalidate page one after TTL while an older page two would still be fresh: never mix snapshots. Check fresh tab/back re-entry reuse, original cache ages, forced Refresh and account isolation.
- [ ] Apply map filters during a tab debounce; the delayed tab must not restore old map filters. Change location in filtered Results; the first new read must be page one and must not merge previous-location cards.
- [ ] Tap stars in duplicate/recycled cards, rotate access tokens and log out during pending work. One mutation per account/species, shared rollback, successful token-refresh reconciliation and no old-session publication are required.
- [ ] Verify compact/expanded search draft preservation, no hidden input reads, no late label overwrite, permission/settings recovery, native unavailable fallback and minimize controls in both themes.
- [ ] Test dense selection for correct BirdLife membership/source stability and visible photos on slow networks. Capture release-device HTTP timings, first visible map/cards/photo, frame times and peak memory on iOS/Android.

Owner unassigned. Source/mocked regressions are separate from device/backend acceptance; see [the audit](../audits/explore-optimization-2026-11-27.md) and CHANGELOG for actual executed checks.

## 2026-11-27 — Camera review and Ask AI full-check follow-up

The camera layout unit fixtures provide ThemeContext with actual light/dark tokens; the banner/slot stacking and gesture-inset CTA checks now execute in both modes. Ask AI photo fallback tests exercise the actual normalized Bird identification result, nested summary, scientific-only label and no-match response. Camera runtime layout, AI routing and request contracts were not changed.

Executed: full Jest **106 suites / 909 tests passed**, standard `tsc --noEmit --pretty false` passed, and the new helper/camera/formatter regression files linted with zero errors or warnings using the installed React Native ESLint config. Native/device acceptance is separate: at inspection ADB listed no Android devices and no iOS simulator was booted. Reconnect/select a target before physical UI/performance checks; owner unassigned.
