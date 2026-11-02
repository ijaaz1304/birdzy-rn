# Birdzy — end-to-end flows

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

Read each flow as **trigger → visible steps → result → recovery**. Use the linked files to locate the real implementation; verify current route/flag availability on the build being handed over.

## Startup, onboarding and account

1. Cold start initializes providers, persisted state, app configuration and session/bootstrap work.
2. The entry navigator selects onboarding, an auth route, post-onboarding or the main app according to saved state.
3. Login, sign-up/social sign-in or the configured guest path establishes the current identity.
4. Resume a deferred route only after its authentication requirements are resolved.
5. Logout/account changes must clear account-specific state, pending navigation and cached private data.

**Recovery to demonstrate:** expired session, slow auth hydration, offline launch, cancelled sign-in, password reset link, guest promotion, logout and a second account.

Evidence: [App.tsx](../../App.tsx); [src/features/auth/auth.store.ts](../../src/features/auth/auth.store.ts); [src/navigation/RootNavigator.tsx](../../src/navigation/RootNavigator.tsx).

## Photo identification

1. Enter identification from its registered Home/tab route.
2. Resolve camera or photo permission for the chosen source, keeping their recovery paths separate.
3. Capture/select, crop or review as the current screen requires; retain the exact media intended for upload.
4. Prepare the upload and submit through the app API layer with the current account.
5. Render candidate matches, an empty/no-match state, a usage-limit state, or a recoverable request error.
6. Open details, then save or organize the selected result without confusing archetype and specimen IDs.

**Recovery to demonstrate:** first denial, repeated denial/settings return, cancel/back during upload, background/foreground, slow/offline server, no match, duplicate submit and free allowance exhaustion.

Evidence: [src/features/camera/CameraScreen.tsx](../../src/features/camera/CameraScreen.tsx); [src/services/api/features/core.api.ts](../../src/services/api/features/core.api.ts); [src/features/collection/screens/BirdDetailsScreen.tsx](../../src/features/collection/screens/BirdDetailsScreen.tsx).

## Catalogue → detail → save/edit → collection

Browse/search/filter, open the selected birds record, then add to wishlist or a collection. Reopen the saved specimen to edit or remove it. Backend acknowledgement should determine the final durable state; a failed mutation must not leave a permanently optimistic counter or star.

Check page indexing for the specific endpoint, overlapping pages, filter changes, back navigation, duplicates and private-versus-public IDs. Verify saved media and comments survive a reload. See [API and data](API_AND_DATA.md) for source locations.

## Purchase and restore

Read the selected store offer, start the native purchase, and distinguish cancellation/pending/failure from success. Confirm the transaction using the existing backend pipeline, then reconcile entitlement and finish the transaction at the appropriate point. Restore and restart recovery should converge on the same account entitlement.

**Recovery to demonstrate:** repeated taps, store success/backend failure, app killed during confirmation, restore after reinstall, guest/account transition and already-owned products. Do not manually grant premium to make a test appear to pass.

Evidence: [src/features/subscription](../../src/features/subscription).

## Feed, notifications and deep links

Where the registered build exposes the feed, open/create/edit relevant content, verify upload and read-back, then test inbox/push navigation. For deep links, demonstrate terminated, backgrounded and foreground app states, with and without a session. Permission and deferred-auth routing must be part of the walkthrough.

Existing navigation/deep-link references are listed in [the feature catalogue](FEATURE_CATALOGUE.md). Confirm backend/Firebase ownership and moderation behavior during the handover rather than assuming another app's configuration applies.

## Sound identification and audio library

Start sound identification, allow microphone access, record or select audio, choose a crop, and submit. Open a matched bird or the no-match recovery screen; the audio library separates identified and unknown files.

**Acceptance/recovery:** Test microphone denial, zero-length audio, interrupted recording, playback cleanup, no match, and saving the user recording.

Evidence: [src/features/camera/screens/SoundIdentifyScreen.tsx](../../src/features/camera/screens/SoundIdentifyScreen.tsx); [src/features/discovery/screens/AudioGalleryScreen.tsx](../../src/features/discovery/screens/AudioGalleryScreen.tsx).

## Step-by-step identification

Choose observation location, date, and bird size; submit the answers and review nearby species. The current implementation forwards actual answers and uses page 1 for this endpoint.

**Acceptance/recovery:** Change each answer and confirm the outgoing request changes. Missing location must not silently become an invented location.

Evidence: [src/features/discovery/screens/StepByStepScreen.tsx](../../src/features/discovery/screens/StepByStepScreen.tsx); [src/features/discovery/utils/runStepByStepAnalysis.ts](../../src/features/discovery/utils/runStepByStepAnalysis.ts).

## Explore Near You

Open Explore from Home, search for a place or use location access, inspect activity on the map, switch Spotted Now / Year-round, select a group, and open bird details. Map filters affect map activity; seasonal tabs affect the nearby list.

**Acceptance/recovery:** Check map token, denied location, manual search, delayed requests, map-only retry, clusters, full-screen return, pagination, and dark mode.

Evidence: `src/features/explore/screens/ExploreMapScreen.tsx` (local source, not included in this docs-only publication); `src/features/explore/README.md` (local source, not included in this docs-only publication).

## Walkthrough record to complete with the incoming owner

For each flow, record the build/environment, test account role, starting state, successful steps, recovery demonstrated, screenshot/video or test evidence, open defect and the person who can answer follow-ups. Keep tokens, receipts, personal media and account passwords out of the walkthrough notes.
