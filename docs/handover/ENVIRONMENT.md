# Birdzy — environment and access setup

Reviewed: 2026-11-02. Evidence: current local source and existing repository documentation. Device, store and backend behavior needs the acceptance checks below.

## How configuration is loaded

Loader: [src/constants/env.ts](../../src/constants/env.ts). App/domain defaults: [src/config/birds.config.ts](../../src/config/birds.config.ts).

The checked-in environment switch/start scripts select dev/prod; inspect `scripts/switch-env.js` and the environment loader to see how `.env.dev` / `.env.prod` become the active `.env`. Restart Metro after switching, and rebuild for native configuration changes. Do not switch an unrelated app’s files as a shortcut.

## Safe starter files

- [Development variable template](env/.env.dev.example)
- [Production variable template](env/.env.prod.example)

The templates contain **names and blank values only**. They are an inventory, not working credentials and not a statement that every optional/legacy key is required. Preserve approved existing environment files. Compare templates with the loader and obtain values from the designated owner/password manager or deployment secret store; do not overwrite a working file with blanks.

Set the active app API origin and environment/app identity first. Add provider credentials only for enabled flows, using this app’s Firebase/native/store configuration. Legacy aliases can be present without being the primary source; inspect precedence in the loader. Examples are not a reason to point one app at another app’s production backend.

## Existing local environment-file inventory

- `.env` — 20 declared variable names at review time; values were not copied into this pack.
- `.env.dev` — 20 declared variable names at review time; values were not copied into this pack.
- `.env.example` — 15 declared variable names at review time; values were not copied into this pack.
- `.env.prod` — 21 declared variable names at review time; values were not copied into this pack.

## Variable reference

“Seen in” records file declarations, not successful runtime configuration. “Source” records a code reference; absence means the setting needs owner confirmation or may be historical.

### `API_BASE_URL`

Primary backend origin; must match the selected app/environment.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `APP_CODE`

Application identity used by notification/backend integrations; use the approved per-app and per-environment value.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `APP_ENV`

Environment selector used by app/platform configuration; verify exact accepted values in its loader.

Seen in: `.env`, `.env.dev`, `.env.prod`. Source: [src/lib/env/appEnv.ts](../../src/lib/env/appEnv.ts).

### `APP_LOGS_ENABLED`

Diagnostic-log feature switch; agree on release behavior and data exposure with the owner.

