# Firebase Setup — Shroom AI

This document describes the Firebase configuration in this repo: which projects we use, which services are enabled, which JSON files belong in the app vs. which get deployed to Firebase, and how analytics events work.

---

## Firebase projects

| Environment | Firebase project ID | Android package | iOS bundle ID |
|-------------|---------------------|-----------------|---------------|
| **Dev** | `mushrooms-app-dev` | `com.trackzio.birds.dev` | `com.trackzio.birds.dev` |
| **Prod** | `mushrooms-app-dfdc5` | `com.trackzio.birds` | `com.trackzio.birds` |

Project aliases are defined in `.firebaserc`:

```json
{
  "projects": {
    "default": "mushrooms-app-dev",
    "dev": "mushrooms-app-dev",
    "prod": "mushrooms-app-dfdc5"
  }
}
```

---

## Services in use

| Service | Package | Purpose |
|---------|---------|---------|
| **App** | `@react-native-firebase/app` | Core SDK; auto-init from native config |
| **Analytics** | `@react-native-firebase/analytics` | Event tracking, user properties, GA4 |
| **Crashlytics** | `@react-native-firebase/crashlytics` | Crash reporting (prod only) |
| **Firestore** | `@react-native-firebase/firestore` | Community feed (posts, comments, notifications) |
| **Storage** | `@react-native-firebase/storage` | Feed post images |
| **Remote Config** | `@react-native-firebase/remote-config` | Feature flags, limits, URLs, timing |
| **Performance** | `@react-native-firebase/perf` | Custom traces |
| **Messaging (FCM)** | `@react-native-firebase/messaging` | Push notifications |

Initialization lives in `src/lib/firebase/config.ts` and is called from `App.tsx`.

### Behavior by environment

- **Analytics**: enabled in dev and prod.
- **Crashlytics**: disabled in `__DEV__`, enabled in release/prod builds.
- **Panic guard**: if a `.dev` bundle connects to the **prod** Firebase project, the app throws at startup (prevents polluting prod with dev traffic).

---

## Native app config (download from Firebase Console)

