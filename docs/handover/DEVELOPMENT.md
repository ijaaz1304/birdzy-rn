# Birdzy — developer guide

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

## Source snapshot and prerequisites

- React Native: `0.81.4`; React: `19.1.0`.
- Node engine declared by package.json: `>=20`.
- Dependency/install authority: [package.json](../../package.json) and [package-lock.json](../../package-lock.json).
- macOS/Xcode plus the repository Ruby/Bundler setup is needed for iOS; Android Studio, SDK, compatible JDK and emulator/device setup is needed for Android. Check native build files for their exact pinned requirements.
- Existing source naming may be inherited. Use current configuration, routes and request payloads to determine the active app domain.

## First successful development run

1. Obtain repository and dev-provider access from [the handover access list](HANDOVER_60_DAYS.md).
2. Review [Environment setup](ENVIRONMENT.md), obtain approved values and prepare the correct development environment files.
3. Install from the lockfile: `npm ci --legacy-peer-deps`. Review postinstall scripts first; they may apply native/library patches or generate assets.
4. For iOS, install Ruby dependencies with `bundle install` if the project uses its Gemfile, then use the checked-in pod installation command below.
5. Start Metro in one terminal and the selected native development target in another. Confirm the app's API environment, bundle/package ID and Firebase project before using an account.
6. Run the relevant checks and record the machine/toolchain/build details with the incoming owner. These instructions have not been re-executed across every app as part of this documentation-only change.

## Checked-in startup commands

- `npm run env:dev` — `node scripts/switch-env.js dev`
- `npm run start:dev` — `npm run env:dev && react-native start --reset-cache`
- `npm run android:dev` — `npm run env:dev && react-native run-android --mode=devDebug --appIdSuffix=dev`
- `npm run ios:dev` — `npm run env:dev && bash scripts/with-brew-ruby.sh react-native run-ios --scheme "Birdzy-Dev" --mode "Debug-Dev"`
- `npm run pod:install` — `bash scripts/with-brew-ruby.sh bash -c 'cd ios && bundle exec pod install'`

## Architecture and where to change things

- [App.tsx](../../App.tsx) — Provider composition and app startup/lifecycle.
- [src/navigation/RootNavigator.tsx](../../src/navigation/RootNavigator.tsx) — Root auth/onboarding and overlay routing.
- [src/navigation/MainTabs.tsx](../../src/navigation/MainTabs.tsx) — Primary tab entry points.
- [src/navigation/types.ts](../../src/navigation/types.ts) — Typed root/navigation contracts.
- [src/assets](../../src/assets) — Shared bundled artwork and icons; feature-local assets may live next to their feature.
- [src/config](../../src/config) — App configuration, strings and feature defaults.
- [src/design-system](../../src/design-system) — Shared theme/tokens and component presentation.
- [src/services](../../src/services) — API, provider and business integration code.
- [src/components](../../src/components) — Reusable UI and cross-cutting surfaces.
- [src/features](../../src/features) — Feature screens, state and orchestration.
- [scripts](../../scripts) — Environment, build, release, verification and generation helpers.
- [android/app/build.gradle](../../android/app/build.gradle) — Android app targets/flavors, versions and build configuration.
- [ios](../../ios) — Native iOS workspace/targets, entitlements and CocoaPods.
- [firebase.json](../../firebase.json) — Firebase deployment configuration.
- [firestore.rules](../../firestore.rules) — Firestore access rules.
- [storage.rules](../../storage.rules) — Storage access rules.
- [remoteconfig.template.json](../../remoteconfig.template.json) — Remote Config defaults/template tracked with the repo.
- [src/lib/firebase/config.ts](../../src/lib/firebase/config.ts) — Native Firebase app initialization.

## Approach to a bug fix or feature

1. Reproduce against an identified app, platform, environment and account state; capture the actual versus expected behavior.
2. Read [Flows](FLOWS.md), then trace the entry route → feature state → service/client → backend/provider response. Check existing specialist docs before copying a related app.
3. Make the smallest coherent change. Preserve lifecycle cancellation, stable IDs, account boundaries and purchase recovery.
4. Add a regression check for behavior that failed; run the relevant existing checks and targeted device path.
5. Update product behavior, flow/API/environment/release notes as appropriate, then [CHANGELOG.md](CHANGELOG.md). Record any remaining limitation and verification that was not run.
6. Have the incoming owner explain and reproduce the fix. Merge/release responsibility belongs to the approved repository/release owners.

## Verification commands available here

