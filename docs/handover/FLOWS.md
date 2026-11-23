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

**Camera permission screens (Figma 8558:25287):** Android shows the native camera dialog at most twice (deny → in-app "Allow access"; second deny → "Go to settings" from then on); iOS shows it once, then "Go to settings". Both in-app screens use the Figma chrome from `CameraPermissionGateChrome`: back + flash on top, gallery (works), greyed-out shutter and flip camera at the bottom. Only back and gallery respond to taps.

Scanning Tips (Figma dev note 8830:1773):
- Shown once per install (`HAS_SEEN_CAMERA_TIPS`), either when Camera is granted or when Camera is denied (an in-app permission screen is showing) while Gallery permission is granted. On Android 13+ `checkStoragePermission` always reports Gallery as granted.
- Closing Tips with **X** while Camera is denied opens the Gallery picker. Backdrop, “Understood” and X with Camera granted only close.

**Recovery to demonstrate:** first denial, repeated denial/settings return, cancel/back during upload, background/foreground, slow/offline server, no match, duplicate submit and free allowance exhaustion.

Evidence: [src/features/camera/CameraScreen.tsx](../../src/features/camera/CameraScreen.tsx); [src/services/api/features/core.api.ts](../../src/services/api/features/core.api.ts); [src/features/collection/screens/BirdDetailsScreen.tsx](../../src/features/collection/screens/BirdDetailsScreen.tsx).

## Catalogue → detail → save/edit → collection

Browse/search/filter, open the selected birds record, then add to wishlist or a collection. Reopen the saved specimen to edit or remove it. Backend acknowledgement should determine the final durable state; a failed mutation must not leave a permanently optimistic counter or star.

Catalogue card star (`CatalogueScreen`):
- Tapping an empty star fills it immediately.
- Once the backend confirms the add, the app shows the “added” toast and opens Collection → Wishlist. The navigation uses `initial: false`, so Back returns to the Collection list. The Wishlist refetches on focus.
- If the add fails, the star reverts, an error toast appears, and the app stays on Catalogue.
- Tapping a filled star asks for confirmation before removing it, and stays on Catalogue.

From identification, Add to Collection uploads the user photo to `posts/images` and sends that public Storage URL first on `POST /core/specimen/add`, including Identified and Wishlist. Specimen update does not accept image fields. If a specimen already exists, the client creates a new row with the photo and deletes the previous row. Collection display uses the inner photo when fetchAll glues a catalogue folder onto the stored URL. Device confirmation of this save is still open.

Check page indexing for the specific endpoint, overlapping pages, filter changes, back navigation, duplicates and private-versus-public IDs. Verify saved media and comments survive a reload. See [API and data](API_AND_DATA.md) for source locations.

## Purchase and restore

Read the selected store offer, start the native purchase, and distinguish cancellation/pending/failure from success. Confirm the transaction using the existing backend pipeline, then reconcile entitlement and finish the transaction at the appropriate point. Restore and restart recovery should converge on the same account entitlement.

**Recovery to demonstrate:** repeated taps, store success/backend failure, app killed during confirmation, restore after reinstall, guest/account transition and already-owned products. Do not manually grant premium to make a test appear to pass.

Evidence: [src/features/subscription](../../src/features/subscription).

## Feed, notifications and deep links

Where the registered build exposes the feed, open/create/edit relevant content, verify upload and read-back, then test inbox/push navigation. For deep links, demonstrate terminated, backgrounded and foreground app states, with and without a session. Permission and deferred-auth routing must be part of the walkthrough.

Existing navigation/deep-link references are listed in [the feature catalogue](FEATURE_CATALOGUE.md). Confirm backend/Firebase ownership and moderation behavior during the handover rather than assuming another app's configuration applies.

## Sound identification and audio library

From Home, tap Identify by sound. The microphone permission popup stays on the current screen. Allow requests microphone access and, once granted, opens Sound Identify. Not Now or close stays on the current screen. If microphone access is already granted, the popup is skipped and Sound Identify opens. Record or select audio, choose a crop, and submit. Open a matched bird or the no-match recovery screen; the audio library separates identified and unknown files.

**Acceptance/recovery:** Test microphone denial, zero-length audio, interrupted recording, playback cleanup, no match, and saving the user recording.

Evidence: [src/features/camera/screens/SoundIdentifyScreen.tsx](../../src/features/camera/screens/SoundIdentifyScreen.tsx); [src/features/discovery/screens/AudioGalleryScreen.tsx](../../src/features/discovery/screens/AudioGalleryScreen.tsx).