These files are **not uploaded to Firebase**. You download them from [Firebase Console](https://console.firebase.google.com) → Project settings → Your apps, then place them in the repo.

### Android — `google-services.json`

| Flavor | Path | Package name |
|--------|------|--------------|
| Dev | `android/app/src/dev/google-services.json` | `com.trackzio.birds.dev` |
| Prod | `android/app/src/prod/google-services.json` | `com.trackzio.birds` |

Gradle applies the Google Services plugin in `android/app/build.gradle`:

```gradle
apply plugin: "com.google.gms.google-services"
apply plugin: "com.google.firebase.crashlytics"
```

Product flavors (`dev` / `prod`) pick the matching `google-services.json` automatically via the `src/<flavor>/` source set.

**When to re-download:** new SHA-1/SHA-256 added (Google Sign-In), new Android app registered, or project changed.

### iOS — `GoogleService-Info.plist`

| Environment | Source file | Copied at build time to |
|-------------|-------------|-------------------------|
| Dev | `ios/Birdzy/GoogleService-Info-Dev.plist` | `GoogleService-Info.plist` in app bundle |
| Prod | `ios/Birdzy/GoogleService-Info.plist` | same |

An Xcode build phase copies the correct plist for `Debug-Dev` / `Release-Dev` vs prod configurations.

**When to re-download:** new iOS app, bundle ID change, or project changed.

---

## JSON / config files to deploy **to** Firebase

These live in the repo root and are referenced by `firebase.json`. Deploy with Firebase CLI (see commands below).

### 1. Remote Config — `remoteconfig.template.json`

**This is the main “config JSON” to upload.**

Contains tunable app parameters (limits, delays, store URLs, feature flags). Examples:

| Parameter | Type | Purpose |
|-----------|------|---------|
| `freeUserDailyScanLimit` | NUMBER | Daily scan cap for free users |
| `freeUserDailyFeedPostLimit` | NUMBER | Daily feed post cap |
| `subscription50OfferEndTs` | NUMBER | Unix ms; `0` = 50% offer off |
| `androidPlayStoreUrl` / `iosAppStoreUrl` | STRING | Store links for share / rate |
| `quizEnabled` | NUMBER | Quiz feature toggle |
| `darkModeEnabled` | BOOLEAN | Dark mode master flag |
| `theme_default` | STRING | Dark mode A/B: `system` / `variant_a` = follow device + Appearance; `light` / `variant_b` = lock light, hide Appearance |

Defaults are also mirrored in `src/services/remoteConfig/remoteConfig.service.ts` so the app works offline before the first fetch.

**Pull from Firebase (do this before push if you see `412 VERSION_MISMATCH`):**

```bash
npm run remoteconfig:pull:dev    # mushrooms-app-dev
npm run remoteconfig:pull:prod   # mushrooms-app-dfdc5
```

**Push to Firebase:**

```bash
npm run remoteconfig:push:dev    # mushrooms-app-dev
npm run remoteconfig:push:prod   # mushrooms-app-dfdc5
npm run remoteconfig:push:all    # both
```

Edit `remoteconfig.template.json` locally, then run the push script. Firebase Console → Remote Config will show the updated template.

**`412 VERSION_MISMATCH`:** Someone updated Remote Config in the Firebase Console (or another machine pushed) so the server version is newer than your local template. Run `remoteconfig:pull:*` for the affected project, re-apply your edits if needed, then push again.

### 2. Firestore indexes — `firestore.indexes.json`

Composite indexes for feed queries (posts by user, comments by post, notifications by user, etc.).

**Deploy:**

```bash
npm run firebase:deploy:dev:indexes
npm run firebase:deploy:prod:indexes
```

### 3. Security rules (not JSON, but deployed together)

| File | Service |
|------|---------|
| `firestore.rules` | Firestore (posts, comments, replies, notifications, reports) |
| `storage.rules` | Storage (`/posts/{postId}/**` public read/write) |

**Deploy rules only:**

```bash
npm run firebase:deploy:dev:rules
npm run firebase:deploy:prod:rules
npm run firebase:deploy:all:rules
```

### 4. Hosting — `hosting/public/`

Used for deep linking assets (`.well-known/apple-app-site-association`, `assetlinks.json`). Configured in `firebase.json`.

**Full deploy (hosting + rules + indexes + remote config):**

```bash
npm run firebase:deploy:dev
npm run firebase:deploy:prod
npm run firebase:deploy:all
```

### 5. Project manifest — `firebase.json`

Maps local files to Firebase services. You normally edit the source files above, not `firebase.json` itself:

```json
{
  "hosting": { "public": "hosting/public", ... },
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
  "storage": { "rules": "storage.rules" },
  "remoteconfig": { "template": "remoteconfig.template.json" }
}
```

---

## Analytics events — no JSON upload

**There is no events JSON file to upload to Firebase.**

Events are defined in code and sent at runtime via the Firebase Analytics SDK.

| What | Where |
|------|-------|
| Event name catalog | `src/services/analytics/analytics.events.ts` |
| Single logging entry point | `src/services/analytics/analytics.service.ts` |
| Screen tracking | `src/services/analytics/useScreenTracking.ts` |
| Install attribution events | `src/services/attribution/attributionManager.ts`, `src/services/analytics/attributionAnalytics.ts` |

### How events reach Firebase

1. App calls `analyticsService.logEvent(EVENTS.some_event, { ...params })`.
2. `firebaseAnalytics.logEvent()` in `src/lib/firebase/config.ts` forwards to `@react-native-firebase/analytics`.
3. Events appear in **Firebase Console → Analytics → Events** (and GA4) after processing (can take up to 24 hours for some reports).

### Event catalog (from `analytics.events.ts`)

Events in the main catalog (`analytics.events.ts`), plus **5 attribution-only events** logged from `attributionManager.ts` / `attributionAnalytics.ts` (see below).

#### App lifecycle (3)

`app_open`, `app_open_android`, `first_open`

#### Auth (9)

`login`, `login_failed`, `registration`, `registration_failed`, `guest_login`, `guest_signup_success`, `unified_auth_success`, `signup_success`, `logout`

#### Screens (13)

`screen_view`, `homescreen`, `collection_screen`, `identification_screen`, `feed_screen`, `ask_ai_screen`, `subscription_screen`, `settings_screen`, `global_catalogue_screen`, `mushroom_of_the_day_screen`, `login_screen`

#### Ask AI (8)

`ask_ai_banner_clicked`, `ask_ai_message_sent`, `ask_ai_image_uploaded`, `ask_ai_camera_used`, `ask_ai_response_success`, `ask_ai_response_fail`, `ask_ai_limit_reached`

#### Session (7)

`app_session_start`, `session_end`, `time_spent_screen`, `feature_error`, `app_open_day_1`, `app_open_day_7`, `app_open_day_30`

#### Identify flow (26)

`identify_click`, `identify_photo`, `identify_result`, `identify_camera_opened`, `identify_image_captured`, `identify_image_uploaded`, `identify_result_success`, `identify_result_fail`, `camera_permission_popup`, `camera_permission_granted`, `camera_permission_denied`, `photo_clicked`, `photo_uploaded`, `photo_submitted`, `identification_done_success`, `identification_done_failure`, `identification_limit_exceeded`, `identification_details_screen`, `identification_view_all`, `identification_all_options_screen`, `identification_option_chosen`, `photo_screen`, `photo_cropping_screen`, `photo_crop_tick`, `photo_submit_button`

#### Bottom nav & homepage (11)

`identify_bottom_nav`, `feed_bottom_nav`, `home_bottom_nav`, `global_catalogue_bottom_nav`, `private_collection_bottom_nav`, `subs_discount_banner`, `view_all_button_global`, `our_other_app_view_all`, `get_app`, `go_pro_button`, `mushroom_of_day_button`

#### Mushroom of the day (6)

`mushroom_of_the_day_preview`, `mushroom_of_the_day_refresh_preview`, `mushroom_of_the_day_refresh_more_details`, `refresh_button_mushroom_of_day`, `mushroom_of_the_day_seen_streak`

#### Collection (6)

`collection_action`, `collection_clicked`, `sub_collection_screen`, `sub_collection_item`, `filter_sub_collection`, `filter_field_selected_collection`

#### Global catalogue (5)

`global_catalogue_item`, `filter_global_catalogue`, `filter_field_selected_catalogue`, `search_used`, `content_share_success`, `content_share_cancelled`

#### Mushroom (2)

`mushroom_view`, `mushroom_edit`

#### Filters & limits (2)

`filter_applied`, `limit_reached`

#### Subscription (22)

`subscription_page_view`, `subscription_pack_click`, `subscription_confirm`, `subscription_restore`, `subscription_cancel`, `subscription_fail`, `subscription_discount`, `subs_pack`, `subs_button`, `subs_native`, `subs_confirm`, `subs_cancel`, `subs_fail`, `subs_screen_viewed`, `subs_plan_viewed`, `subs_payment_initiated`, `paid_purchase`, `paid_purchase_ga4`, `trial_purchase`, `Trial_started`, `Trial_converted`

#### Feed (18)

`feed_view`, `feed_tab_changed`, `feed_add`, `feed_like`, `feed_comment`, `time_spent_feed`, `feed_post`, `post_viewed`, `post_image_selected`, `post_created`, `post_created_success`, `post_updated`, `post_deleted`, `post_liked`, `post_unliked`, `post_hidden`, `post_reported`, `posts_viewed`, `posts_fetch_error`, `community_rules_agreed`

#### Rate us (12)

`rate_us_popup`, `rate_us_rate_now`, `rate_us_not_now`, `rate_us_feedback`, `user_closes`, `rate_1_3`, `rate_4_5`, `native_rate_open`, `native_rate_give`, `feedback_popup_opened`, `feedback_submitted`, `feedback_closed`

#### Notification permission (14)

`notification_permission_granted`, `notification_permission_denied`, `notification_permission_dismissed`, `notification_received`, `notification_opened`, `notif_popup`, `permission_given`, `permission_denied`, `permission_closed`, `native_permission`, `native_permission_given`, `native_permission_denied`, `native_permission_closed`

#### Session & popups (12)

`session_incremented`, `session_length`, `subscription_modal_shown`, `subscription_modal_dismissed`, `subscription_modal_cta_click`, `notification_modal_shown`, `notification_modal_dismissed`, `mushroom_of_day_popup_shown`, `mushroom_of_day_popup_dismissed`, `identification_limit_reached`, `identification_limit_upgrade_click`, `identify_banner`, `version_update_modal_shown`

#### Quiz — Which mushroom are you (19)

`quiz_started`, `quiz_question_answered`, `quiz_completed`, `quiz_result_view`, `quiz_result_shared`, `quiz_restarted`, `quiz_view_mushroom_details`, `quiz_abandoned`, `which_mushroom_banner`, `which_mushroom_screen_1`, `which_mushroom_screen_1_answer`, `which_mushroom_screen_2`, `which_mushroom_screen_2_answer`, `which_mushroom_screen_3`, `which_mushroom_screen_3_answer`, `which_mushroom_screen_4`, `which_mushroom_screen_4_answer`, `which_mushroom_screen_answer`, `which_mushroom_share`

#### Storage (2)

`image_uploaded`, `image_deleted`

#### Theme / appearance experiment (6)

`theme_experiment_variant_assigned`, `theme_default_applied`, `appearance_settings_opened`, `theme_changed`, `theme_mode_changed`, `experiment_exposure`

#### Errors (3)

`error_occurred`, `api_error`

#### Install attribution — Android only (5, not in `EVENTS`)

Logged as string literals from `src/services/attribution/attributionManager.ts` and `src/services/analytics/attributionAnalytics.ts`:

`install_attribution`, `install_referrer_received`, `meta_referrer_received`, `install_campaign_attributed`, `install_referrer_error`

### Adding a new event

1. Add a constant to `EVENTS` in `src/services/analytics/analytics.events.ts`.
2. Call `analyticsService.logEvent(EVENTS.your_event, { param: "value" })` from the feature.
3. Keep string param values ≤ 100 characters (truncated automatically in `config.ts`).
4. No Firebase CLI deploy needed — ship an app update.
5. Optional: in GA4, mark key events as conversions or register custom dimensions for new params.

### Common event params (auto-attached)

`analytics.service.ts` adds context to many events:

- `date`, `time`, `user_id`, `country`, `platform`

Attribution events also include fields like `attribution_confidence`, `meta_source`, `utm_source`, etc.

---

## Code map

```
src/lib/firebase/
  config.ts          # Init, Analytics, Remote Config, Firestore, Crashlytics, Perf
  index.ts           # Re-exports

src/services/
  analytics/         # Event catalog + analyticsService
  remoteConfig/      # Remote Config fetch, cache, getters
  firebase/          # Firestore feed + Storage uploads
  attribution/       # Install referrer → Firebase events

Root deploy files:
  firebase.json
  .firebaserc
  remoteconfig.template.json
  firestore.rules
  firestore.indexes.json
  storage.rules

Native config (from Console):
  android/app/src/dev/google-services.json
  android/app/src/prod/google-services.json
  ios/Birdzy/GoogleService-Info.plist
  ios/Birdzy/GoogleService-Info-Dev.plist
```

---

## Quick reference — what goes where

| File / action | Direction | When |
|---------------|-----------|------|
| `google-services.json` / `GoogleService-Info*.plist` | **Download** from Console → place in repo | New app, new signing cert SHA |
| `remoteconfig.template.json` | **Upload** via `remoteconfig:push:*` | Change limits, flags, URLs |
| `firestore.indexes.json` | **Upload** via `firebase:deploy:*:indexes` | New composite queries |
| `firestore.rules` / `storage.rules` | **Upload** via `firebase:deploy:*:rules` | Security rule changes |
| Analytics events | **Code only** — no JSON deploy | New tracking in app releases |
| `hosting/public/*` | **Upload** via full `firebase:deploy:*` | Deep link / AASA updates |

---

## Prerequisites for deploy

1. Firebase CLI (scripts use `npx firebase-tools@latest`).
2. Logged in: `npx firebase-tools@latest login`
3. Correct project: scripts call `firebase use dev` or `firebase use prod` automatically.

---

## Related docs

- `docs/ENV_SETUP.md` — `.env.dev` / `.env.prod` and `APP_ENV`
- `docs/GOOGLE_SIGNIN_TROUBLESHOOTING.md` — SHA-1 and `google-services.json` issues
- `docs/CI_CD_SETUP.md` — release signing and Firebase SHA alignment


## Background and cold-start remote push

See [the remote push setup and device QA notes](handover/QA_AND_OPERATIONS.md#remote-push-in-background-and-after-app-exit) for payload, signing and routing checks.