- `npm run test:quiet` — `jest`
- `npm run lint` — `eslint src --ext .ts,.tsx`
- `npm run prettier:check` — `prettier --check "src/**/*.{js,jsx,ts,tsx,json,md}"`
- `npm run verify:image-pipeline` — `node scripts/verify-image-pipeline.js && node scripts/verify-app-image-routing.js`

TypeScript is configured in [tsconfig.json](../../tsconfig.json). Use the installed compiler with `npx tsc --noEmit`; if the current branch has a known configuration/baseline issue, record the failure separately instead of silently relaxing compiler settings.

## Native and generated work

After adding/changing a native dependency, update the lockfile, iOS pods and platform configuration as required, then rebuild the native app. A Metro restart cannot install a native module. Read existing `postinstall`, patch and asset-generation scripts before a clean checkout; do not delete a patch just to make installation green.

## Check documentation links and examples

Run `python3 docs/handover/check_docs.py` from the repository root after updating this pack. It checks handover links and ensures example environment values remain blank; it does not validate app runtime behavior.

## Mapbox native module missing (2026-11-04)

If Explore reports `@rnmapbox/maps native code not available`, the installed binary has no `RNMBXModule`. A public token or Metro reload cannot install native code. The Mapbox dependency, Podfile hooks and Android Maven repository are already configured. Rebuild and install the matching app flavor:

- iOS development: `npm run pod:install`, then `npm run ios:dev`.
- iOS production configuration: `npm run pod:install`, then `npm run ios:prod`.
- Android: `npm run android:dev` or `npm run android:prod` for the installed flavor.

Close the old app before opening the rebuilt installation. Verify Explore on that installation: map tiles, search, selection and expanded map, plus nearby results. Do not treat a JavaScript bundle as native-linking verification.

`ExploreMapView.tsx` checks `NativeModules.RNMBXModule` before loading the SDK-backed `ExploreMapView.nativeMap.tsx`. Older binaries display an update message while location search and nearby results remain accessible. This fallback does not provide an interactive map; a native rebuild is required. No environment variable names or loading behavior changed.

## App audit changes — 2026-11-04

The Podfile normalizes outdated pod deployment targets to React Native's minimum. Reinstall pods after pulling it. The version store reads the installed version from react-native-device-info; a deployed latest/minimum-version contract is still absent, so this is not a working remote update-enforcement system. Notifications persist an ownerUserId and clear unscoped/other-account cached state on owner assignment. Keep account generation checks when changing refresh behavior.


## Duplicate-call lifecycle audit — 11 November 2026

Concurrent profile requests share one in-flight result per account and JWT. A finished request cannot restore a replaced account. The visible profile loader also settles when a concurrent silent refresh applies the shared JWT result first. Device POSTs share only overlapping identical account/token/payload requests; settled requests can be retried. Token-refresh subscriptions share one native connection across mounted owners, retain it through JWT rotation, and dispose connections that resolve after cleanup. These guards limit side effects, rather than suppressing normal React state updates.

Collection loading has one pending load per screen/account, no separate mount+focus fetch, no recursive error timers, and no hidden-screen wishlist fetch followed by another focus fetch. A wishlist mutation during an older collection read schedules one refresh after that read finishes. Catalogue appends and collection creation acquire synchronous guards. Overlapping likes share one mutation/owner notification. Foreground FCM setup has reference-counted ownership and late-setup cancellation; cold-start routing is consumed once. General API dedup keys include the session and exclude independently cancellable and multipart requests. IAP connection failure can be retried without an old rejection clearing a newer attempt. Existing identify attempt controls and receipt processing guards were inspected and retained.

The source review followed startup/authentication → Home/focus → catalogue and collections → identify/details → community mutations → subscription/purchase callbacks, including push and reminder listeners that outlive a screen. The changes add no endpoint or environment variable. Physical-device render profiling and production request traces remain unverified.

## Dark asset selection — 18 November 2026

Dark theme assets are selected by the existing theme hooks. `isDarkModeEnabledForApp()` is on, so Settings → Appearance is available on every build. `theme_default` only sets the initial theme when the user has not chosen one. It does not hide Appearance or lock the app to Light. iOS `UIUserInterfaceStyle` is Automatic; that plist value reaches a device only after a native rebuild. This is source behavior, not device acceptance.

