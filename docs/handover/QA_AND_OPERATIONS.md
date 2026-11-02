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

Source: `src/features/explore/screens/ExploreMapScreen.tsx` (local source, not included in this docs-only publication); `src/features/explore/README.md` (local source, not included in this docs-only publication).

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
