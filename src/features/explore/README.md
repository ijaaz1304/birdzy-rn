# Explore Near You

Ported from Shroomzy's `codex/explore-reliability-fixes` branch (local reference commit `7d57155`), adapted to the Birdzy API contract at https://birds-api.trackzio.com/docs/core-module.

## Updating the feature

- `assets/`: Home map artwork, empty-state artwork and map controls. Replace files in place to update the visuals together; `assets/index.ts` is the asset registry.
- `content/explore.strings.ts`: Home copy, screen labels and accessibility text.
- `content/explore.colors.ts`: Search border, tab colors, map activity colors and matching legend colors.
- `content/explore.config.ts`: API paths, supported map filters and map search radius (100 km).
- `services/`: Location-only nearby list API, bird GeoJSON API and response processing.
- `components/`, `screens/`, `hooks/`, `utils/`: Explore-specific UI and behavior. Shared account, wishlist, permission and bird detail components remain integrated with Birdzy.

Species images are supplied by the Birdzy API (`defaultImageUrl`, falling back to `imageUrls`); they are not bundled placeholder sightings.

## Map setup

Set a **public** `MAPBOX_ACCESS_TOKEN` (`pk.*`) in the desired environment file (`.env.dev` / `.env.prod`), then select that environment and rebuild. No token is included or copied from Shroomzy. When no token is configured, the screen keeps location search and nearby results available and explains that the map is unavailable.

The React Native Mapbox dependency and both lockfiles are updated. Android includes the Mapbox Maven repository; the iOS Podfile includes Mapbox's pre/post-install hooks. Run `npm run pod:install` after dependency changes and rebuild the native app. The iOS pods were installed successfully during implementation; a device build and live map rendering still need verification with a token.

## API behavior

- `POST /core/archetypes/explore-near-you`: sends only `{ location: { lat, lng } }`; pagination and `growingNow` / `yearRound` tabs go in query parameters. The legacy wire name `growingNow` is displayed as **Spotted Now**, using `spottedNowCount` and `isSpottedNow` from the bird response.
- `POST /core/archetypes/explore-map-geojson` (no body; bounds and filters in query parameters): always supplies explicit bounds. Filters apply to map activity, not the nearby list. Map activity spans all seasons and is independent of list pagination and tabs.
- Map selections match species using `birdsLifeId`, never an observation ID. A selected group shows matching **loaded** birds; more pages can be loaded explicitly.
- Map bounds handle the date line. Invalid coordinates are discarded; multi-value traits preserve OR semantics, including array-valued `birdType`. Map responses are clipped to the configured radius and duplicate observations are removed.
- Search, map and card requests use cancellation and freshness checks. New locations and account cleanup invalidate pending work. Repeated or non-advancing pages stop pagination. Retry-After is preserved for bounded retry of read requests.
- Explore's location stays separate from an in-progress identification. Manual search works without GPS permission; “Retry current location” can request access or open Settings.

## Verification

Explore regressions: `npm test -- __tests__/explore --runInBand`.

Type-check: `npx tsc --noEmit`.

Device checks still required: permission grant/denial and Settings return, offline map retry, cluster selection, zoom/recenter, expanded map, dark mode and wishlist/details return on iOS and Android. The docs contain an inconsistent pagination example (default page 1, example response page 0), so live backend pagination should also be confirmed.

Implementation verification: 30 Explore regressions passed; the default TypeScript check, Explore lint (zero warnings/errors), and Android production JavaScript bundle passed. The full Jest run reported 696 passed and 7 failed across existing spectrogram rendering, camera free-scan prompt, and image-routing performance tests; those tests and their production code were not changed. Native device rendering was not tested.

## Mapbox native module missing (2026-11-04)

If Explore reports `@rnmapbox/maps native code not available`, the installed binary has no `RNMBXModule`. A public token or Metro reload cannot install native code. The Mapbox dependency, Podfile hooks and Android Maven repository are already configured. Rebuild and install the matching app flavor:

- iOS development: `npm run pod:install`, then `npm run ios:dev`.
- iOS production configuration: `npm run pod:install`, then `npm run ios:prod`.
- Android: `npm run android:dev` or `npm run android:prod` for the installed flavor.

Close the old app before opening the rebuilt installation. Verify Explore on that installation: map tiles, search, selection and expanded map, plus nearby results. Do not treat a JavaScript bundle as native-linking verification.

`ExploreMapView.tsx` checks `NativeModules.RNMBXModule` before loading the SDK-backed `ExploreMapView.nativeMap.tsx`. Older binaries display an update message while location search and nearby results remain accessible. This fallback does not provide an interactive map; a native rebuild is required. No environment variable names or loading behavior changed.

## Explore location search recovery — 2026-11-04

Explore previously refused to search when `GEOCODING_API_KEY` was blank, even with a working `MAPBOX_ACCESS_TOKEN`. Forward suggestions now prefer the configured geocode.maps.co provider when its base URL and key are present; otherwise they use Mapbox Geocoding v6 with the existing public token. This follows Plantzy's configured-provider/fallback approach while retaining Explore's cancellation and debounce. No active environment values, variable names or loading rules changed; existing blank templates already include both keys.

Mapbox requests start after three characters and 300 ms without edits, with provider pacing and a 12-second timeout. Temporary Mapbox suggestions are not cached or persisted. Provider failures remain visible; an invalid configured primary key does not silently switch providers. Reverse lookup still requires the original geocoding provider. Search uses HTTP and works independently of the native Mapbox module; the interactive map still requires a native rebuild.

Selection now protects the chosen label from delayed blur callbacks. Validate on iOS and Android: type a city, choose a result with the keyboard open, confirm nearby results and map center update, clear/retype, and repeat in the expanded map. Live token check returned HTTP 200 with five Chennai features; device interaction remains unverified.