Dark registry entries now resolve exclusively to supplied dark-folder or `_dark` assets. Runtime dark PNGs live under `src/assets/dark/supplied/`; the root design dump `Dark Mode/` was removed. `docs/dark-assets-manifest.json` lists the required supplied paths. Generic dark surfaces and auth select the supplied night sky; onboarding, upgrade sheets, permission popups, empty states, Ask AI and home cards select their corresponding artwork. Mushroom splash/onboarding/sheet/banner bitmaps and obsolete subscription SVG backgrounds have been deleted rather than left available for accidental reuse. Dark onboarding renders the complete supplied backgrounds without extra illustration overlays. The five configured pages map to Onboarding_2.2, 2.3, 2.4, 2.5 and 2.6 respectively. Light onboarding retains its existing backgrounds and split auth layout. Dark Android tablet slides also show native copy because the supplied PNGs contain artwork only. Home cards, the Identify tab, Go Pro, feed header, bird-of-the-day and sound-identification popups select suitable supplied dark artwork. Simple SVG notification, face and details-action icons remain vectors. Full SVG rendering fidelity is not verified.

The Home identify banner now renders localized native bird copy plus a bundled bird illustration rather than baked-in mushroom text. The cleanup also replaces identified mushroom light/shared assets (AI avatar/hero, empty-state fallback, personality backgrounds, promotion and quiz photographs) so shared paths cannot reintroduce mushroom artwork. Existing quiz archetype IDs remain compatible with data; all eight currently use the same generic bird mascot. Legacy mushroom remote quiz image settings no longer override these curated local sources. Distinct bird archetype artwork and a bird-specific remote image contract are future product work, owner unassigned.

### Repeatable checks and acceptance

`npm run verify:dark-assets` checks all relative source asset references, requires dark registry aliases to use dark assets, requires listed supplied dark PNGs to remain present, prevents the deleted files in `docs/dark-assets-manifest.json` from returning, and fails if the root `Dark Mode/` dump reappears. The manifest also protects existing light/shared registry routes; the guard cannot classify new image content. Visually review every future asset.

Phone/tablet acceptance remains open: light/dark switching; onboarding art/stats/copy/CTA overlap; auth; Home Identify banner and cards; generic and permission sheets; quiz; feed; seven subscription slides; popup crop/contrast; Go Pro and Identify tab on iOS/Android. The supplied dark collection/permission/AI illustrations still contain white/sky panels; their native contrast/cropping needs device review. No build or device render is claimed.


### Dark pagination and primary CTA — 20 November 2026