## Step-by-step identification

Choose observation location, date, and bird size; submit the answers and review nearby species. The current implementation forwards actual answers and uses page 1 for this endpoint.

Location question (Figma 9380:170051): the user types directly in the Custom Location field. Once 3 characters are typed, a dropdown opens under the field. It shows “Searching…” while the request runs (300 ms debounce), then the address suggestions, or “No matching places” if the search returns none or fails. Suggestions use Explore's `src/features/explore/utils/geocodingApi.ts`: geocode.maps.co when `GEOCODING_API_KEY` is set, otherwise Mapbox Geocoding v6 with `MAPBOX_ACCESS_TOKEN`. The shared `src/utils/geocodingApi.ts` returns nothing without the geocode.maps.co key. While the keyboard is open, Continue floats 16px above it (Figma dev note 9380:170789). Tapping one, or pressing search on the keyboard (which uses the first suggestion, or else a geocode of the typed text), sets the answer and adds it to Recently Used. As in the bottom sheet this replaces, a failed geocode keeps the typed text with 0,0 coordinates. Current location and Recently Used work as before.

**Acceptance/recovery:** Change each answer and confirm the outgoing request changes. Missing location must not silently become an invented location.

Evidence: [src/features/discovery/screens/StepByStepScreen.tsx](../../src/features/discovery/screens/StepByStepScreen.tsx); [src/features/discovery/utils/runStepByStepAnalysis.ts](../../src/features/discovery/utils/runStepByStepAnalysis.ts).

## Settings appearance

Open Settings → Preferences → Appearance. Choose Light theme, Dark theme, or Use System theme. The selected theme is stored on the device and applied across the app. It remains after logout. System uses the current device appearance and updates when the device appearance changes.

**Acceptance/recovery:** Confirm the Appearance row is visible, each option updates the open screen and the next screen, a saved choice survives a restart, and System follows a device appearance change. iOS needs a native rebuild before `UIUserInterfaceStyle` Automatic is on the installed binary.

Evidence: [src/features/settings/screens/SettingsScreen.tsx](../../src/features/settings/screens/SettingsScreen.tsx); [src/features/settings/screens/AppearanceScreen.tsx](../../src/features/settings/screens/AppearanceScreen.tsx); [src/app/ThemeProvider.tsx](../../src/app/ThemeProvider.tsx).

## Explore Near You

Open Explore from the Home banner (whole panel tappable), the Spotted Now / Year-round rows, or Catalogue's "Explore Near You" button and map banner. Under the **Explore Near You** heading the banner shows: "Discover bird sightings, hotspots, and species around your area." Home and Catalogue share [useExploreEntry](../../src/features/explore/useExploreEntry.tsx): location access is requested first ("Enable Location Access" on Android, existing iOS App Review wording), then the map opens. The Home / Catalogue banner reads "Enable Location" while access is off and "Explore Map" when it is on; the Catalogue banner is hidden while catalogue filters are applied. On the map, switch Spotted Now / Year-round (equal halves of the tab row), select a group, and open bird details. Map filters affect map activity; seasonal tabs affect the nearby list.

Explore screen layout (Figma 9376:267165):
- The location search and filter sit in a row above the map: 48 high, 20 side margins. Suggestions overlay the map.
- The map is a 2:1 card with radius 12 and a Border-0 outline. Controls are 32px chips: +/− at the top left, locate/expand at the bottom right. The expanded full-screen map keeps its own overlaid search bar.
- Below the map: a centred legend with a dot separator, then the “Current Location:” card (value right-aligned).
- Cards show the common name as the title and the scientific name underneath. The previous radius note under the location card was removed to match Figma.
- The search-bar target icon re-reads the device location, even after a searched place was chosen.
  - The label first shows “Current Location”, then is replaced by the detected city (“City, Region”, e.g. “Bengaluru, Karnataka”), on the right of the “Current Location:” card and in the search bar.
  - The city comes from `reverseGeocodeAddress`: geocode.maps.co when `GEOCODING_API_KEY` is set, otherwise Mapbox Geocoding v6 reverse.
  - If the lookup fails, the label stays “Current Location”.

**Acceptance/recovery:** Check map token, denied location from Home and Catalogue, Android first-ask copy, custom location sheet, manual search, delayed requests, map-only retry, clusters, full-screen return, pagination, empty/filtered empty states, and dark mode.

