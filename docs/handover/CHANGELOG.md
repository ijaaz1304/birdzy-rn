# Birdzy — handover change history

## 2026-11-25 — Step-by-step uses caller answers (no static test body)

- Confirmed `archetypeService.stepByStep` forwards the caller body (wizard location/date/size, or Near You discovery coords). The temporary Malaysia test override (`lat` 3.7 / `lng` 101.7, fixed date and sizes) is not present on this branch.
- Renamed the unused-looking `_body` parameter to `body` and noted that no fixed test location may be substituted.
- Affected: `src/services/archetype/archetype.service.ts`. FLOWS already describe forwarding real answers.
- Validation: `__tests__/api/coreServices.test.ts` (step-by-step forward case). Device retest open — reload the JS bundle if an older build still posts the Malaysia body.

## 2026-11-23 — Explore target icon detects the current city

- Before:
  - `useExploreLocation.attempt()` returned early whenever a location had been set. The first automatic fix sets one, so the search-bar target icon (`retryLocation`) did nothing after load.
  - The device label was hard-coded to “Current Location”.
- `attempt(force)`: `retryLocation` (target icon and retry button) now forces a fresh device read. Automatic and app-foreground attempts keep the old behaviour.
- After the fix, `reverseGeocodeAddress` replaces “Current Location” with “City, Region”. The label is shown on the right of the “Current Location:” card and in the search bar. The update is skipped if the user picked another place meanwhile, and the placeholder is kept on failure.
- `reverseGeocodeAddress` (Explore) now falls back to the new `reverseMapboxCity` (Mapbox Geocoding v6 `/reverse`, types place/locality/district/region, limit 1) when geocode.maps.co is not configured. This mirrors the forward-search fallback. `GEOCODING_API_KEY` is empty in all `.env*` files; `MAPBOX_ACCESS_TOKEN` is set.
- Affected: `useExploreLocation.ts`, `src/features/explore/utils/geocodingApi.ts`, `FLOWS.md`. No env names or values changed.
- Validation: TypeScript is clean for `src/features/explore`. ESLint shows 0 errors (6 existing warnings). Explore tests pass (56/56). Not run on device. The live Mapbox reverse response was not exercised.

## 2026-11-23 — Explore “Selected Area” is teal in dark mode

- The device check showed the legend already matched the Figma values (`#785284` ring, 20% purple fill), but on the dark page it read as black. Design asked for teal `rgba(22, 182, 180, 1)` in dark mode.
- Dark mode now uses a `#16B6B4` ring with a 20% `#16B6B4` fill (`rgba(22,182,180,0.2)`) for:
  - the legend swatch (`selectedSwatchDark`);
  - the map's selected-area circle (`SELECTED_CIRCLE_DARK`).
  - New `EXPLORE_COLORS.selectedStrokeDark`, `selectedFillDark` and `selectedBackgroundDark` keep the two in sync.
- Light mode stays purple (`#785284` ring, 20% `#725481` fill).
- Affected: `explore.colors.ts`, `ExploreMapScreen.tsx`, `ExploreMapView.nativeMap.tsx`. No API change.
- Validation: TypeScript is clean for `src/features/explore`. ESLint shows 0 errors (6 existing warnings). Explore tests pass (56/56). Not re-run on device.

## 2026-11-23 — Explore Near You: header, spacing, search target icon, legend colours

- Follow-up after a second on-device screenshot.
- Header (Figma Top Navigation Bar): 52 high, px12, back in a p8 wrapper. The title is Satoshi Bold 18/24, left-aligned from x=60 (was a larger centred title).
- Spacing:
  - The tab bar no longer adds 8px on top (16 after the location card, as Figma).
  - Tabs are fixed at 32 high (were 40).
  - The card grid starts 16 below the tabs (was 24), with px20 (was 16).
- Map: the Mapbox scale bar is hidden (`scaleBarEnabled={false}`). It sat under the +/− chips and is not in Figma. The Mapbox logo and attribution remain, as Mapbox terms require.
- Search bar: the right-hand icon is the Figma `target-03`, 24px, `#5D5D5D` light / `#D1D1D1` dark, via new `ExploreSearchTargetIcon(Dark)` copies. Tapping it calls `retryLocation()` to go back to the device location (`onUseCurrentLocation` prop on both the collapsed and expanded bars). The × clear button now shows only while typing.
- Colours (`explore.colors.ts`):
  - `selectedStroke` `#402122` → `#785284`. The legend's “Selected Area” swatch was nearly invisible in dark; it now matches Figma.
  - `activeTab` (light) `#402122` → `#785284`, per Figma. Dark still uses `textBrand`.
- Affected: `ExploreMapScreen.tsx`, `ExploreTabBar.tsx`, `ExploreResultList.tsx`, `ExploreMapView.nativeMap.tsx`, `ExploreLocationSearchBar.tsx`, `explore.colors.ts`, `explore/assets/index.ts`, and the new `icons/target-search(-dark).svg`.
- Validation: TypeScript is clean for `src/features/explore`. ESLint shows 0 errors (6 existing warnings). Explore tests pass (56/56). Not re-run on device.

## 2026-11-23 — Explore Near You layout matches Figma 9376:267165

- Compared against an on-device screenshot (Android, dark). The Figma frame lists light-token fallbacks over a dark page, so the dark colours follow the existing dark tokens.
- `ExploreMapScreen`:
  - The search bar and filter moved **out of the map overlay** into their own row (px20, pt8, gap 8, raised `zIndex`). The filter is a 48px circle with a 24px icon.
  - The map is a card: 20 side margins, 8 top, `aspectRatio: 2` (was a full-width 280px block), radius 12, 1px Border-0, clipped.
  - Legend: centred, gap 8, 6px dot separator, Body/14 Regular `textPrimary`.
  - “Current Location:” card: radius 12 (was a pill), p12, gap 12. The label is `textSecondary` and the value is `textPrimary` Regular, right-aligned (was semibold, left).
  - 16px before the tabs; tab margin 20 (was 16).
  - The `EXPLORE_SCOPE_DESCRIPTION` note (“Map filters affect activity within 100 km…”) is no longer rendered. The string still exists.
- `ExploreMapView.nativeMap`:
  - Controls are 32px chips (were 40), with +/− at 7/7 top-left and locate/expand at 7/7 bottom-right (were top 64 / 8).
  - The expanded map keeps +/− at top 64 below its overlaid search bar.
- `ExploreLocationSearchBar`:
  - 48 high (was 44), gap 12, 24px pin icon, Satoshi Regular 16 with −0.16 spacing.
  - Border-0 instead of the purple `EXPLORE_COLORS.searchBorder`. Dark fill is `#091421`.
  - The suggestions dropdown is now absolutely positioned 56 below the bar, so it overlays the map instead of pushing the layout down.
- Result cards and the expanded “Birds in This Area” cards: the common name is the title, the scientific name the subtitle, falling back to the scientific name as title.
- Not done:
  - The Figma sound button on Explore cards. Explore results carry no sound URLs.
  - White card and star surfaces from the light-token frame; cards stay on the dark card style.
- Affected: `ExploreMapScreen.tsx`, `ExploreMapView.nativeMap.tsx`, `ExploreLocationSearchBar.tsx`, `ExploreResultList.tsx`, `FLOWS.md`. No API change.
- Validation: TypeScript is clean for `src/features/explore`. ESLint shows 0 errors. Explore tests pass (56/56). Not re-run on device after the change.

## 2026-11-23 — Feed limit sheet: “Go pro” rendered at title size

- “Go pro” in the feed limit title rendered at body size. The atom `Text` re-applies its default body typography and line height to nested spans, overriding the parent's 28/36. The nested span now repeats `feedLimitTitle` (Satoshi Bold 28/36) along with the `textBrand` colour.
- Affected: `AppSheet.tsx`. Validation: TypeScript is clean for the file; ESLint shows 0 errors. Not run on device.

## 2026-11-23 — Feed daily post-limit sheet matches Figma 9406:7158

- `AppSheet` `limitReached` with `limitType: "feed"` (Create Post at the daily limit) now renders a dedicated `FeedLimitContent` (Figma 9406:7173):
  - Title “Get unlimited posts daily- **Go pro** now”: Satoshi Bold 28/36, centred, max 315 wide. Only “Go pro” is in `textBrand` (Text & icon-Brand 1: `#725481` light / `#009DA7` dark). Before, it used the orange `MUSHROOM_COLORS.ACCENT_ORANGE` mushroom-app accent on “Go pro+ now”.
  - Description “As a free user, you're allowed to create one post daily. Go Pro for more posting options!”: Satoshi Regular 14/20, `textSecondary`, 4px under the title.
  - CTA 24px below: 44 tall, 16/10 padding, radius 24, Satoshi Medium 16/24, `primaryCTA` fill. Before: min 50, 16px vertical padding, bold. The label still comes from the selected plan (`getSubscriptionCtaLabel`, e.g. “Get 7 Days Free Trial”).
  - Side padding is 12 (Figma 351 content width).
- The feed copy is defined in `AppSheet` (`FEED_LIMIT_COPY`), because `SUBSCRIPTION_CAROUSEL_ITEMS` id 7 is also used by onboarding and upgrade surfaces. Those keep their existing text.
- Unchanged: the supplied full-bleed background/illustration art (`unlimited posts.png` dark, `feed_popup_bg.png` light), the shared 28px close chip (Figma: 24px Surface-Secondary/Border-0), and all other limit types.
- Affected: `AppSheet.tsx`. No API change.
- Validation: TypeScript is clean for the file. ESLint shows 0 errors (42 existing warnings). Sheet/limit/subscription tests pass (52/52). Not run on device.

## 2026-11-23 — Feed “Delete post” popup matches Figma 9406:7136

- `AppModal` type `deletePost` (Feed and Post Details), following Figma 9406:7139/7140/7141:
  - Icon: 64px trash with an 8px gap to the title. Dark uses the teal Figma `DeleteAccountTrashDark` vector (was the purple `trash_dark.png` at 48px in a 72px box); light uses `trash_light` at 64px.
  - Title: Satoshi Bold 20/28, centred, `textPrimary`.
  - Buttons: 32px below the title, 12px apart.
    - Primary label “Yes, Remove” → **“Delete”**. 16/12 padding (48px tall).
    - “No, Thanks”: 16/10 padding (44px), Border-0.
    - Both are radius 24, Satoshi Medium 16/24 (was semibold label style, radius 30, both 48px).
  - Popup frame: 20px content padding. The close control is a 24px chip 16 from the top/right: dark `#091421` / `#333` with a `#D1D1D1` X, light `#F6F6F6` / `#E7E7E7` with a `#5D5D5D` X.
- The Figma frame uses light-mode tokens over a dark screen (purple icon and button, white “No, Thanks”, invisible title). The dark colours follow the already-approved dark delete/remove popups. The CTA keeps the shared dark teal primary, now without glow.
- `deleteCollection` is unchanged; it shares only the old styles.
- Affected: `AppModal.tsx`. No API change.
- Validation: TypeScript is clean for the file. ESLint shows 0 errors. Modal/feed tests pass (17/17). Not run on device.

## 2026-11-23 — Scanning Tips: Gallery-granted trigger and X → Gallery