Dark `primaryCTA` and selected pagination dots use `APP_COLORS.ctaPrimaryDark` (`#16B6B4`); unselected dots use `paginationDotUnselectedDark` (the same teal at 20% opacity). This matches Figma nodes [selected](https://www.figma.com/design/wkpRZxcGSwbl6nOU2VvESd/Bird-Identifier-App?node-id=9373-171149) and [unselected](https://www.figma.com/design/wkpRZxcGSwbl6nOU2VvESd/Bird-Identifier-App?node-id=9373-171150). The existing animated native 8×8 circles, radius 4 and 4-point gap are reused; no raster asset is needed. Both theme APIs and the onboarding dark CTA constant share the dark fill. Light CTA/dot tokens remain unchanged.


### Dark Home sections — 20 November 2026

The Step-by-step intro bird uses `src/assets/dark/figma/wizard_find_your_bird.png` in dark mode (Figma 9380:170609). It is generated from the light `find_your_bird.png`: white background made transparent, ground shadow recoloured to `#072C38`. If design changes the bird, regenerate or replace it with a supplied export. The Home wizard entry uses `#072C38` and white copy in dark mode; Identify by Photo uses the requested `#0E2230` outer surface plus its supplied dark photo panel. Bird of the Day, Ask AI and Bird Sound Library select supplied composite artwork with native copy. Bird of the Day must use `Bird of the day-1.png` (323×272), not the 72×72 icon as a full background.

`src/features/home/components/DarkHomePromotions.tsx` renders dark-only promotions from Figma Home nodes 9375:212474 / 9375:212475 and banner 9375:227597: 335×160 crowned-bird artwork, left-aligned native discount/copy, live timer and teal subscription CTA; the sticky countdown uses a teal border, dark pills, nest and tilted discount badge; the header badge uses the teal-to-purple gradient and supplied medal. Existing promotion handlers, countdown state, dismiss actions and premium eligibility stay at the callsites. Light promotion branches remain unchanged.

The Explore dark card/banner fill is `#091B21` with `#333333` borders. Its Figma map asset is bundled in `src/assets/dark/figma/home_map.png`, with hotspot/pin overlays retained; the map already includes its teal outline and must not receive the old amber outline or opacity dimming. Light map artwork/outline and permission/navigation behavior are retained. Supplied dark runtime assets under `src/assets/dark/supplied/` are covered by the dark-asset guard.


### Shared dark CTAs, Catalogue and details — 20 November 2026

Figma nodes 9375:212793 / 9375:212792 define the primary and Bird of the Day secondary CTAs. Dark primary buttons use `#16B6B4`, white medium text and 24-point corners through `getDarkPrimaryCtaStyle` in `src/design-system/modalTokens.ts`. They are flat. The former `#FFAE00` soft glow and Android elevation were removed on 2026-11-23: they showed as a green haze under the teal fill, and the current Figma screens have no shadow. Bird of the Day keeps its own separate `#FFDD24` gold glow in `BirdOfTheDayModal.tsx`. Shared Button/PrimaryButton/AppButton variants, popup helpers, subscription constants, subscription intro, camera review and post-auth CTA overrides now use the dark fill. Bird of the Day View details uses the dark primary surface and border-0; Refresh keeps the teal primary treatment. Explicit custom button styles still follow their component APIs.

The dark semantic palette now uses the plain `#091B21` base, a distinct `#091421` focused search field, accent panels `#072C38`, teal brand fills and white inverse text, replacing inherited cream/grey primary values. The light semantic palette, full light theme and light card/detail/CTA constants were compared with HEAD and are unchanged. These shared dark tokens affect all consumers, so full dark acceptance remains open.

Catalogue node 9399:156319 uses dark cards, teal tabs, single-line titles and 12/16 scientific-name copy. Local Figma SVGs render at their intrinsic dimensions inside 24-point slots: volume-high while idle, volume-off while playing (Stop), and search. Playback handlers, dynamic species images/names and API filtering remain unchanged. Search focus follows node 9399:156329: `#091421` fill, `#009DA7` border/cursor; the idle field uses `#091B21` and border-0. SVG provenance is in `docs/dark-assets-manifest.json`.

Bird Details node 9399:159869 uses the dark surface/CTA specification. Locked sections reuse `SubscribeToPremiumCard` with native bird-specific copy, a dark accent panel and teal Get Premium CTA; Light retains its existing Go Pro overlay. Existing subscription navigation and lock criteria remain in place. Dynamic detail imagery, sound URLs and species content remain API supplied.


### Dark background and navigation flow sweep — 20 November 2026

Plain dark backgrounds now use `#091B21` across semantic primary/secondary/tertiary surfaces, the default page/card background, auth base, collection/edit tokens, feed/card fill, sheets, custom-location input, collection modals, profile/social buttons, subscription retry panels and tooltip chrome. Existing image backgrounds and explicitly designed accent panels (for example Home cards) remain in place. The focused search field retains its explicit Figma `#091421` state. Light colors and raw camera/media preview backgrounds are unchanged.

Dark bottom navigation follows node 9380:186844 layout with dark tokens: 16-point side icons, 14/20 labels, a full tab-width 2-point teal active line, a 56-point row plus device safe area, and a native 48-point teal Identify circle. Its bird/frame SVGs are bundled under `src/assets/dark/figma/` and render at their intrinsic size inside a 24-point slot. Identify still opens the chooser; tab analytics, reset behavior and measured tooltip targets remain connected. Light tab geometry/artwork is retained.

The supplied references 9380:171015 (details), 9380:186844 (Home/tab bar), 9403:59273 (Ask AI), 9406:7211 (Feed) and 9406:7208 (Community Rules) contain mixed light/dark component styles. The requested dark palette takes precedence for native surfaces/text; their layout and supplied artwork are reused. Ask AI now displays the supplied night-sky background at full opacity without the old dark fade. Feed retains its header image and dynamic post content, with dark cards, teal tabs and a dark/teal Create chip. Community Rules retains scrollable configured rules and its existing agree/close callbacks with a dark header/body/footer and teal Okay CTA.


### Settings sheet gallery and post details — 20 November 2026

`BottomSheetGalleryScreen` is a normal Settings route, reachable through Settings → Previews → Bottom sheets in all builds. Its typed `Registry` maps every `AppSheetType` to a valid preview payload; the `Record<LimitType, string>` covers every upgrade category. It also mounts the existing standalone sheet components with preview callbacks. No new endpoint, environment variable or feature gate is introduced.

`SheetPreviewContext` defaults to false. Only the gallery provides true. AppSheet create/rename handlers return before writes, collection pickers use `PREVIEW_COLLECTIONS` before service calls, notification/location effects and requests return before native/state changes, and standalone location/removal sheets intercept geocoding/removal and use sample data where applicable. Other preview callbacks close the selected sheet; the normal app retains its existing callbacks and services. Treat this context as part of the preview contract when adding sheets with internal mutations. Store price hooks can still read current plan information.

Post-details Figma node 9406:7143 is applied as dark-only geometry overrides; existing Light geometry and dynamic post/avatar imagery remain. `CommentActionSheet` provides local Reply / Copy text actions from comment/reply More controls, using the existing reply callback and system clipboard. Dark expanded replies render their header and text on separate rows at the existing 32-point inset. Switch Plan now uses the shared dark page surface rather than a fixed white panel in Dark.


### Inactive Home offer and name-sound alignment — 20 November 2026

`HomeFullPriceBanner` reuses the supplied crowned-bird 335×160 artwork for Figma 9375:212476, with native title/body, full-price annual plan row and teal CTA. It uses `useSubscriptionPlansWithPrices({ offerActiveOverride: false })` and the existing price-view helper. The design's sample price is not hardcoded; missing/unavailable store prices omit the price row. Home selects this Dark component when the active offer/countdown check fails; Light retains its prior bitmap branch and active-flag condition. Premium eligibility, dismissal and subscription analytics/navigation remain at the Home callsite.

BirdDetailsScreen adds dark-only full-width/padded title-container and non-shrinking sound-button styles for Figma 9375:213219. This fixes the old fixed white button under a white dark-mode glyph and keeps the control at the right side of long names. The existing SVG is rendered at its intrinsic 21.5002×17.5031 dimensions centered in a 24-point slot; Light retains its old icon geometry and button styles. Playback logic is unchanged.


### Sound identification dark entry — 20 November 2026

SoundIdentifyScreen's entry phase follows Figma 9380:170994 in Dark: supplied 375×587 night-sky background (750×1174 runtime PNG), 219×168 bird/wave illustration (438×336 PNG), title/subtitle copy, 48-point location row and bottom-anchored 72-point record target containing a 48-point teal circle and intrinsic 17.5×21.5 Figma microphone SVG in a 24-point slot. The extra No photo required tagline remains in Light only.

The entry block starts 100 points below its 52-point header at the reference size; available-height calculation reduces that gap on short screens while retaining space for the content and record control. Location uses the existing toggle/custom-location flow. Dark location surface/text use the current dark palette rather than the mixed Light fills/text in the reference. Light entry artwork/spacing and live-recording/crop controls remain on their existing branches. No permission, recording, duration, spectrogram or identification service logic was changed. Dark runtime artwork under `src/assets/dark/supplied/` remains listed in the dark-asset manifest.


### Recorded-sound cropping — 20 November 2026

Dark crop UI follows Figma 9380:171133 in the shared SoundRecordingCropContent / RecordedSoundPreview components. It uses compact ready-copy spacing, 9/18/27-second chips, a 100-point spectrogram with 8-point corners, full-height red selection edges, a top/bottom selection frame and locally bundled grip SVGs. Time endpoints use the teal token and seconds suffix; timestamp/location and the sticky Identify CTA retain real session data. Both the in-place SoundIdentify crop phase and standalone SoundCrop route use the supplied dark popup background. Live recording entry/controls are unchanged by this crop update.

Dark now starts with the full recording. Selecting a duration creates the existing fixed-length crop window; tapping the selected duration resets to full. Dragging moves that window through the original recording using the existing clamped-start calculations; handles are grip affordances, not independent resize controls. Tapping the spectrogram toggles preview of the selected range, replacing the large center play overlay in Dark. Accessibility exposes play/pause and drag guidance. The duplicate preview heading, extra tagline and hint row remain on Light only. Light keeps its prior selected-duration default, play button and spectrogram geometry. The spectrogram remains generated from actual recorded columns; the Figma sample recording image is not used as audio data.


### Dark crop location card — 20 November 2026

The crop location view follows the explicit card treatment in Figma 9380:171133: `#F6F6F6` background, `#E7E7E7` one-point border, 8-point radius, 12-point padding and 14/20 dark (`#091B21`) text. A known location is blue/underlined and displayed inside angle brackets. This is an intentional light-card exception inside the dark screen, overriding the earlier generic dark-surface treatment. It applies to both location-off and location-present states; the off toggle uses grey track/white thumb. Existing enable-location/edit-location actions and Light styles are retained.