Evidence: [src/features/explore/screens/ExploreMapScreen.tsx](../../src/features/explore/screens/ExploreMapScreen.tsx); [src/features/explore/useExploreEntry.tsx](../../src/features/explore/useExploreEntry.tsx); [src/features/explore/README.md](../../src/features/explore/README.md).

## Walkthrough record to complete with the incoming owner

For each flow, record the build/environment, test account role, starting state, successful steps, recovery demonstrated, screenshot/video or test evidence, open defect and the person who can answer follow-ups. Keep tokens, receipts, personal media and account passwords out of the walkthrough notes.

## Explore location search recovery — 2026-11-04

Explore previously refused to search when `GEOCODING_API_KEY` was blank, even with a working `MAPBOX_ACCESS_TOKEN`. Forward suggestions now prefer the configured geocode.maps.co provider when its base URL and key are present; otherwise they use Mapbox Geocoding v6 with the existing public token. This follows Plantzy's configured-provider/fallback approach while retaining Explore's cancellation and debounce. No active environment values, variable names or loading rules changed; existing blank templates already include both keys.

Mapbox requests start after three characters and 300 ms without edits, with provider pacing and a 12-second timeout. Temporary Mapbox suggestions are not cached or persisted. Provider failures remain visible; an invalid configured primary key does not silently switch providers. Reverse lookup still requires the original geocoding provider. Search uses HTTP and works independently of the native Mapbox module; the interactive map still requires a native rebuild.

Selection now protects the chosen label from delayed blur callbacks. Validate on iOS and Android: type a city, choose a result with the keyboard open, confirm nearby results and map center update, clear/retype, and repeat in the expanded map. Live token check returned HTTP 200 with five Chennai features; device interaction remains unverified.

## Audit corrections — 2026-11-04

Feed notifications now belong to a stored account owner. Switching accounts or signing out clears the prior account's notification/read state; late subscription callbacks and refresh responses are ignored. Opening the notification list refreshes through the existing Firestore feed service instead of a placeholder. Same-account refresh preserves read IDs. The first post-upgrade ownership assignment clears unscoped legacy notification cache.

The legacy Discount Code route now offers “View Plans” and opens SubscriptionMain. It explicitly says a supplied code has not been applied; the store controls actual eligibility and final price. There is no implemented arbitrary coupon redemption contract.

Specimen PATCH transport preserves explicit empty editable arrays (including collections, habitat and captured sounds); omitted values remain unchanged and immutable image fields remain excluded. A caller must intentionally supply an empty list to clear it.


## Settings bottom-sheet previews — 20 November 2026

Settings → Previews → Bottom sheets opens a gallery in the current Light/Dark appearance. It lists every registered AppSheet type, all nine limit/upgrade categories, 50%/70% offers, custom/post/comment action sheets, password create/change, location add/change, removal, plan selection/switching and promotional sheet variants. Select a row to open the real component; close/backdrop/drag follow that sheet's normal dismissal rules. Community Rules can be dismissed with its close control even though backdrop dismissal is disabled.

Preview-only collection pickers use local sample collections. Create/rename/remove, native permission requests and manual geocoding are intercepted in the Settings preview context; callbacks for purchases, passwords, ratings, feedback, reports and other sample actions only close the preview. Plan information may still come from existing read-only pricing hooks. Preview form inputs are interactive but do not submit user changes. The preview context defaults off and is scoped to the gallery.

Post details retains real post/comment/reply data. In dark appearance it follows Figma 9406:7143 spacing, 116-point comment field, compact Send state and bottom action row. Comment/reply More opens Reply / Copy text actions; Reply uses the existing inline composer, Copy text copies only that selected comment/reply. No comment deletion/reporting API is added.


## Home offer fallback and identification name sound — 20 November 2026

For non-premium users who have not dismissed the inline Home offer, Dark shows the active discount banner only while the offer is active and its displayed countdown is positive. In an inactive/disabled discount phase or at zero countdown, show the full-price Upgrade to Pro banner (Figma 9375:212476). Subscribe now opens SubscriptionMain with the plan modal and `discount50: false`; the close control retains existing dismissal behavior. The existing Light banner selection/artwork is preserved.

In dark identification/Bird Details, available name sound playback remains in the 48-point control at the right edge of the full-width name row, 20 points from the page edge (Figma 9375:213219). It uses dark fill, border-0 and a white volume glyph. Existing sound availability, play/stop handler and accessibility labels are retained; no sound button is fabricated when no sound URL exists.