- Implements the two missing parts of Figma dev note 8830:1773.
- (a) `CameraScreen` opens Scanning Tips immediately when Camera is denied and Gallery permission is granted (`checkStoragePermission`).
  - “Camera denied” means an Allow Access or Go to Settings inline screen is showing and no native dialog is open.
  - It uses the same once-per-install `HAS_SEEN_CAMERA_TIPS` flag as the Camera-granted trigger, so Tips are shown once in total.
- (b) `CameraTipsModal` gets an optional `onCloseButtonPress` for the X button only (defaults to `onClose`). `CameraScreen` uses it to close Tips and call `openGallery()` when Camera is not granted. Backdrop and “Understood” only close.
- Note: on Android 13+ `checkStoragePermission` always reports granted, so (a) applies to every Camera denial there.
- Affected: `CameraScreen.tsx`, `CameraTipsModal.tsx`, `FLOWS.md`. No API change.
- Validation: TypeScript is clean for the changed files. ESLint shows 0 errors. Birdzy camera tests pass, including the 4 permission-flow tests. The one existing failure, `cameraIdentifyReview.test.tsx`, renders `CameraIdentifyReview` without a `ThemeProvider` and is unrelated to these files. Not run on device.

## 2026-11-23 — Camera permission flow checked against Figma 8558:25287

- New `__tests__/camera/identifyCameraPermission.test.ts` encodes the Figma rules for `identifyCameraPermission.helpers.ts` (4/4 pass):
  - Case 1 (deny → Allow Access → native again → deny → Go to Settings);
  - Case 2 (visit 1 deny → Allow Access; visit 2 native → deny → Go to Settings; visit 3+ Go to Settings);
  - OS-blocked → Go to Settings;
  - iOS: one native dialog, then Go to Settings. That is an OS limitation, so iOS has no Allow Access step.
- Scanning Tips: shown once (`HAS_SEEN_CAMERA_TIPS`), only after camera permission is granted. This matches the dev note.
- Not implemented from the dev note:
  - (a) open Scanning Tips immediately when Gallery permission is granted while Camera is denied;
  - (b) closing Tips with X auto-opens the Gallery sheet. `handleTipsClose` only closes.
- No app code changed. Not run on device.

## 2026-11-23 — Delete Account popup: Figma trash icon in dark mode

- `DeleteAccountConfirmation` (Settings → Delete Account) used the purple/yellow raster `trash_dark.png` in dark mode.
- Dark mode now renders the Figma 9603:38239 “Illustration/ trash” vector at 64×64: a `#16B6B4` bin on a `#072C38` ellipse. It is the same shape as the wishlist icon, but that one uses `#009DA7`.
  - New file `src/assets/dark/figma/delete_account_trash.svg`, exported as `DeleteAccountTrashDark`.
- `SettingsAccountDialog` gets an optional `iconNode` prop. A rendered icon takes precedence over the `icon` image source. Log Out is unaffected.
- Light mode is unchanged (`trash_light.webp`).
- Still on `trash_dark.png`: `RemoveFromWishlistModal`, `RemoveFromCollectionModal`, `AppModal`.
- Affected: `DeleteAccountConfirmation.tsx`, `SettingsAccountDialog.tsx`, `src/assets/index.ts`, the new SVG. No API change.
- Validation: TypeScript and ESLint are clean for the changed files. `verify-dark-assets.js` passes. Not run on device.

## 2026-11-23 — Remove-from-wishlist popup: Figma trash icon in dark mode

- `RemoveFromWishlistConfirmation` (Bird Details, Catalogue, Search) used the purple/yellow raster `trash_dark.png` at 48px in dark mode.
- Dark mode now renders the Figma 9399:158787 “Illustration/ trash” vector: a `#009DA7` bin on a `#072C38` ellipse, at 64×64, with an 8px gap to the title (was 12).
  - New file `src/assets/dark/figma/remove_wishlist_trash.svg` (Figma export with fixed size), exported as `RemoveWishlistTrashDark`.
- Light mode is unchanged (`trash_light.webp`).
- Not changed: `RemoveFromWishlistModal`, `RemoveFromCollectionModal`, `DeleteAccountConfirmation` and `AppModal` still use `trash_dark.png` in dark mode.
- Affected: `RemoveFromWishlistConfirmation.tsx`, `src/assets/index.ts`, the new SVG. No API change.
- Validation: TypeScript is clean for the changed files. ESLint shows 0 errors (1 existing warning). `verify-dark-assets.js` passes. Not run on device.

## 2026-11-23 — Wishlist add works around the backend “Mixed” enum error

- `archetypeService.addWishlistArchetype` handles a backend `Specimen validation failed … is not a valid enum value for path …` error with a new private `addWishlistViaSpecimen` fallback.
  - It loads the archetype details and builds a specimen with `buildMushroomSpecimenAddFromRaw(…, { isIdentified: false, isWishlisted: true })`.
  - It removes every value the server named as rejected, then `POST /core/specimen/add`. If the server names more values, it strips those and retries, up to 5 rounds.
  - Any other error is rethrown as before, so the toast still shows the real reason.
- New `src/services/archetype/specimenEnumSanitizer.ts`: parses the rejected values (including several per message and nested paths) and strips them from a payload without mutating the original.
  - The payload builder is required lazily inside the fallback, to avoid a load-time import cycle (`collection.utils → archetype.service → editMushroomDetails.utils`).