Seen in: `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `APP_LOGS_SUPPORT_EMAIL`

App configuration input. Trace the listed consumer and confirm its purpose/default with the current owner before setting.

Seen in: not declared in the inspected environment files. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `APP_SHARED_SECRET`

Apple receipt/subscription verification credential or compatibility alias. Confirm the active alias and backend/store ownership; never copy its value into docs.

Seen in: `.env`, `.env.dev`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `APP_SPECIFIC_SHARED_SECRET`

Apple receipt/subscription verification credential or compatibility alias. Confirm the active alias and backend/store ownership; never copy its value into docs.

Seen in: not declared in the inspected environment files. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `APP_STORE_ID`

Store listing/application identifier. Check the actual listing and current native package/bundle ID.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `BIRDS_API_BASE_URL`

Bird backend origin; inspect precedence over compatibility aliases in the loader.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `COUNTRIES_JSON`

App configuration input. Trace the listed consumer and confirm its purpose/default with the current owner before setting.

Seen in: not declared in the inspected environment files. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `ENV`

Environment selector consumed by this app; verify exact accepted values in its loader.

Seen in: `.env`, `.env.dev`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts); [src/lib/env/appEnv.ts](../../src/lib/env/appEnv.ts).

### `FACEBOOK_APP_ID`

App configuration input. Trace the listed consumer and confirm its purpose/default with the current owner before setting.

Seen in: not declared in the inspected environment files. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `FACEBOOK_CLIENT_TOKEN`

External integration credential/configuration. Trace the listed source consumer and get the approved value from its owner.

Seen in: not declared in the inspected environment files. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `FIREBASE_APP_ID`

Firebase app/project configuration reference; must agree with the native Firebase files and selected project.

Seen in: `.env`, `.env.dev`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `FIREBASE_PROJECT_ID`

Firebase app/project configuration reference; must agree with the native Firebase files and selected project.

Seen in: `.env`, `.env.dev`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `GEOCODING_API_BASE_URL`

Forward/reverse geocoding provider base URL.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `GEOCODING_API_KEY`

Geocoding provider credential used for location search/reverse lookup.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `GOOGLE_GEOCODING_API_BASE_URL`

Maps/geocoding provider endpoint configuration; inspect the loader and provider plan.

Seen in: not declared in the inspected environment files. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `GOOGLE_MAPS_API_KEY`

Maps provider key; match Android/iOS application restrictions and enabled provider APIs.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `GOOGLE_PLACES_API_BASE_URL`

Maps/geocoding provider endpoint configuration; inspect the loader and provider plan.

Seen in: not declared in the inspected environment files. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `GOOGLE_WEB_CLIENT_ID`

OAuth sign-in client identifier. Match platform, environment, bundle/package ID and provider configuration.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `MAPBOX_ACCESS_TOKEN`

Public Mapbox token for the interactive map; restrict and manage through the Mapbox account.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `META_INSTALL_REFERRER_DECRYPTION_KEY`

Install-attribution decryption credential; obtain through the attribution owner.

Seen in: `.env`, `.env.dev`, `.env.prod`. Source: no direct reference found by the environment-name scan; confirm before adding/removing.

### `MINERALS_API_BASE_URL`

Mineral backend origin or an inherited compatibility alias; verify the current app-domain mapping.

Seen in: `.env.example`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `MUSHROOMS_API_BASE_URL`

Mushroom backend origin or an inherited compatibility alias; check the app loader before using it.

Seen in: `.env.example`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `NOTIFICATION_BASE_URL`

Notification-service origin, separate from the app core API.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `PLAY_STORE_ID`

Store listing/application identifier. Check the actual listing and current native package/bundle ID.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `PUBLISHED_APPS`

Cross-promotion app-list resource used by Other Apps sections.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `RATING_FEEDBACK_API`

Feedback/rating submission endpoint, when the app uses that integration.

Seen in: `.env`, `.env.dev`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

### `SUBSCRIPTION_VALUE`

Subscription configuration identifier/value; trace the current config consumer before changing.

Seen in: `.env`, `.env.dev`, `.env.example`, `.env.prod`. Source: [src/constants/env.ts](../../src/constants/env.ts).

## Native and service configuration beyond .env

- Firebase Android `google-services.json` and iOS `GoogleService-Info.plist` must belong to the selected native target. Record the approved source and project owner, not the file’s credential contents in a handover page.
- OAuth client IDs must match package/bundle identity and Android signing fingerprints where applicable.
- Store products, subscription groups/offers, sandbox testers, receipt verification and signing profiles need explicit console access.
- Android signing keystores, iOS distribution certificates/profiles, upload/service-account credentials and CI secrets need named owners and recovery procedures.
- Firebase rules/indexes/Remote Config, attribution, geocoding/maps and any separate expert service have their own deployment/access ownership.

## Configuration acceptance check

- [ ] Incoming owner obtains values from approved storage rather than a chat/log screenshot.
- [ ] Dev and prod API origins, package/bundle identifiers and Firebase projects agree.
- [ ] Sign-in, identify, one saved record, enabled map/location features, push and sandbox purchase/restore work on the selected build.
- [ ] Secret values are absent from docs, screenshots, tickets and ordinary debug logs.
- [ ] Credential restrictions, billing owner, rotation process and recovery owner are recorded in [the access checklist](HANDOVER_60_DAYS.md).

## Explore location search recovery — 2026-11-04

Explore previously refused to search when `GEOCODING_API_KEY` was blank, even with a working `MAPBOX_ACCESS_TOKEN`. Forward suggestions now prefer the configured geocode.maps.co provider when its base URL and key are present; otherwise they use Mapbox Geocoding v6 with the existing public token. This follows Plantzy's configured-provider/fallback approach while retaining Explore's cancellation and debounce. No active environment values, variable names or loading rules changed; existing blank templates already include both keys.

Mapbox requests start after three characters and 300 ms without edits, with provider pacing and a 12-second timeout. Temporary Mapbox suggestions are not cached or persisted. Provider failures remain visible; an invalid configured primary key does not silently switch providers. Reverse lookup still requires the original geocoding provider. Search uses HTTP and works independently of the native Mapbox module; the interactive map still requires a native rebuild.

Selection now protects the chosen label from delayed blur callbacks. Validate on iOS and Android: type a city, choose a result with the keyboard open, confirm nearby results and map center update, clear/retype, and repeat in the expanded map. Live token check returned HTTP 200 with five Chennai features; device interaction remains unverified.

## iOS pod compatibility — 2026-11-04

The Podfile post-install hook raises pod deployment targets below React Native's minimum to that minimum (currently iOS 15.1), including privacy/resource targets. Higher declared targets are preserved. This fixes modern Xcode rejecting inherited iOS 8–13 targets. Regenerate with `npm run pod:install`; do not hand-edit generated Pods projects. No environment keys changed.

## eMudhra native SDK pin — 2026-11-04

The iOS Podfile selects the compatible Firebase 12.19 base and explicitly pins Firestore 12.19.3. This adds no environment variable or credential. See [the remediation guide](../firebase-emudhra.md) for the component-version distinction and native installation checks.