- App Logs: `[Wishlist] add: enum validation, using specimen fallback`, then `… specimen fallback success` (with attempt and removed values) or `… specimen fallback failed`.
- Trade-off: the saved wishlist specimen omits the rejected value (e.g. Besra's “Mixed” flight pattern). The backend fix in `KNOWN_GAPS.md` is still needed.
- Affected: `archetype.service.ts`, the new `specimenEnumSanitizer.ts`, and the new `__tests__/collection/specimenEnumSanitizer.test.ts`. No endpoint or env change; uses the existing `specimen/add` endpoint.
- Validation:
  - New sanitizer tests pass (5/5). Collection, wishlist lifecycle and core contract suites pass (84/84 together).
  - TypeScript: no errors in changed files (the 2 existing `AskAIScreen.tsx` errors remain). ESLint clean.
  - Not run on device. Starring Besra from the Catalogue needs retesting.

## 2026-11-23 — Wishlist failure root cause found (backend enum mismatch)

- Device logcat shows `PUT /core/archetypes/wishlist/add/6a61f6c65db631270434c4b1` (Besra) returning 500. The reason is `Specimen validation failed: flightPattern.0: 'Mixed' is not a valid enum value`.
- The client is correct: archetype id, endpoint, and an empty body as designed. The earlier `custom_id` suspicion is ruled out.
- Logged as a backend item in `KNOWN_GAPS.md`. No app code changed in this entry.
- Also noted: App Logs only collect after logging is enabled in Settings → App Logs (`isEnabled` defaults to `false`). The Metro / `adb logcat` console mirror is the reliable source on dev builds.

## 2026-11-23 — Wishlist failures show the real reason instead of “Failed to add to wishlist”

- Problem: `mushroomsRepository.toggleFavorite` caught every error and returned `false`, so the store and screens could only show the generic add/remove failure toast. The real reasons from `archetypeService.addWishlistArchetype` were lost. Known reasons:
  - “This is already identified, can't wishlist.” (any specimen for the archetype is identified)
  - “This bird is already in your collection. The server couldn't add it to wishlist.”
  - the server `reason`
  - network or HTTP errors
- Fix:
  - The repository now rethrows (still `console.error` + service App Logs).
  - `useBirdsStore.toggleFavorite` keeps the message in a new `lastFavoriteError` field, cleared at the start of each toggle, and still returns `null`.
  - The Catalogue, Search and Possible Matches failure toasts now show `lastFavoriteError ?? <generic string>`.
- Wishlist failures no longer set the store `error`. That field drives list-load UI (the uncommitted Catalogue empty state shows it as “Can't load birds near you”).
- Catalogue App Logs `[Wishlist] catalogue star result` now records `reason`.
- Not confirmed: why the device add fails. One code-level suspect: catalogue card ids come from `getBirdCardId` (`archetypeId → custom_id → _id → id`). If list items lack `archetypeId`, the wishlist PUT and specimen lookup would get `custom_id`. The new toast/log reason will show which case applies.
- Affected: `mushrooms.repository.ts`, `birds.store.ts`, `CatalogueScreen.tsx`, `SearchScreen.tsx`, `OtherPossibleMatchesScreen.tsx`. No API change.
- Validation: there are no TypeScript errors in changed files (the 2 existing `AskAIScreen.tsx` errors remain). ESLint shows 0 errors. Wishlist tests pass (37/37). Not run on device.

## 2026-11-23 — Catalogue star: fill, toast, then open Wishlist

- Requested flow: tap star → star fills → “added” toast → Collection → Wishlist.
- Implementation:
  - The star still fills optimistically through `toggleFavorite`.
  - On an “added” result, `CatalogueScreen` shows the success toast, then calls `navigation.getParent()?.navigate("Collection", { screen: "Wishlist", initial: false })`. This keeps `CollectionMain` under the Wishlist so Back works.
  - Navigation waits for backend confirmation, so the Wishlist (which refetches on focus) already contains the bird.
  - Failed adds keep the error toast, revert the star, and stay on Catalogue. Removing a star is unchanged (confirmation, stays on Catalogue).
- The earlier `[Wishlist] catalogue star …` App Logs diagnostics remain, to help if the tap still produces nothing on device.
- Affected: `CatalogueScreen.tsx`, `FLOWS.md`. No API change.
- Validation: TypeScript is clean for the file. ESLint shows 0 errors and 13 existing warnings (the new hook-dependency warning was fixed). Not run on device. Whether the earlier “nothing happens on tap” symptom remains is unconfirmed.

## 2026-11-23 — Catalogue star: diagnostics for “no wishlist add, no toast, star not filled” (open)

- Reported: tapping the star on a Catalogue card does not add the bird, shows no toast, and the star stays empty.
- Static review found no fault in the code path:
  - `AppCard` star button: top-right with `zIndex 2`, `stopPropagation`; no overlap with the sound button.
  - `birds.store.toggleFavorite` fills the star optimistically before any network call, then always returns “added”, “removed” or `null`.
  - `CatalogueScreen` shows a success or error toast for each of those results. `ToastProvider` has no filtering.
  - The star images are fine: a red outline and a red fill.
  - `__tests__/lifecycle/wishlistCollectionRefresh.test.ts` and `__tests__/api/coreContract.test.ts` pass (37/37).
- Two causes fit the symptoms:
  - (a) the tap never reaches the star on device;
  - (b) the request hangs. `addWishlistArchetype` first resolves existing and wishlisted specimens before the PUT, with no timeout. This alone would not keep the star empty.
- Added diagnostics in `CatalogueScreen` (Settings → App Logs):
  - `[Wishlist] catalogue star pressed`, with archetype id, name and previous state.
  - `[Wishlist] catalogue star result`, with “added”/“removed”/“failed”, duration in ms, and the store error.
  - These sit alongside the existing `[Wishlist] add: …` service logs. No behaviour change.
- Side effect to note: a failed toggle sets `useBirdsStore.error`. The uncommitted catalogue empty-state change reads that as `listError` (“Can't load birds near you”).
- Affected: `CatalogueScreen.tsx`. No API change.
- Validation: TypeScript is clean for the file. ESLint shows 0 errors. Not run on device. Root cause not yet confirmed.

## 2026-11-23 — Dark primary buttons: glow removed everywhere

- `getDarkPrimaryCtaStyle` (`src/design-system/modalTokens.ts`) no longer adds the `#FFAE00` shadow (26%, 12.5 blur, offset 0/2) or Android `elevation: 6`. It keeps only the `#16B6B4` fill and 24 radius.
- This covers every dark primary button built on it: the shared Button/PrimaryButton/AppButton variants, `getPopupPrimaryCtaStyle` popups, subscription, camera review, post-auth and others (about 20 files). Requested by the design owner after the green haze showed under the “Select a collection” Done button.
- The per-button override added earlier today in `AddToCollectionModal` has been removed, since the shared fix makes it unnecessary. `ONBOARDING_CTA_NO_SHADOW` is still in place and has no effect now.
- Not changed: the separate Bird of the Day `#FFDD24` gold glow in `BirdOfTheDayModal.tsx`. Light mode is unchanged.
- Affected: `modalTokens.ts`, `AddToCollectionModal.tsx`, `DEVELOPMENT.md`. No API change.
- Validation: there are no TypeScript errors in changed files. The only errors under `src/` are 2 existing ones in `AskAIScreen.tsx` (already modified before this session), plus errors in the untracked `mushrooms-reactNative/` folder. ESLint shows 0 errors. Not run on device.

## 2026-11-23 — Select a collection: no glow on the Done button

- In dark mode the Done button in `AddToCollectionModal` had the shared CTA glow from `getPopupPrimaryCtaStyle` → `getDarkPrimaryCtaStyle`: `#FFAE00` shadow at 26% opacity, 12.5 blur, Android `elevation: 6`. On the teal fill it showed as a greenish shadow. Figma 9380:111844 has a flat button.
- That button now overrides the shadow and elevation to 0. The teal fill and 24px radius are kept.
- Not changed: about 20 other files still use the shared dark CTA style and its glow.
- Affected: `AddToCollectionModal.tsx`. No API change.
- Validation: TypeScript is clean for the Birdzy file (the only errors reported are in the untracked `mushrooms-reactNative/` folder). ESLint shows 0 errors and 1 existing warning. Not run on device.

## 2026-11-23 — Bird Sound Library Unknown tab: badge, card highlight, Rename/Delete menu

- Figma 9380:111772. The dark colours were sampled from the render.
- “My Recording” badge: dark is `#072C38` with `#16B6B4` text (was pink/brown). 4px vertical padding (was 2), 12/16 Medium. Light colours are unchanged.
- New Rename / Delete menu (`AudioGalleryCardMenu`, Figma 9380:111794):
  - It opens on **long-press** of an Unknown card. Figma has no visible trigger, so long-press was chosen.
  - Size and position: 120 wide, 4px under the card, right-aligned. It flips above the card near the screen bottom.
  - Style: radius 8, gap 4, rows with 12/8 padding, 20px icon, 14/20 label.
  - Dark: `#091421` fill with a `#333` border and a white 7% shadow. Rename is `#D1D1D1`, Delete is `#EF4444`.
  - It is drawn in a transparent Modal so it overlays the following rows. Tapping outside closes it.
  - Rename runs the existing edit flow. Delete opens the existing delete confirmation.
- While its menu is open, the card has a `#01474F` border in dark (theme CTA in light).
- The existing swipe Edit/Delete actions are kept.
- Affected: `AudioGalleryScreen.tsx`, `AudioGalleryCard.tsx`, the new `AudioGalleryCardMenu.tsx`, `home.strings.ts` (`menuRename`, `menuDelete`). No API change.
- Validation: TypeScript is clean. ESLint shows 0 errors: 1 new inline-style warning in the menu, plus the screen's 9 existing warnings. Not run on device.
- QA: check the menu position on Android. `measureInWindow` combined with a `statusBarTranslucent` Modal can be offset by the status-bar height if the app is not edge-to-edge.

## 2026-11-23 — Bird Sound Library matches Figma in dark mode

- Figma 9380:111722. The dark colours were sampled from the render, because the export only lists light fallbacks.
- `AudioGalleryScreen`:
  - Tabs: dark active is `#009DA7` (text and 2px underline), dark inactive is `#D1D1D1`. Before, both modes used brown `#402122` and grey `#5D5D5D`.
  - Tab size and type: 32 high with 12 side padding. Labels 16/24, Medium when active and Regular with −0.16 spacing otherwise.
  - Dark search field fill is `#091421`, with the Border-0 `#333333` border.
  - Spacing: 20 side padding (was 16), 8 above search (was 4), 24 search → tabs (was 12).
  - The dark loading spinner uses the theme CTA.
- `AudioGalleryCard`:
  - Dark play button is `#16B6B4` with a `#091B21` play/pause glyph. Before, it was brown with a white glyph.
  - Dark scientific name and meta are `#D1D1D1` (was `#5D5D5D`).
  - The scientific name is no longer italic, in both modes, as in Figma. Name 16/24, captions 12/16.
  - Text layout: the name group sits at the top and the meta line at the bottom of the 64px row.
  - Unknown-tab cards, the swipe area and the empty thumbnail used light pink `#F5EBEB` in dark; they now use the dark surface. The edit icon is `#D1D1D1` in dark.
- Light colours are unchanged apart from the non-italic scientific name.
- Not changed, no dark Figma for these: the “My Recording” badge (pink/brown) on Unknown cards, and the empty-state “Identify by Sound” button (pink/brown).
- Affected: `AudioGalleryScreen.tsx`, `AudioGalleryCard.tsx`. No API change.
- Validation: TypeScript is clean. ESLint shows 0 errors and 9 existing warnings, none on changed lines. Not run on device.

## 2026-11-23 — Bird size scale: light silhouettes and Figma radios in dark mode

- `size_scale.svg` had `#111111` hard-coded, so the bird silhouettes stayed black in dark mode. Its fill and stroke are now `currentColor`, and both callers pass a colour: `#F6F6F6` in dark (Figma 9380:170241), `#111111` in light, so light mode is unchanged.
  - Callers: `WizardSizePicker` (step-by-step “How big was the bird?”, Figma 9380:170233) and `BirdDetailSections` (collection bird details size scale).
- Step-by-step size radios in dark mode (Figma 9380:170248): selected is a teal `#16B6B4` (`rgba(22, 182, 180, 1)`) 2px ring with a 10px dot, on design request; the Figma render shows `#785284`; unselected is `#D1D1D1` fill with a `#B0B0B0` ring. Before, dark used the theme CTA and Border-0 with no fill. Light is unchanged.
- The size pill radius is now explicitly 24 (Figma Tag/Filter). The border stays `#41EDE9`.
- Affected: `size_scale.svg`, `WizardSizePicker.tsx`, `BirdDetailSections.tsx`. No API change.
- Validation: TypeScript is clean. ESLint shows 0 errors and 7 existing warnings, none on changed lines. Not run on device.

## 2026-11-23 — Step-by-step location suggestions use the Explore search (Mapbox fallback)

- Root cause of “no suggestions”: `WizardLocationSearchField` called the shared `src/utils/geocodingApi.ts`. That needs `GEOCODING_API_KEY`, which is empty in `.env`, `.env.dev` and `.env.prod`, so it returned `[]` without sending any request. `MAPBOX_ACCESS_TOKEN` is set in all three. Only presence was checked; values were not read.
- The field now imports `searchAddressSuggestions` and `geocodeAddress` from `src/features/explore/utils/geocodingApi.ts`. It uses geocode.maps.co when that key is set, otherwise Mapbox Geocoding v6, and returns the same result shape. Superseded requests are cancelled with an `AbortController`.
- Not changed: `ChangeLocationBottomSheet` and other callers of the shared util still use geocode.maps.co only. They return no suggestions until `GEOCODING_API_KEY` is set or they are switched the same way.
- Affected: `WizardLocationSearchField.tsx`, `FLOWS.md`. No env names or values changed.
- Validation: `npx jest __tests__/explore/geocodingApi.test.ts` passes (6/6, including the Mapbox fallback with no geocoding key). TypeScript is clean. ESLint shows the same 2 existing warnings. Not run on device; live Mapbox results are not verified.

## 2026-11-23 — Step-by-step location: suggestions open after 3 letters; Continue above keyboard

- `WizardLocationSearchField` now opens its dropdown as soon as 3+ characters are typed. Before, it only appeared after results came back, so slow, empty or failed searches showed nothing.
  - The dropdown shows “Searching…” from the first keystroke, covering the 300 ms debounce, then the suggestions. If there are none it shows “No matching places”. That includes a failed request or missing `GEOCODING_API_*` config (the env var names are present in all `.env*` files; values not checked).
  - Earlier results stay visible while a new search runs.
  - New strings: `stepByStep.searchingLocations` and `stepByStep.noLocationMatches`.
- Figma dev note 9380:170789: “The continue button should float above the keyboard”.
  - Question view wrapped in `KeyboardAvoidingView`: iOS uses `padding`; Android already uses `adjustResize`.
  - Footer bottom padding is 16 while the keyboard is open, instead of the home-indicator inset.
- Affected: `WizardLocationSearchField.tsx`, `StepByStepScreen.tsx`, `home.strings.ts`, `FLOWS.md`. No API change.
- Validation: TypeScript is clean. ESLint shows 5 warnings of the existing `void` / inline-style kinds. Not run on device.
- Follow-up: device QA on iOS and Android for the dropdown, real search results, and the keyboard lift. If it always shows “No matching places”, check that the build loads `GEOCODING_API_BASE_URL` and `GEOCODING_API_KEY`.

## 2026-11-23 — Step-by-step location question matches Figma

- Custom Location is now typed inline (Figma 9380:170051), using the new `WizardLocationSearchField` instead of opening `ChangeLocationBottomSheet`.
  - The field is a 40px pill: radius 100, 16/8 padding, gap 12. The cursor is teal `#16B6B4` in dark mode.
  - Suggestions use the same `searchAddressSuggestions` search, with a 3-character minimum and 300 ms debounce.
  - The dropdown sits 4px under the field: radius 12, 12 padding, gap 8, rows with 4 padding at 16/24. It shows up to 3 rows (136 tall) and scrolls beyond that. Border-0 outline, with a white 15% shadow in dark and black 8% in light.
  - Pressing search on the keyboard uses the first suggestion, or else geocodes the typed text.
- The Current location pill uses the same Figma pill shape. Before, it had a 12px radius with 20/16 padding.
- Question body: top padding 20 and gap 20 (was 12 / 24). Footer: 20 side padding and 16 top (was 16 / 8).
- Footer button label: “Next” → “Continue”, as in Figma (`stepByStep.next`, used only here).
- Progress header: gap 8 (was 16). Dark track `#091421` and dark fill `#009DA7`. Light colours are unchanged.
- Not done: the Figma footer fade (transparent → `#091B21`). The footer sits below the scroll area, not over it, so the fade would not be visible.
- Affected: `StepByStepScreen.tsx`, the new `WizardLocationSearchField.tsx`, `WizardProgressHeader.tsx`, `home.strings.ts`, `FLOWS.md`. Same geocoding API; no API change.
- Validation: TypeScript is clean. ESLint shows 4 warnings: 2 in the new field (`void` and inline style, the repo's usual pattern) and 2 already in the screen. Not run on device. Typing, suggestions, dropdown overlap on Android, and keyboard behaviour need device QA.

## 2026-11-23 — Step-by-step intro bird: no white box in dark mode

- The “Let’s Find Your Bird” intro used `find_your_bird.png`, which has an opaque white background, so dark mode showed a white box behind the bird.
- Dark mode now uses the new `src/assets/dark/figma/wizard_find_your_bird.png` (300×274, registered as `Images.wizardFindYourBirdDark` and listed in `docs/dark-assets-manifest.json`). It matches Figma 9380:170609: transparent background and a `#072C38` ground shadow. The bird art is unchanged.
- How it was made: Figma's export is only 150×137 and the vector uses about 20 masked layers, so the dark file was made from the light PNG. The white background, including the enclosed gap under the belly, was made transparent, with edge un-blending so no white halo remains. The light `#CCDADC` shadow was recoloured to `#072C38`, keeping its soft edges.
- Light mode is unchanged.
- Affected: `StepByStepScreen.tsx`, `src/assets/index.ts`, the new dark PNG, `dark-assets-manifest.json`, `DEVELOPMENT.md`. No API change.
- Validation: `scripts/verify-dark-assets.js` passes. TypeScript is clean. ESLint shows the file's 2 existing warnings. The result was checked visually on `#091B21` in a preview render. Not run on device.
- Follow-up: replace it with a design-supplied transparent export if one is provided.

## 2026-11-23 — Choose a Method: scan-bird icon is teal in dark mode

- The popup hero used the purple raster `identify_option_icon.png` in both modes. In dark mode it is now drawn from the Figma 9380:171047 “Scan” vectors with `react-native-svg`:
  - `#16B6B4` scan frame with a 2.4 stroke, and a `#16B6B4` bird.
  - A `#072C38` 29.29×17.35 ellipse at the bottom centre.
  - All inside a 64px box, with the 48px scan box 6px above centre.
- Light mode still uses the existing PNG.
- Affected: `ChooseMethodPopup.tsx`. No API change.
- Validation: TypeScript and ESLint are clean for the file. Not run on device.

## 2026-11-23 — Sound results: note pencil and “Recording saved” toast match Figma

- Note text: it was 14/20 italic `textPrimary`. It is now Figma Body/16px/Regular: Satoshi Regular 16/24 with −0.16 spacing, `textSecondary` (`#D1D1D1` dark / `#5D5D5D` light). It shows on one line with a tail ellipsis and doesn't scale with the system font size.
- Note card pencil (Figma 9380:171249, `pencil-edit-01`): it was brand-tinted at 16px. It is now in a 20px frame with the 14.83px glyph, white in dark and `#5D5D5D` in light.
- “Recording saved to Unknown.” toast now follows the Figma “Toast message” in both modes. Before, it was a bordered success banner with an underlined green Undo and a text “×”, 24 from the bottom.
  - Layout: 48 high, 20 from each side (335 wide), 8px radius, 12/4 padding, gap 16. No border. Soft shadow (4,4 / 4 blur / 8% black).
  - Placement: the bottom offset is `max(safe-area bottom, 32) + 12`. Figma's 44 is a 32px home-indicator bar plus a 12px gap. A fixed 44 did not clear the bottom inset on every device.
  - Colours: light uses a `#EBFFF2` fill. Dark uses `rgba(18, 47, 30, 1)` (`#122F1E`), on design request. The message is Satoshi Medium 14/20 `#22C55E` in both modes.
  - Dark actions: Undo and the X are white and the divider is `#333333`, so they stay visible on the dark fill.
  - Actions: a 32px-high Undo button with 8px side padding and 24px radius, Satoshi Medium 14/20 `#091B21`, not underlined. Then a 1×32 `#B0B0B0` divider, then a 20px `#5D5D5D` close X.
  - Undo and close behave as before.
- Affected: `OtherPossibleMatchesScreen.tsx`. No API change.
- Validation: TypeScript is clean for the file. ESLint shows only the file's 10 existing warnings, none on changed lines. Not run on device.
- Follow-up: confirm the dark Undo, divider and X colours with design. Only the dark fill was given; the others were chosen so they stay readable.

## 2026-11-23 — Sound “Add note” popup matches Figma

- `AddSoundNotePopup` now follows Figma 9380:171302 (on 9380:171250).
  - Card: 335 max width, 16px radius, 1px Border-0 outline, `surfacePrimary` fill.
  - Sections: header pt20/pb16/px20 with gap 8, body px20/py4, footer pt16/pb20/px20.
  - Close chip: absolute, 16 from the top and right, 24px. Light: `#F6F6F6` fill, `#E7E7E7` border, `#5D5D5D` X. Dark: Figma dark Surface-Secondary `#091421` fill, Border-0 `#333333` border, white X.
  - Text: title Satoshi Bold 20/28. Subtitle Satoshi Regular 16/24 with −0.16 spacing (was 14/20).
  - Textarea: 100px high, 12px radius, 16px side padding and 10px top/bottom padding, 16/24 text, `#949494` placeholder. Light: `#F6F6F6` fill, `#E7E7E7` border, `#091B21` text. Dark, on design request: `rgba(9, 27, 33, 1)` (`#091B21`) fill, Border-0 `#333333` outline, white typed text.
  - Continue: `#785284` in light and teal `rgba(22, 182, 180, 1)` (`#16B6B4`) in dark, as requested by design. No glow, 10/16 padding, 24px radius, Satoshi Medium 16/24 white.
  - Text in the popup does not scale with the system font size.
- Dark mode was checked against the Figma render. Card `#091B21`, outline `#333333`, and placeholder `#949494` all match. On design request, the dark Continue button is teal `#16B6B4`, not the Figma render's `#785284`. The subtitle is now fixed to Figma `#5D5D5D` in both modes (dark was `#D1D1D1`).
- Kept on purpose: Figma's “Add note” title is `#091B21` on the `#091B21` card, so it can't be seen. The app keeps the title `textPrimary` (white in dark) so it stays readable. The Figma frame should be fixed.
- Light mode: the Continue fill changes from `#725481` to the Figma `#785284`, and the popup now has the 1px `#E7E7E7` outline.
- Affected: `AddSoundNotePopup.tsx`. The shared `TextArea` molecule is no longer used here. No API change.
- Validation: TypeScript is clean for the file. ESLint shows 1 inline-style warning (busy opacity). Not run on device.

## 2026-11-23 — Recorded sound crop: dark location card uses dark tokens

- The Figma crop frame 9380:171315 shows dark mode with light-mode tokens. The heading is `#091B21` on `#091B21`, so it can't be seen. The subtitle is `#5D5D5D` and the location card is `#F6F6F6`. The design owner chose proper dark tokens. The heading stays `textPrimary` (white) and the subtitle stays `textSecondary` (grey 200). In dark mode the location card now uses `surfaceSecondary` (`#091B21`) with a 1px `borderPrimary` (`#333333`) border, 8px radius and `textPrimary` copy. Before, it was hard-coded to `#F6F6F6` / `#E7E7E7` with `#091B21` text. The link stays `#007AFF`. Light mode is unchanged.
- Affected: `SoundRecordingCropContent.tsx`. No API change.
- Validation: TypeScript is clean for the file. ESLint shows only the file's existing inline-style warnings. Not run on device.
- Follow-up: the Figma frame should be fixed to use dark-mode variables.

## 2026-11-23 — Recording timer pill uses teal

- The recording timer pill used the create-button brown (`#402122`), then briefly Surface-brand-1 `#785284`. On design request it now uses teal `rgba(22, 182, 180, 1)` (`#16B6B4`) with white time text, in both themes. Only that fill changed.
- Affected: `RecordingTimer.tsx`. No API change.
- Validation: not run on device.

## 2026-11-23 — Microphone permission icon follows Brand 1 by theme

- The microphone stayed purple in dark mode. It now uses Figma “Text & icon-Brand 1”: `#785284` in light and `#009DA7` in dark. The shadow uses “Surface-brand 2 Accent”: `#C1D8DB` in light and `#072C38` in dark.
- Affected: `MicrophonePermissionPopup.tsx`. No API change.
- Validation: not run on device.

## 2026-11-23 — Microphone permission icon uses the Figma purple

- The microphone glyph was clipped by a white rectangle, so the icon did not stay the Figma purple `#785284`. The clip is removed and the path fill is `#785284`. The ellipse stays `#C1D8DB`.
- Affected: `src/assets/common/icons/microphone-popup/mic.svg`. No API change.
- Validation: not run on device.

## 2026-11-23 — Microphone permission icon matches Figma

- The permission popup was using a raster microphone that did not match Figma 9380:170991. It now uses the Figma ellipse and microphone SVGs in the 64px slot.
- Affected: `MicrophonePermissionPopup.tsx`, `src/assets/common/icons/microphone-popup/`. No API change.
- Validation: not run on device.

## 2026-11-23 — Identify by sound opens the microphone popup first

- Home and other Identify by sound entry points were skipping the microphone popup and opening the recorder. The popup now stays on the current screen. Allow continues to Sound Identify after access is granted. Not Now stays put. An already-granted microphone skips the popup.
- The popup matches Figma 9380:170991: 16px card radius and border, 24px close chip, 20/28 title, 16/24 subtitle, and 16/24 medium button labels. Copy is unchanged.
- Affected: `IdentificationEntryProvider.tsx`, `MicrophonePermissionPopup.tsx`, `FLOWS.md`. No API change.
- Validation: not run on device.

## 2026-11-23 — Identification congratulations adds “Keep going!”

- The milestone sheet still uses the existing title, identified-count line, and Back to Home button. A second subtitle line, “Keep going!”, now sits under the count, matching Figma 9376:243399.
- Affected: `AppSheet.tsx`, `modals.strings.ts`. No API change.
- Validation: not run on device.

## 2026-11-23 — Possible Matches shows the accuracy score

- Each photo match card on Possible Matches now shows the percent and “Accuracy Score”. The percent is `similarityScore` from `POST /core/ai/identify`, already mapped to `accuracy` as 0–100. A match with no score still shows only the name.
- Affected: `OtherPossibleMatchesScreen.tsx`, `camera.strings.ts`. No API change.
- Validation: not run on device.

## 2026-11-23 — Diagnosis loading uses the dark background

- In dark mode the analyzing screen called `AskAIScreenBackground` without `isDark`, so it painted the light sky and white fade over the dark page. It now passes `isDark` and uses the supplied Ask AI night background. Light mode is unchanged.
- Affected: `DiagnosisLoadingScreen.tsx`. No API change.
- Validation: not run on device.

## 2026-11-23 — Ask AI photo falls back when BirdBot chat is down

- Device log on 2026-11-23: an Ask AI photo reached `POST /core/chat` and the server returned 500, reason “The ornithological database is currently unreachable.” Text chat still depends on that database. A photo that hits this 500 now calls `POST /core/ai/identify` and shows the top match. If identify also fails, the original chat error is still shown.
- Affected: `AskAIScreen.tsx`, `API_AND_DATA.md`.
- Validation: not retested on device after the fallback.

## 2026-11-23 — Ask AI chat bubbles match Figma 9403:59208

- Dark user bubbles are `#01474F` with white 14/20 text. Dark AI bubbles are `#091421` with a `#333333` border and `#D1D1D1` 14/20 text. Both use a 20pt radius. Light bubbles are unchanged.
- Affected: `AskAIScreen.tsx`. No API or send-flow change.
- Validation: not run on device.

## 2026-11-23 — Ask AI greeting type matches Figma 9403:59273

- The empty Ask AI heading “Hello, how can I help you?” is 18/24 bold. The subtitle “Choose a question or ask anything about bird.” is 12/16 medium, `#D1D1D1` in dark. The shared title token had been rendering the heading at 24px.
- Affected: `AskAIEmptyState.tsx`. No flow or API change.
- Validation: not run on device.

## 2026-11-23 — Delete collection dialog matches Figma 9399:176896

- Dark delete-collection popup is a 335pt card on `#091B21` with a `#333333` border and 16pt radius. The backdrop is `rgba(0, 0, 0, 0.6)`. The trash illustration is the 64pt teal icon. The title is 20/28. **Yes, Delete** is `#16B6B4` with `#091B21` text. **No, Thanks** is outlined. The close control is a 24pt chip on `#091421`.
- Affected: `DeleteCollectionConfirmation.tsx`. Copy and delete behavior are unchanged. Light mode still uses the existing popup chrome.
- Validation: not run on device.

## 2026-11-23 — Collection options menu matches Figma 9399:177008

- The three-dot menu on a collection is an 8pt-radius dropdown. Rows are 14/20 with 12×8 padding and an 8pt icon gap. “Rename collection” uses secondary text (`#5D5D5D` light, `#D1D1D1` dark). “Delete” and the trash icon are `#EF4444`. Light fill is `#F6F6F6` with an `#E7E7E7` border. Dark fill is `#091B21` with a `#333333` border and the Figma white 7% shadow.
- Affected: `CollectionDetailsScreen.tsx`, `collection.strings.ts`. No API or navigation change. The delete confirmation copy is unchanged.
- Validation: not run on device.

## 2026-11-23 — Duplicate collection name matches Figma 9399:176750

- Typing a name that already exists on Collection (including Identified, Wishlist, and Near You) keeps the Create sheet open. The field border turns `#EF4444`, a 16pt alert icon appears, and the line “This collection name has been used.” is shown at 12/16. Save stays disabled (`#333333` / `#6D6D6D` in dark). The same inline state is used when create fails with a duplicate-key response. Other create failures still toast.
- Affected: `AppSheet.tsx`, `CollectionScreen.tsx`. No API change.
- Validation: not run on device.

## 2026-11-23 — Create collection sheet matches Figma 9399:176742

- Dark Create collection sheet title is “Create new collection” at 20/28. The subtitle matches the frame. The name field is a 48pt pill on `#091421` with a `#333333` border. Empty Save is `#333333` with `#6D6D6D` text. The close control is a 24pt chip on `#091421`. Sheet fill stays `#091B21` and the backdrop stays `rgba(0, 0, 0, 0.6)`.
- Affected: `AppSheet.tsx`, `collection.strings.ts`. No API change.
- Validation: not run on device.

## 2026-11-23 — Near You uses the real step-by-step location

- Collection → Near You opens Catalogue on the Near You tab, which is the intended navigation. The empty “Oops! No birds found.” state came from `POST /core/archetypes/step-by-step`: `archetypeService.stepByStep` ignored the caller and always posted a fixed test body (`lat` 3.7, `lng` 101.7, date 2026-06-26, sizes Small and Medium-Small). It now posts the location, date, and size the caller built. Catalogue Near You and the collection preview build that body from `resolveBirdDiscoveryLocation`.
- Updated API_AND_DATA and KNOWN_GAPS. The client-only `region` field is still omitted from the HTTP body.
- Validation: `__tests__/api/coreServices.test.ts` passed (3 tests). Device log on 2026-11-23: Collection → Near You opens Catalogue, GPS returns `No location provider available` (code 2), and `step-by-step` is not called. The empty state now shows that location message instead of only “Oops! No birds found.”

## 2026-11-23 — Collection dark page matches Figma 9399:176895

- Dark Collection page fill is now `#091421` (Figma surface-secondary). Cards are `#091B21` with a `#333333` border, 16/24 titles, an 8pt photo grid of 64pt tiles, and a Create chip of `rgba(7, 44, 56, 1)` with `rgba(22, 182, 180, 1)` text, matching Figma 9399:176895. The screen title is 20/28. Light Collection colors are unchanged. The shared dark surface token stays `#091B21`.
- Affected files: `src/constants/colorConstants.ts`, `src/features/collection/components/CollectionCard.tsx`, `src/features/collection/screens/CollectionScreen.tsx`. No flow, API, or environment change.
- Validation: not run (no device screenshot against the Figma frame). Owner for a dark-mode Collection visual check is unassigned.

## 2026-11-20 — remove root Dark Mode design dump

- Deleted the untracked root `Dark Mode/` folder (~55MB design source). App dark assets remain under `src/assets/dark/supplied/` and `src/assets/dark/figma/`. Manifest `suppliedAssets` is now a path list; `verify:dark-assets` checks those files exist and fails if `Dark Mode/` returns. Updated DEVELOPMENT, QA, and HANDOVER_60_DAYS.
- Validation: `npm run verify:dark-assets` passed (402 registry references; 46 obsolete paths absent).

## 2026-11-20 — Explore Near You banner description

- Home / Catalogue Explore Near You card description under the heading is now "Discover bird sightings, hotspots, and species around your area." (`EXPLORE_HOME_STRINGS.description`). In dark mode the subtitle uses primary/white text (same as the heading); light mode keeps secondary grey. Dark-mode card/banner fill is `#091B21` (`homeSurfaceDark`), matching other apps. Updated FLOWS and PRODUCT.
- Validation: `HomeExploreNearYouSection` Jest — 4 tests passed. Not run: device visual check of wrap on small phones.

## 2026-11-20 — Appearance picker touch targets

- Settings → Appearance rows nested a touchable `RadioButton` inside a row pressable, so taps on the radio often did not change the theme. Rows now use a single `Pressable` with a non-interactive radio indicator, primary label color, and 52dp row height. `RadioButton` supports `interactive={false}` for the same pattern in Accordion. Settings toggles gained extra hit slop.
- Validation: not run (device). Theme Jest suites not re-run this change.

## 2026-11-19 — show Appearance and enable dark mode

- Settings → Appearance was hidden because `isDarkModeEnabledForApp()` returned false, and a Light Remote Config arm also hid the row and locked the theme. Dark mode is now on for the whole app. Appearance offers Light, Dark, and System on every build. `theme_default` only sets the first theme when the user has not chosen one. A stored Light value with no explicit choice can follow the system default. iOS `UIUserInterfaceStyle` is Automatic.
- Updated product, flow, development, QA, Firebase setup, and theme-experiment docs.
- Validation: 4 theme Jest suites / 15 tests passed; handover link checker passed. Not run: native rebuild, phone/tablet light/dark walkthrough. iOS Automatic appearance is not on an already installed binary until that binary is rebuilt. Owner for device contrast/cropping remains unassigned.

## 2026-11-18 — remove inherited mushroom artwork and dark fallbacks

- Re-audited 308 bundled PNG/WebP files with contact sheets/full-size spot checks. Deleted 46 identified mushroom or obsolete assets, including 44 rasters and both unused legacy subscription SVG backgrounds. Added `docs/dark-assets-manifest.json` and `npm run verify:dark-assets` to prevent broken references, deleted files returning and light assets behind Dark aliases.
- Remapped dark backgrounds, onboarding, cards, banners, quiz/personality, AI avatars, feed and popup artwork to supplied bird/generic resources. Home identify copy is now native/localized; dark onboarding has native illustrations/stats; neutral transparent gift/error art uses shared names rather than fake dark aliases. Quiz IDs remain unchanged, use a generic bird mascot and ignore inherited remote mushroom image overrides. Dark rollout gates remain unchanged.
- Updated development, API/data, QA, handover ownership, specialist asset audit/checklist and scripts guidance. Distinct bird quiz archetype art remains product follow-up, owner unassigned.
- Validation: TypeScript passed; 4 targeted Jest suites / 14 tests passed; dark-asset guard passed (387 registry references, 46 removed files); standalone image routing passed (322 bundled entries); targeted ESLint passed with inline-style warnings; documentation checker and `git diff --check` passed. The broader image-pipeline audit retains its pre-existing SettingsAccountDialog Image/import finding from the earlier check.
- Not run: native builds or phone/tablet acceptance. Full SVG preview could not be completed: local-file browser preview was blocked by browser URL policy; no bypass attempted. Simple existing SVG icons were retained. Native contrast/cropping and SVG fidelity remain open, owner unassigned.

## 2026-11-18 — audit and wire suitable dark assets

- Created `codex/dark-mode` from local `main`. Corrected dark subscription carousel entries, paywall background selection, Home Go Pro, Identify tab, bird-of-the-day header/popup assets and sound-identification popup art. Light variants and rollout gates are unchanged.
- Audited all 59 dark-folder PNG/WebP files visually. Several contain inherited mushroom artwork or white backgrounds; these are explicitly recorded as follow-up in DEVELOPMENT and HANDOVER_60_DAYS. Retained raster paywall background because its SVG uses filters/blending; existing simple SVG icons remain vectors.
- Validation: `tsc --noEmit` passed; theme Jest suites passed (3 suites, 12 tests); standalone `verify-app-image-routing.js` passed (329 bundled entries); documentation checker passed; `git diff --check` passed. `npm run verify:image-pipeline` failed on pre-existing direct Image usage/import in unchanged SettingsAccountDialog.tsx; its chained routing check was run independently and passed.
- Not verified: native builds, phone/tablet rendering, cropping, SVG fidelity, dark contrast. Owner unassigned for artwork replacement and iOS/Android acceptance before enabling the master gate.

## 2026-11-12 — Sound matches header + step-by-step test payload

- Sound Possible Matches header: the ⋯ menu used a fixed-width middle spacer, so it sat next to back instead of the top-right. Middle slot is now `flex: 1` (`OtherPossibleMatchesScreen`).
- Step-by-step kept loading when live wizard location/size produced empty or stalled searches. The temporary shared test body from an earlier uncommitted chat was missing from `archetype.service.ts`. Restored `STEP_BY_STEP_TEST_REQUEST` (`lat` 3.7 / `lng` 101.7, `seenDate` 2026-06-26, `birdSize` `["Small","Medium-Small"]`) for every `stepByStep` call. Wizard loading path skips GPS resolution while that override is active so DiagnosisLoading cannot hang on location.
- Docs: API_AND_DATA + KNOWN_GAPS note the temporary override must be removed before release.
- Validation: source review of prior chat + current call sites. No device re-run of step-by-step or sound matches in this change; Metro was already running on a connected Android device.

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

## 2026-11-04 — Explore location search repair

- Audited Explore and compared Plantzy/Shroomzy geocoding implementations. Found the separate geocoding key blank in active/dev/prod settings while Mapbox was configured. Added Mapbox Geocoding v6 forward suggestions when the original provider is unconfigured, following Plantzy's fallback approach. Existing configured primary provider remains preferred; no keys or environment loader changes. Temporary Mapbox results are not cached/persisted.
- Fixed delayed input blur restoring an obsolete selected location label by reading the latest selected label and clearing pending blur timers on selection. Updated feature README, ENVIRONMENT, FLOWS, QA and handover acceptance.
- Validation: live request with configured public token returned HTTP 200 and five Chennai features (credential not logged). All 36 Explore tests passed in 5 suites, including six provider regressions; TypeScript passed. Tests' fake clock was corrected to advance monotonically across cases so shared pacing does not stall later assertions. Targeted lint and documentation/whitespace checks run.
- Device keyboard, suggestion taps, clear/retype, expanded-map selection and nearby refresh remain open for incoming mobile owner (unassigned). No native rebuild/device test performed in this change; existing native build limitations remain separate.

## 2026-11-04 — Birdzy app-wide leftover audit

- Audited the existing known gaps, current routes/services, full Jest suite, TypeScript, app-wide ESLint, image routing and iOS pod setup. Initial full test result was 741 passed/4 failed (68 suites); all four failures were camera test hosts missing the required ThemeContext. Both ordinary and first-foreground test hosts now use the actual light theme.
- Notifications: added persisted account ownership, clearing on account changes/logout, guards for late subscription/refresh callbacks, and hydration protection against another account's saved state. Do not persist transient loading. Replaced no-op list refresh with the existing Firestore fetch service. Regressions cover isolation, same-owner retention, refresh, delayed sign-out results and late hydration.
- Specimen PATCH now preserves explicit empty editable arrays rather than losing requests to clear lists. Immutable/unknown fields remain excluded. Added a contract regression; live backend clearing acceptance is still open.
- Corrected installed app-version reporting through react-native-device-info. Latest/minimum version enforcement still needs a real backend/product contract. Changed the unsupported coupon “Apply” action to honest View Plans navigation; no arbitrary code redemption is claimed. Removed unused AI methods returning mineral facts/unsupported rock diagnosis after confirming no app callers.
- Removed six unused-import lint errors. The initial app-wide lint run also reported 849 warnings (419 inline styles, 240 no-void, 65 hook-dependency, 56 unused variables, 37 bitwise, 28 shadowing, 3 nested components, 1 consistent-this). Those warnings are not suppressed or claimed resolved.
- Raised outdated pod deployment targets to React Native's supported minimum in the Podfile hook. `npm run pod:install` passed (166 pods), and generated pod targets were all iOS 15.1. The pre-existing Hermes xattr cleanup emitted permission warnings but did not fail installation. Native build result is recorded below when complete; pod installation is not device acceptance.
- Updated API, flow, development, environment, QA, known-gap and handover documents. Restored links to Explore files now tracked in the repository, replacing historical docs-only publication caveats.
- Validation: final whole-app Jest run passed 752 tests in 70 suites, including the five notification regressions. Targeted API/collection/notification run passed 43 tests; installed-version regression and camera prompt tests passed. TypeScript and app-wide lint were rerun after the changes; final results follow below. Image pipeline and AppImage routing checks passed. Documentation link/blank-example and whitespace checks passed.
- Remaining acceptance: actual iOS/Android keyboard/location/map flows, Firestore account switching on devices, store price/offer eligibility and live Bird API mutation semantics. Mobile/backend/product/store/QA owners remain unassigned. No push or release performed by this audit.

### Final audit validation / build handoff

TypeScript completed successfully and app-wide ESLint completed with zero errors (`--quiet`; existing warnings remain). Added Mapbox wrapper regressions: both missing-native recovery and linked-native prop forwarding passed (2 tests), in addition to the full 752-test/70-suite run. The last TypeScript run includes the final service cleanup and notification persistence changes; runtime/device acceptance is still separate. Android dev release pre-check passed.

The iOS build progressed beyond the old deployment-target error into native compilation, but no successful build is claimed. The initial unrestricted build was interrupted to reduce resource pressure; the resumed two-job build was stopped when the user said they will run builds. Build and device acceptance are handed back to the user. No release/push performed.

## 2026-11-04 — Fix normal push failing on the personal mirror

- Reproduced the configuration behind the supplied GH013 report: origin had organization and personal push URLs. Organization main was already synchronized; the personal mirror rejected an earlier commit containing Mapbox public `pk.*` values. No secret `sk.*` values found in the inspected current/historical environment files; no values logged.
- Kept origin pointed at the organization repo and preserved the personal repository as the separate local `personal-mirror` remote. No force push, history rewrite, push-protection bypass, app code or token change. Documented local setup and explicit mirror limitations in RELEASE.md.
- Validation: organization fetch, push preview and actual pull/push passed before the change. Standard origin pull/push was rerun after separation; final result recorded below. Documentation checker and whitespace checks run. Explicit personal-mirror publication remains blocked by its historical push-protection finding and was not attempted.

Final verification: `git pull --ff-only origin main` returned Already up to date; `git push origin main:main` returned Everything up-to-date after remote separation. The two documentation updates remain uncommitted; remote configuration is already effective locally.

## 2026-11-04 — eMudhra Apple Firestore security patch

- Previous local FirebaseFirestore: 12.8.0. Added a Firebase 12.19.0 base override and exact FirebaseFirestore 12.19.3 requirement, preserving current React Native Firebase JS APIs and the CocoaPods integration. This is a temporary native override needing native compatibility acceptance, not a tested wrapper major upgrade.
- Initial global 12.19.3 attempt could not resolve the separately versioned Analytics pod; the final base-plus-Firestore-pin approach uses published component versions. Lockfile/dependency verification results are recorded below after resolution.
- No Android App Distribution Gradle plugin references found in the app build configuration; no Android security dependency edit needed for this finding. No app logic, credentials, environment loading or JS package versions changed. Existing unrelated local work preserved.
- Updated environment/release docs, added [app-specific security remediation instructions](../firebase-emudhra.md), and recorded open release ownership/acceptance. Builds, device tests, store uploads and rollout are not run; the user handles builds.

Validation completed: CocoaPods update passed; FirebaseFirestore and FirebaseFirestoreInternal both resolve to 12.19.3; installed Manifest.lock matches the repository lock; Podfile SHA-1/checksum and Ruby syntax passed. Handover link/blank-example validation and whitespace checks passed. No builds/device tests/releases performed. Branch base: `main` at `1ca722a82760236f7b397ad74c33ee2f5bcfb15c` selected after fetching all remote heads and comparing their most recent commits; no default/dev-branch assumption.

## 2026-11-06 — save the identification photo with Add to Collection

- Identification Add to Collection now uploads the user photo to the already-allowed `posts/images` Storage path and stores the public `storage.googleapis.com` URL. Identified, Wishlist, and custom collections send that URL first on `POST /core/specimen/add`. Specimen update is not given image fields. An existing specimen is replaced by a new row so the photo can be stored. Display unwraps a catalogue path glued onto the photo URL.
- Updated [FLOWS.md](FLOWS.md) and [API_AND_DATA.md](API_AND_DATA.md). No Storage rules deploy and no environment or credential change.
- Validation: `npx jest __tests__/collection/userCollectionPhoto.test.ts __tests__/collection/birdSpecimenPayloads.test.ts --no-coverage` passed 2 suites / 12 tests. No device add, carousel, or live API check was run. Owner for that acceptance is unassigned.

## 2026-11-04 — Developer Firebase upgrade handoff

Created [a consolidated five-app upgrade plan](../NATURE_APPS_FIREBASE_UPGRADE_PLAN.md) explaining the iOS security patch, exact Podfile/lock changes, per-app source branches and security commits, conditional Android App Distribution plugin work, production archive routes, tooling caveats and open release/QA ownership. Rechecked current local wrappers, locks and package scripts and consulted the official Firebase advisory. No dependency/application changes or builds performed in this documentation change. Validation: handover checker passed (14 pages, 284 local links); new document links and all five referenced security commit lockfiles checked; git diff --check passed. Store binaries, device acceptance and rollout remain unverified.

## 2026-11-04 — Cursor and Claude security handoff prompts

Added separate copy-ready Cursor Agent and Claude/Claude Code prompts to [the five-app Firebase upgrade plan](../NATURE_APPS_FIREBASE_UPGRADE_PLAN.md). Prompts start with the existing security branches, avoid duplicate/broad upgrades, preserve local work and credentials, distinguish Android plugin use from SDK metadata, and keep user-run builds and release approval explicit. No application or dependency change. Validation: documentation checker, new document local-link checks and whitespace checks passed. Prompts were reviewed as text; they were not executed in Cursor or Claude.

## 2026-11-04 — Generic product-level security brief

Rewrote the upgrade document as a reusable product/release brief at the user's request. Removed app names, code locations, commands, branch/commit details and implementation instructions. Retained the issue, affected platform/service or tooling, patched component targets, validation/release actions and generic Cursor/Claude assessment prompts. Included other technologies to avoid applying native Android conclusions to every framework. Updated the handover index. No application or dependency changes. Validation: documentation checker, document structure/content checks and whitespace checks passed; prompts were not executed and no release status was newly certified.

## 2026-11-04 — Word security brief

Created [the Word version](../eMudhra_Security_Update_Brief.docx) of the generic product/release brief, including separate copy-ready Cursor and Claude prompts. Preserved generic platform scope and removed app-specific/code locations from the deliverable. Validation: final DOCX rendered to four pages and every page visually inspected; title styling, prompt lists, content presence, generic scope and document links checked. No app/dependency changes, builds or releases performed.

## 2026-11-09 — Background and cold-start push notifications

- Added Android data-only FCM display through the existing Notifee channel and aligned Debug and Release iOS APNs entitlements with their signing environments. The scene forwards cold-start notification responses to the installed notification-center delegate. Added data title/body fallback in the foreground and deduplicated the FCM tap listener.
- Updated [QA_AND_OPERATIONS.md](../../docs/handover/QA_AND_OPERATIONS.md) with the payload, signing and device QA cases.
- JS/TS syntax checks and the mocked Android background-handler smoke check passed. Xcode project and entitlement lint passed. SceneDelegate Swift syntax parsing passed.
- The repository-wide TypeScript check and handover link checker passed.
- Open with owner unassigned: signed builds and physical-device delivery and tap validation using the real server payloads. Direct APNs routing remains unverified.


## 2026-11-11 — Duplicate-call lifecycle audit and fixes

Concurrent profile requests share one in-flight result per account and JWT. A finished request cannot restore a replaced account. The visible profile loader also settles when a concurrent silent refresh applies the shared JWT result first. Device POSTs share only overlapping identical account/token/payload requests; settled requests can be retried. Token-refresh subscriptions share one native connection across mounted owners, retain it through JWT rotation, and dispose connections that resolve after cleanup. These guards limit side effects, rather than suppressing normal React state updates.

Collection loading has one pending load per screen/account, no separate mount+focus fetch, no recursive error timers, and no hidden-screen wishlist fetch followed by another focus fetch. A wishlist mutation that arrives while an older collection read is still open refreshes once after that read finishes, instead of keeping the stale counts. Catalogue appends and collection creation acquire synchronous guards. Overlapping likes share one mutation/owner notification. Foreground FCM setup has reference-counted ownership and late-setup cancellation; cold-start routing is consumed once. General API dedup keys include the session and exclude independently cancellable and multipart requests. IAP connection failure can be retried without an old rejection clearing a newer attempt. Existing identify attempt controls and receipt processing guards were inspected and retained.

Updated docs/handover/DEVELOPMENT.md, docs/handover/QA_AND_OPERATIONS.md, this changelog and HANDOVER_60_DAYS. Existing unrelated local Insecto Firestore/iOS work is preserved. No dependency, backend contract or environment change was introduced by this audit.

Follow-up audit: a visible `getProfile` that was abandoned after an account change cleared without resetting `isLoading`, which could leave the loader stuck. Ownership is now per visible load; a superseded or abandoned call clears only its own loader. Added a lifecycle regression for that case.

Validation: `npx jest __tests__/lifecycle --runInBand --no-coverage` passed (10 suites, 26 tests), including delayed wishlist refresh and the abandoned getProfile loader case. `python3 docs/handover/check_docs.py` reported OK (14 handover pages, 289 local links). Physical-device navigation, real push delivery, sandbox billing, release builds and render profiling were not run. QA/release owner remains unassigned; complete the documented acceptance checklist. Changes remain local.

## 2026-11-11 — Explore Near You entry, tabs, empty state and Android location copy

Ported the Shroomzy `fix/explore_bugs` Explore UI fixes into Birdzy (birds wording; Spotted Now instead of Growing Now):

- Home banner: whole panel tappable; "Enable Location" when location is off, "Explore Map" when on; no row counts. Shared [useExploreEntry](../../src/features/explore/useExploreEntry.tsx) + [useLocationPermissionGranted](../../src/features/explore/useLocationPermissionGranted.ts).
- Catalogue: "Explore Near You" pill and map banner above category tabs use the same entry hook; banner hidden while filters are applied; brand orange/yellow outline on the map edge.
- Explore tabs: Spotted Now / Year-round equal halves via [ExploreTabBar](../../src/features/explore/components/ExploreTabBar.tsx).
- Empty state: design wording (default / filtered / wide) and `EmptyState` `appearance="body"`.
- Android first-ask location popup: "Enable Location Access" with "Allow Location"; iOS App Review copy unchanged.

Updated [FLOWS.md](FLOWS.md), [QA_AND_OPERATIONS.md](QA_AND_OPERATIONS.md), [explore README](../../src/features/explore/README.md) and this changelog. No environment or credential changes.

Validation: `npx jest` on the seven new Explore/Home UI suites passed (7 suites / 21 tests). `python3 docs/handover/check_docs.py` reported OK (14 handover pages, 297 local links). Existing broader Explore API suites and device acceptance for Home/Catalogue entry, Android popup and map outline were not run; QA owner unassigned.

## 2026-11-09 — Camera permission copy aligned with Figma

- Compared the identify camera permission flow with Figma (node 8558:25287). Updated the shared camera permission copy in `src/config/strings/modals.strings.ts`: subtitle now reads "To identify birds around you, Birds AI needs access to your camera." and the button reads "Allow access" (sentence case). Used by the inline Allow Access screen and the camera permission prompt that reuses `getCameraPermissionUiCopy()`.
- Permission screen UI now matches Figma 8558:25313 / 8558:25342. New `src/features/camera/components/CameraPermissionGateChrome.tsx` renders the 40px back and flash buttons on top and, at the bottom, gallery (works; disabled while the native dialog is open), a greyed-out shutter (#B0B0B0) and a flip-camera button. Flash and flip are display-only. Screen background is now Figma grey/950 via the new `APP_COLORS.cameraPermissionSurface` (#091B21), and the permission content is centered on the full screen. The old take-photo PNG had a baked-in #111 background, so the inline state uses a new transparent `src/assets/camera/take_photo_illustration.svg` built from Figma 8567:1851 vectors; `CameraPermissionPopup` still uses the PNG.
- Validation: TypeScript has no Birdzy errors (the untracked `mushrooms-reactNative/` folder reports its own errors); ESLint `--quiet` on changed files passed. On a connected Android phone (Birdzy dev, Metro): revoked camera access, denied twice, and checked that Allow access and Go to settings both match Figma; gallery button opened the gallery and back returned to the screen. Not checked on iOS. Jest filtered to "camera": 64 Birdzy tests passed; the 5 failing suites are all in the untracked `mushrooms-reactNative/` folder. Handover docs checker passed.
- Follow-up pixel pass (Figma 8558:25313): `CameraPermissionInlineState` now uses the Figma popup layout exactly — max 335 wide (shrinks on narrow screens), header pt20/pb16/px20 gap 8, footer pt16/pb20/px20, so the text→button gap is 32 (was 16). Explicit Figma type: body Satoshi-Regular 16/24 −0.16 `#D1D1D1`, title Satoshi-Bold 20/28 white, button Satoshi-Medium 16/24 white on `#785284` (new tokens `cameraPermissionCta`, `cameraPermissionTextSecondary`; previously theme primary/`#725481`). Text uses `allowFontScaling={false}` (repo convention) so line breaks match Figma. Content stays centered on the full screen with a symmetric inset from `getCameraPermissionGateContentInset()` so it never overlaps the top/bottom bars on short screens. Re-checked both screens on the Android phone after resetting the denial count; TypeScript/ESLint clean on changed files.
- Still open: the "gallery granted + camera denied → Scanning Tips → close opens gallery" Figma dev-note case is not implemented; iOS allows only one native camera prompt, so Case 1's second native dialog is Android-only.

## 2026-11-11 — Sync org and personal-mirror main

- Org `origin/main` and `personal-mirror/main` had diverged after separate merges (Explore/lifecycle/security on org; UI polish / camera permission on personal). Merged personal-mirror into local main, resolved Explore banner + Bird details title conflicts by keeping org entry/location behavior and identification photo flow while retaining personal responsive banner scaling and `allowFontScaling` polish.
- Updated this changelog. No environment or credential changes.
- Validation: `python3 docs/handover/check_docs.py` reported OK (14 handover pages, 297 local links). Push both remotes to the same tip after the merge commit. Device acceptance not re-run in this sync.

## 2026-11-20 — Supplied dark artwork and onboarding duplicates

- Retained the original root `Dark Mode/` folder and copied matching PNGs byte-for-byte into `src/assets/dark/supplied/`. Replaced dark-only registry routes for onboarding/auth, Home, Ask AI, feed/catalogue/collection empty states, post-auth illustrations, upgrade and permission sheets. Existing light/shared registry routes are unchanged and protected by the asset verifier.
- Removed the extra dark onboarding top illustration overlay; the supplied backgrounds already include artwork. Dark auth uses its full background without the light bird-circle overlay. Light auth keeps its existing split layout. Dark Android tablet slides show native copy. Home dark cards use supplied composite artwork without duplicate icons.
- Updated DEVELOPMENT.md, QA_AND_OPERATIONS.md, HANDOVER_60_DAYS.md and asset provenance/guard documentation. No environment/API change.
- Validation: `npm run verify:dark-assets` passed (395 registry references, 46 obsolete paths absent, retained-source parity and light-route checks); `npm run verify:image-pipeline` passed with its existing SettingsAccountDialog raw Image audit finding; targeted ESLint passed with 0 errors / 44 warnings; `python3 docs/handover/check_docs.py` passed (14 pages, 302 local links; optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native builds or simulator/physical-device render checks. Owner unassigned: complete phone/tablet iOS/Android cropping, copy/CTA, contrast and light/dark switching acceptance in QA_AND_OPERATIONS.md. Earlier local Appearance/settings/radio/accordion changes were preserved.


## 2026-11-20 — Figma dark pagination and teal primary CTA

- Implemented Figma nodes 9373:171149 (selected) and 9373:171150 (unselected) using the existing 8×8 animated pagination circles. Dark selected fill is `#16B6B4`; unselected is the same teal at 20% opacity.
- Added dark-specific app tokens and applied the teal primary CTA fill to the design-system theme, legacy dark theme and onboarding CTA constant. Light CTA and pagination colors are unchanged. No environment/API change. Updated development, QA and handover acceptance notes.
- Validation: loaded actual TypeScript theme modules with the installed compiler and asserted dark CTA/dot values, legacy dark CTA, onboarding dark CTA and unchanged light CTA/dot values; all passed. Targeted ESLint passed without errors or warnings. `python3 docs/handover/check_docs.py` and `git diff --check` passed.
- Not performed: simulator/device render verification or native builds. Owner unassigned: accept animation, contrast and phone/tablet light/dark appearance on both platforms.

## 2026-11-20 — Dark Home surfaces and Figma promotions

- Applied the requested dark wizard background `#072C38` and Identify by Photo background `#0E2230`; selected the supplied dark photo panel. Dark sound identification uses the teal fill and 60% white panel shown in Figma. Light branches retain their existing values/assets.
- Implemented Home Figma nodes 9375:227597, 9375:212474 and 9375:212475: crowned-bird 335×160 offer with native left-aligned headline/timer/teal CTA, teal bordered sticky countdown with pill timers/nest/badge, teal-to-purple Go Pro/premium header with medal, matching Bird of the Day/Ask AI/Library cards, and dark Explore surfaces/map. Corrected the previous Bird of the Day mapping from a 72×72 icon to the 323×272 composite card. Existing countdown state, offer eligibility, navigation and dismiss callbacks remain connected.
- Added `DarkHomePromotions.tsx`, dark-specific Home tokens and local Figma map artwork. Retained original `Dark Mode/` files and recorded new runtime-copy provenance. Updated development, QA and handover acceptance notes. No environment/API change.
- Validation: `tsc --noEmit --pretty false` passed; targeted ESLint returned 0 errors / 34 warnings; dark asset verifier passed (400 registry references, 46 obsolete paths absent, original-copy parity and light-route guards); image-pipeline verifier passed with the existing SettingsAccountDialog raw Image audit finding. Confirmed nonempty local assets and expected banner/card/photo/library/medal dimensions. Documentation checker passed (14 pages, 302 links, one optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native builds, simulator screenshots or physical-device tests. Owner unassigned: complete dark Home promotion/Explore action, geometry and contrast acceptance and Light regression checks on iOS/Android phones/tablets. Figma image inspection and source dimensions do not establish device-render fidelity.

## 2026-11-20 — Shared dark CTAs, Bird of the Day, Catalogue and details

- Implemented Figma CTA nodes 9375:212793 / 9375:212792: shared dark primary fill `#16B6B4`, white medium text, 24-point corners and soft glow; Bird of the Day View details uses the dark surface/border and Refresh retains primary styling. Updated shared buttons, popup helpers, subscription CTA constants/intro, camera Identify and post-auth overrides. Light button branches retain their original tokens.
- Replaced inherited dark semantic cream/grey primary values with the referenced bird palette (`#091B21`, `#091421`, `#072C38`, teal brand/focus colors, white inverse text). Catalogue node 9399:156319 now uses dark card surfaces, teal active tabs, single-line names and 12/16 scientific-name copy. Search node 9399:156329 uses the dark focused fill and teal edge/cursor. Bundled exact Figma search/volume/mute SVGs; play/stop handlers and dynamic species imagery/content remain unchanged.
- Applied Details node 9399:159869 dark surfaces/CTA tokens and reused `SubscribeToPremiumCard` for dark locked-section overlays, with bird-specific native copy and a teal Get Premium CTA. Kept Light overlays, existing premium criteria and navigation. Updated asset provenance, development, QA and acceptance notes. No environment/API change.
- Validation: TypeScript `tsc --noEmit --pretty false` passed. Targeted ESLint completed with 0 errors / 114 warnings. Runtime source assertions compared the entire Light semantic palette/theme and Light detail/card/subscription CTA constants with HEAD and passed; asserted dark surface/CTA/focus values also passed. Dark asset guard passed (400 registry references; 46 obsolete paths absent; Light-route/source-copy guards); Figma SVGs are nonempty, parse successfully and retain intrinsic dimensions inside 24-point render slots. Separate AppImage routing verifier passed. Handover checker passed (14 pages, 302 local links, optional sibling portfolio link unavailable); `git diff --check` passed.
- Combined `npm run verify:image-pipeline` did not pass: its existing SettingsAccountDialog raw Image/import audit finding exits nonzero before the routing stage. This corrects earlier entries that described the audit output as passing; the separate routing check passes. The out-of-scope finding remains open, owner unassigned.
- Not performed: native build, simulator/device screenshots, real audio playback or purchase tests. Owner unassigned: accept shared dark-token consumers, Bird of the Day actions, Catalogue search/play/stop, locked Details navigation and Light regression on iOS/Android phones/tablets. Source checks do not establish rendered fidelity.

## 2026-11-20 — Dark background sweep, bottom tabs, Ask AI and feed/community

- Reviewed Figma nodes 9380:171015, 9380:186844, 9403:59273, 9406:7211 and 9406:7208. References include mixed light/dark styles; applied the requested dark native palette while retaining their layout/artwork and preserving Light branches.
- Standardized plain dark defaults to `#091B21` through semantic surfaces and explicit auth/profile, feed/card, collection/edit, sheet/modal, location-input, subscription retry and tooltip overrides. Kept supplied background images, designed accent panels and the focused search state; camera/media preview backgrounds remain functional media surfaces.
- Updated dark bottom tabs: 16-point side icons, 14/20 labels, full tab-width 2-point teal selection line, 56-point row plus safe area, and 48-point native teal Identify circle using exact locally bundled Figma bird/frame SVGs. Removed the runtime use of a full-screen background as the dark Identify tab icon. Existing tab analytics/reset/measurement and chooser behavior remain connected. Light tab geometry/artwork unchanged.
- Ask AI retains supplied night-sky art at full opacity without the old fade. Feed keeps its header art/dynamic content, with dark cards and teal active tabs/Create label. Community Rules keeps configured scrollable content, existing agree/close behavior and dark native surfaces/teal CTA. Updated developer, QA, acceptance and specialist Feed docs; no environment/API change. Original `Dark Mode/` folder remains intact.
- Validation: TypeScript `tsc --noEmit --pretty false` passed. Targeted ESLint completed with 0 errors / 141 warnings. Source assertions verified plain dark theme/feed/sheet/collection backgrounds, teal tab selection and the distinct focus token; full Light theme and audited Light flow constants match HEAD. Dark asset guard passed (400 registry references, 46 obsolete paths absent, original-copy/Light-route guards); standalone AppImage routing verifier passed. SVG assets are nonempty, parse correctly and preserve intrinsic dimensions in the 24-point scan slot. Handover checker passed (14 pages, 302 local links; one optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native build, simulator/device render or navigation/send/create/agree tests. Owner unassigned: complete iOS/Android phone/tablet dark background, tab safe-area/chooser/reset, Ask AI, feed/details/create, Community Rules and Light regression acceptance in QA_AND_OPERATIONS.md. The existing SettingsAccountDialog image-pipeline audit finding remains open.

## 2026-11-20 — Figma post details and Settings bottom-sheet gallery

- Applied Figma node 9406:7143 as dark-only post-details overrides: compact 52-point header, 8-point author/content gaps, 116-point comment field, 32-point Send pill with disabled styling, 16-point bottom action icons and separate reply header/body rows. Dynamic post/avatar/comment data and existing send/like/share handlers remain in place; Light geometry is retained.
- Added CommentActionSheet with Reply and Copy text from comment/reply More controls, using the existing reply composer and system clipboard. No comment deletion/report endpoint was introduced.
- Added Settings → Previews → Bottom sheets and the typed BottomSheetGallery route. The gallery covers all 15 AppSheet types, all nine limit categories, 50%/70% offer/promotion variants and standalone post/comment action, password, location, removal, plan-selection and plan-switch sheets. A typed Registry and LimitType Record enforce complete registered/limit coverage when types change.
- Added SheetPreviewContext (default false, provided only by the gallery). Preview collection queries use local fixtures; collection create/rename/remove, permission requests/effects and manual location geocoding return before external actions. Other sample callbacks close previews without purchase/account/report/password changes. Pricing hooks may still read plan information. Corrected the Switch Plan dark panel's previously fixed white surface while exposing it in the gallery. Original dark artwork folder remains intact; no environment/API change.
- Updated flow, development, feature-catalogue, QA, handover acceptance and specialist Feed notes.
- Validation: TypeScript `tsc --noEmit --pretty false` passed. Targeted ESLint returned 0 errors / 47 warnings. Executed eight actual extracted preview handlers in an isolated JavaScript context without service/native/network globals: create, rename, notification enable, location enable, both AppSheet collection loaders, standalone geocoding submit and removal all returned/used fixtures successfully. Dark asset guard passed (400 registry references, 46 obsolete paths absent, Light-route/source-copy guards); standalone AppImage routing verifier passed. Handover checker passed (14 pages, 306 local links; optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native build, device/simulator renders, opening every sheet, actual clipboard/comment/reply/purchase/permission tests. Owner unassigned: complete the gallery action-isolation, keyboard/dismissal and post-details acceptance in QA_AND_OPERATIONS.md on iOS/Android phones/tablets in Light/Dark. The pre-existing SettingsAccountDialog image-pipeline audit finding remains open.

## 2026-11-20 — Inactive Home offer and identification sound-control alignment

- Implemented Figma 9375:212476 as HomeFullPriceBanner, reusing the supplied crowned-bird background and native Upgrade to Pro / unlimited features / teal Subscribe now content. Annual price/monthly equivalent use the full-price plan hook and existing formatter; no sample price is hardcoded and unavailable price rows are omitted.
- Dark Home shows this banner when the discount phase is inactive/disabled or the displayed countdown reaches zero. Preserved premium exclusion, dismissal, analytics and full-price navigation (`discount50: false`, plan modal open). Existing Light banner/artwork and active-flag behavior remain unchanged.
- Fixed Figma 9375:213219 dark identification/Bird Details name-sound control: full-width name container with 20-point insets, flexible name copy, non-shrinking 48×48 button at the right edge, `#091B21` fill / `#333333` border and white glyph at its intrinsic dimensions within a 24-point slot. Existing sound availability/play/stop/end logic and Light styles remain unchanged.
- Updated flow/development/feature-catalogue/QA/acceptance notes. No environment/API change; original Dark Mode folder retained.
- Validation: TypeScript passed; targeted ESLint completed with 0 errors / 79 warnings. Executed the actual Home conditional for active-positive, inactive-cooldown, active-zero, inactive-zero and unchanged Light-active cases; all five passed. Source geometry assertions confirmed full-width dark name row, page inset, fixed/non-shrinking 48-point control, dark fill and 24-point icon slot. Dark asset verifier passed (400 references, 46 obsolete paths absent, Light-route/source-copy guards); standalone AppImage routing and handover links/examples passed (14 pages, 307 links; optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native builds/device renders, store-price purchase/navigation or real sound playback. Owner unassigned: complete phone/tablet iOS/Android long-name icon, playback, inactive-banner price/CTA and Light regression acceptance. Existing SettingsAccountDialog image-pipeline audit finding remains open.

## 2026-11-20 — Figma first sound-identification screen

- Implemented dark entry phase from Figma 9380:170994: retained supplied night-sky background and bird/wave artwork, reference hero/copy/location arrangement, removed the extra dark tagline and anchored the 72-point record target with 48-point teal microphone circle near the safe-area bottom. Bundled the exact Figma microphone SVG at intrinsic dimensions within its 24-point slot. Short-screen spacing reduces the reference 100-point top gap when needed.
- Dark location row uses readable dark surface/border with a grey track/white thumb; existing location, microphone permission, start-recording, minimum-duration, live recording, crop and identification handlers remain connected. Light entry and later recording/crop visual branches retained. Original Dark Mode folder preserved; new runtime copies/provenance added. No environment/API change.
- Updated development, QA, handover acceptance and specialist physical-device sound QA notes.
- Validation: TypeScript passed; targeted ESLint completed with 0 errors / 8 warnings. Existing recordingTimer and soundRecording.constants Jest suites passed (2 suites / 8 tests). Confirmed 438×336 hero and 750×1174 background dimensions, nonempty 17.5×21.5 SVG, reference aspect ratios and available-height fit at 812/667/568-point screen sizes. Dark asset guard passed (402 registry references; 46 obsolete paths absent; Light-route/source-copy checks); standalone AppImage routing passed. Handover checker passed (14 pages, 307 local links; optional sibling portfolio link unavailable); `git diff --check` passed.
- Not performed: native build, device/simulator rendering or physical microphone/location tests. Owner unassigned: complete the linked first-screen and sound-device acceptance checklist on iOS/Android phones/tablets. Existing SettingsAccountDialog combined image-pipeline audit finding remains open.

## 2026-11-20 — Figma recorded-sound crop UI

- Implemented Figma 9380:171133 dark crop layout in the shared recorded-sound content/preview: compact title/body spacing without duplicate headings/tagline, duration chips, 100-point rounded spectrogram, full-height red frame and grip handles, teal time endpoints, real session metadata/location and existing sticky Identify CTA. Both crop entry points use the supplied dark popup background.
- Dark begins with the full recording; selecting 9/18/27 seconds creates the existing fixed-length crop, and tapping the selected chip restores full. Dragging still moves the clamped fixed window. Dark preview now uses a tap gesture on the spectrogram with accessible play/pause guidance, replacing the large center overlay. Light keeps its previous default, overlay play control and crop geometry. Actual recorded spectrogram columns remain dynamic; no sample recording image replaces audio data.
- Bundled the exact Figma grip SVG at intrinsic dimensions and recorded provenance. Existing playback/trim/identification services, microphone logic and recording controls remain connected. Updated developer, QA, specialist sound-device and handover acceptance notes. No environment/API change; original Dark Mode folder retained.
- Validation: TypeScript passed; targeted ESLint completed with 0 errors / 16 warnings. Crop, recording finalization, timer and constants Jest suites passed (4 suites / 15 tests). Executed actual crop state initializers/selection handler to verify Dark full default, selection, same-chip reset and unchanged Light default/selection. Asset guard passed (402 registry references, 46 obsolete paths absent, Light/source-copy guards); standalone AppImage routing passed; handover checker passed (14 pages, 307 local links; optional sibling portfolio link unavailable); `git diff --check` passed. Grip asset is nonempty with a 13×5 intrinsic SVG rotated inside its 9×20 handle slot.
- Not performed: native builds/device renders, tap/drag arbitration, real playback/trim/identification or screen-reader tests. Owner unassigned: complete physical iOS/Android phone/tablet and Light regression acceptance in the sound-device and handover QA guides. Existing SettingsAccountDialog image-pipeline audit finding remains open.

## 2026-11-20 — Dark crop location card matches Figma

- Updated SoundRecordingCropContent's dark location view to Figma 9380:171133: light-grey `#F6F6F6` fill, `#E7E7E7` border, 8-point corners, 12-point padding and dark 14/20 text. Known locations remain blue/underlined and now include the reference angle brackets. The location-off variant has matching card contrast and a grey/white toggle.
- Fixed style precedence so the explicit card fill overrides the generic dark surface. This narrow reference-specific treatment supersedes the prior generic dark location card; Light styling and enable/edit/analyzing handlers are unchanged. Updated development, QA and handover acceptance notes; no API/environment change.
- Validation: TypeScript passed; targeted ESLint completed with 0 errors / 9 warnings; handover checker passed (14 pages, 307 links; optional sibling portfolio link unavailable); `git diff --check` passed. No device render or permission/edit-location interaction test performed. Owner unassigned: accept long-place wrapping and Light/Dark location states on iOS/Android.
