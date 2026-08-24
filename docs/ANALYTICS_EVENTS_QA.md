# Analytics events — QA test guide

Use this to verify Firebase Analytics in **DebugView**. Event names must match exactly.

**Projects:** `mushrooms-app-dev` (dev build) · `mushrooms-app-dfdc5` (prod)

**Source of truth in code:** `src/services/analytics/analytics.events.ts`

---

## How to test

1. Use a **dev** build (`com.trackzio.birds.dev`).
2. Enable DebugView:
   - **iOS:** Xcode scheme → Arguments → `-FIRAnalyticsDebugEnabled`
   - **Android:** `adb shell setprop debug.firebase.analytics.app com.trackzio.birds.dev`
3. Open Firebase Console → the matching project → **Analytics → DebugView**.
4. Perform the action in the table. Event should appear within a few seconds.
5. The Events list in Console can lag up to 24 hours — **do not use it for live QA**.

Every event also includes: `date`, `time`, `user_id`, `country`, `platform`.

---

## 1. App lifecycle & session

| Event | How to trigger | Notes |
|-------|----------------|-------|
| `app_open` | Cold start / analytics init | Every launch after Firebase is ready |
| `app_open_android` | Same, **Android only** | |
| `first_open` | First launch after install | Once per install (AsyncStorage). Uninstall + reinstall to retest |
| `app_open_day_1` | Open app 1 day after first open | Hard to force; skip unless needed |
| `app_open_day_7` | Open app 7 days after first open | Same |
| `app_open_day_30` | Open app 30 days after first open | Same |
| `app_session_start` | App comes to foreground | Background → foreground |
| `session_end` | App goes to background | Param: `session_duration_seconds` |
| `session_incremented` | Session counter ticks (RootNavigator) | Param: session count |
| `session_length` | Session length logged by performance service | Param: duration |
| `screen_view` | Any tracked screen focus | Param: `screen_name` |
| `time_spent_screen` | Leave a screen | Time spent on previous screen |

---

## 2. Screen views (auto on tab / screen focus)

| Event | How to trigger |
|-------|----------------|
| `homescreen` | Open Home tab |
| `collection_screen` | Open Collection tab |
| `identification_screen` | Open Identify / Camera tab |
| `feed_screen` | Open Feed tab |
| `ask_ai_screen` | Open Ask AI |
| `subscription_screen` | Open paywall / subscription |
| `settings_screen` | Open Settings |
| `global_catalogue_screen` | Open Catalogue |
| `mushroom_of_the_day_screen` | Open Mushroom of the Day |
| `login_screen` | Open Login |

---

## 3. Auth

| Event | How to trigger | Key params |
|-------|----------------|------------|
| `login` | Email, Google, or Apple **returning** login | `type_of_login`: `email` / `google` / `apple` |
| `unified_auth_success` | Successful signup or unified auth | `auth_action`, `method`, `id`, `email` |
| `signup_success` | New account created (with unified auth) | Same payload as signup |
| `guest_signup_success` | First-time guest account created | Once per guest id |
| `login_failed` | — | **Not wired** |
| `registration` | — | **Not wired** (use `signup_success`) |
| `registration_failed` | — | **Not wired** |
| `guest_login` | — | **Not wired** as Firebase event (Meta only) |
| `logout` | — | **Not wired** |

---

## 4. Deep links

| Event | How to trigger | Key params |
|-------|----------------|------------|
| `deep_link_received` | Open `birdzy-dev://…` or HTTPS host | URL / path |
| `deep_link_applied` | Link navigates after auth is ready | |
| `deep_link_skipped` | Link ignored (invalid / not ready) | |

Test URLs: `docs/engineering/developer/14-deep-linking-test-urls.md`

---

## 5. Bottom nav & home buttons

| Event | How to trigger |
|-------|----------------|
| `home_bottom_nav` | Tap Home tab |
| `identify_bottom_nav` | Tap Identify tab |
| `feed_bottom_nav` | Tap Feed tab |
| `global_catalogue_bottom_nav` | Tap Catalogue tab |
| `private_collection_bottom_nav` | Tap Collection tab |
| `go_pro_button` | Home → Go Pro |
| `identify_banner` | Home → Identify banner |
| `subs_discount_banner` | Home → discount banner |
| `which_mushroom_banner` | Home → Which Mushroom quiz banner |
| `ask_ai_banner_clicked` | Home (or identify result) → Ask AI banner |
| `our_other_app_view_all` | Home → Our other apps → View all |
| `get_app` | Other apps screen → Get app | Param: app id |
| `mushroom_of_day_button` | Home → Mushroom of the Day card |
| `view_all_button_global` | — | **Not wired** |

---

## 6. Identify / camera

| Event | How to trigger |
|-------|----------------|
| `identify_click` | Open camera / identify |
| `identify_camera_opened` | Camera preview opens |
| `photo_screen` | Photo capture UI shown |
| `camera_permission_popup` | Camera permission sheet shown |
| `camera_permission_granted` | Allow camera |
| `camera_permission_denied` | — | **Not wired** |
| `photo_clicked` | Take a photo |
| `identify_photo` | Capture or pick photo | `source`: `camera` or `gallery` |
| `identify_image_captured` | Photo taken with camera |
| `photo_uploaded` | Gallery image selected |
| `identify_image_uploaded` | Same (gallery) |
| `photo_submitted` | Confirm crop / submit for ID |
| `identify_result_success` | ID succeeds |
| `identification_done_success` | Same (spec name) |
| `identify_result_fail` | ID fails |
| `identification_done_failure` | Same (spec name) |
| `identification_limit_reached` | Free user hits daily scan cap |
| `identification_limit_exceeded` | Same |
| `identification_limit_upgrade_click` | Limit sheet → Upgrade | `source` e.g. `camera_main` |
| `identification_all_options_screen` | Open other possible matches |
| `identification_option_chosen` | Pick an alternate match |
| `identify_result` | — | **Not wired** (use success/fail) |
| `identification_details_screen` | — | **Not wired** |
| `identification_view_all` | — | **Not wired** |
| `photo_cropping_screen` | — | **Not wired** |
| `photo_crop_tick` | — | **Not wired** |
| `photo_submit_button` | — | **Not wired** (use `photo_submitted`) |

---

## 7. Ask AI

| Event | How to trigger |
|-------|----------------|
| `ask_ai_message_sent` | Send a chat message |
| `ask_ai_response_success` | AI reply succeeds |
| `ask_ai_response_fail` | AI reply fails |
| `ask_ai_limit_reached` | Free user hits Ask AI cap |
| `ask_ai_camera_used` | Attach photo from camera |
| `ask_ai_image_uploaded` | Attach photo from gallery |

---

## 8. Catalogue & search

| Event | How to trigger |
|-------|----------------|
| `global_catalogue_item` | Tap a mushroom in catalogue |
| `filter_global_catalogue` | Open / apply catalogue filters |
| `filter_field_selected_catalogue` | Select a filter field |
| `search_used` | Search in catalogue | Query / source |
| `filter_applied` | — | **Not wired** |

---

## 9. Collection (private)

| Event | How to trigger |
|-------|----------------|
| `collection_clicked` | Open a collection |
| `sub_collection_screen` | Collection details |
| `sub_collection_item` | Tap an item in a collection / wishlist |
| `collection_action` | Add / remove collection action |
| `filter_sub_collection` | Filter inside a collection |
| `filter_field_selected_collection` | Select a collection filter field |
| `mushroom_view` | Open mushroom details |
| `mushroom_edit` | Save edit on mushroom details |

---

## 10. Share

| Event | How to trigger |
|-------|----------------|
| `content_share_success` | Share sheet completes (details, quiz, personality) |
| `content_share_cancelled` | User cancels share |

---

## 11. Mushroom of the Day

| Event | How to trigger |
|-------|----------------|
| `mushroom_of_the_day_preview` | Open preview from home |
| `mushroom_of_the_day_seen_streak` | Streak updates when viewing |
| `mushroom_of_day_popup_shown` | Auto popup on home (session rules) |
| `mushroom_of_day_popup_dismissed` | Close the popup |
| `mushroom_of_the_day_refresh_preview` | Refresh on preview |
| `refresh_button_mushroom_of_day` | Same refresh tap |
| `mushroom_of_the_day_refresh_more_details` | Refresh on details screen |

---

## 12. Subscription / IAP

| Event | How to trigger |
|-------|----------------|
| `subs_screen_viewed` | Open paywall |
| `subs_button` | Tap a plan CTA | `plan_id` |
| `subs_native` | Native purchase sheet opens |
| `subs_payment_initiated` | Purchase started |
| `subs_confirm` | Purchase succeeds |
| `subs_cancel` | User cancels purchase |
| `subs_fail` | Purchase fails |
| `trial_purchase` | Trial starts |
| `Trial_started` | Same (native Android name — capital T) |
| `paid_purchase` | Paid (non-trial) purchase | `value`, `currency`, `transaction_id` |
| `paid_purchase_ga4` | Duplicate of paid purchase for GA4 |
| `Trial_converted` | Trial converts to paid |
| `subscription_modal_shown` | Home session subscription popup |
| `limit_reached` | — | **Not wired** (use identify/ask-ai limit events) |
| `subscription_page_view` | — | **Not wired** (use `subs_screen_viewed`) |
| `subscription_pack_click` | — | **Not wired** (use `subs_button`) |
| `subscription_confirm` | — | **Not wired** (use `subs_confirm`) |
| `subscription_restore` | — | **Not wired** |
| `subscription_cancel` | — | **Not wired** (use `subs_cancel`) |
| `subscription_fail` | — | **Not wired** (use `subs_fail`) |
| `subscription_discount` | — | **Not wired** |
| `subs_pack` | — | **Not wired** |
| `subs_plan_viewed` | — | **Not wired** |
| `subscription_modal_dismissed` | — | **Not wired** |
| `subscription_modal_cta_click` | — | **Not wired** |

---

## 13. Feed / community

| Event | How to trigger |
|-------|----------------|
| `feed_tab_changed` | Switch For you / Following (etc.) | `tab` |
| `post_viewed` | A post is viewed | `post_id` |
| `posts_viewed` | Feed list fetched | |
| `posts_fetch_error` | Feed fetch fails | |
| `post_image_selected` | Pick image when creating a post |
| `post_created` | Post written to backend |
| `feed_add` | Same |
| `feed_post` | Same |
| `post_created_success` | Create-post UI success |
| `post_updated` | Edit a post |
| `post_deleted` | Delete a post |
| `post_liked` | Like a post |
| `feed_like` | Same |
| `post_unliked` | Unlike |
| `feed_comment` | Open / add comment | `post_id` |
| `post_hidden` | Hide a post |
| `post_reported` | Report a post |
| `community_rules_agreed` | Accept community rules |
| `time_spent_feed` | Leave feed | Duration |
| `feed_view` | — | **Not wired** (use `feed_screen`) |

---

## 14. Rate us & feedback

| Event | How to trigger |
|-------|----------------|
| `rate_us_popup` | Rate-us modal shown | `action`: `shown` |
| `user_closes` | Dismiss rate-us (Not now) |
| `rate_us_not_now` | Same |
| `rate_1_3` | Rate 1–3 stars | `rating` |
| `rate_us_feedback` | Low rating → feedback path |
| `feedback_popup_opened` | Feedback modal opens |
| `feedback_submitted` | Submit feedback |
| `feedback_closed` | Close feedback |
| `rate_4_5` | Rate 4–5 stars | `rating` |
| `rate_us_rate_now` | High rating → store review | `rating` |
| `native_rate_open` | — | **Not wired** |
| `native_rate_give` | — | **Not wired** |

---

## 15. Notifications

| Event | How to trigger |
|-------|----------------|
| `notif_popup` | Notification permission sheet shown |
| `notification_permission_granted` | Allow notifications |
| `permission_given` | Same |
| `notification_permission_denied` | Deny notifications |
| `permission_denied` | Same |
| `permission_closed` | Close permission UI without granting |
| `notification_received` | Push arrives while app can handle it |
| `notification_opened` | Tap a push |
| `notification_permission_dismissed` | — | **Not wired** |
| `notification_modal_shown` | — | **Not wired** |
| `notification_modal_dismissed` | — | **Not wired** |
| `native_permission` | — | **Not wired** |
| `native_permission_given` | — | **Not wired** |
| `native_permission_denied` | — | **Not wired** |
| `native_permission_closed` | — | **Not wired** |

---

## 16. Quiz — Which mushroom are you?

| Event | How to trigger |
|-------|----------------|
| `quiz_started` | Start quiz |
| `which_mushroom_screen_1` | Question 1 shown |
| `which_mushroom_screen_1_answer` | Answer Q1 |
| `which_mushroom_screen_2` | Question 2 shown |
| `which_mushroom_screen_2_answer` | Answer Q2 |
| `which_mushroom_screen_3` | Question 3 shown |
| `which_mushroom_screen_3_answer` | Answer Q3 |
| `which_mushroom_screen_4` | Question 4 shown |
| `which_mushroom_screen_4_answer` | Answer Q4 |
| `quiz_question_answered` | Any answer | Question index |
| `quiz_completed` | Finish quiz |
| `quiz_result_view` | Result screen |
| `which_mushroom_screen_answer` | Result (spec name) |
| `quiz_result_shared` | Share result |
| `which_mushroom_share` | Same |
| `quiz_restarted` | Restart quiz |
| `quiz_view_mushroom_details` | Open species from result |
| `quiz_abandoned` | Leave quiz before finish |

---

## 17. Theme / dark mode experiment

Detail: `docs/THEME_EXPERIMENT_EVENTS.md`

| Event | How to trigger |
|-------|----------------|
| `theme_experiment_variant_assigned` | Cold start |
| `experiment_exposure` | Same | `experiment_id` = `dark_mode_test` |
| `theme_default_applied` | RC theme applied on start |
| `appearance_settings_opened` | Settings → Appearance (Variant A only) |
| `theme_changed` | Pick Light / Dark / System |
| `theme_mode_changed` | Same switch |

User properties: `theme_exp_variant`, `theme_default`, `theme_mode`.

Variant B (`theme_default` = `light`): Appearance is hidden — appearance events will **not** fire.

---

## 18. Version, storage, errors

| Event | How to trigger |
|-------|----------------|
| `version_update_modal_shown` | Force-update / version modal (Remote Config) |
| `image_uploaded` | Image uploaded to Storage (e.g. feed) |
| `image_deleted` | Image deleted from Storage |
| `error_occurred` | Logged error via analytics service | Not a happy-path test |
| `api_error` | API error logger | Same |
| `feature_error` | Feature error logger | Same |

---

## 19. Install attribution (Android only)

Not in the `EVENTS` catalog. First open after Play install.

| Event | How to trigger |
|-------|----------------|
| `install_attribution` | Android install attribution resolved |
| `install_referrer_received` | Play Install Referrer received |
| `meta_referrer_received` | Meta referrer received |
| `install_campaign_attributed` | Campaign mapped |
| `install_referrer_error` | Referrer lookup failed |

---

## Suggested smoke path (one pass)

1. Uninstall → install → open → `first_open`, `app_open`, theme assignment events.
2. Home → each bottom tab → nav + screen events.
3. Identify: allow camera → take photo → submit → success **or** fail.
4. Catalogue → search → tap item → share (success or cancel).
5. Collection → open item → edit.
6. Feed → like, comment, create post (if allowed).
7. Ask AI → send message.
8. Quiz → all 4 answers → result → share or restart.
9. Settings → Appearance (if visible) → change theme.
10. Open paywall → tap a plan (stop before paying unless IAP QA).
11. Rate-us popup (session rules) → Not now **and** 1–3 **and** 4–5 on separate runs.
12. Background the app → `session_end`.

---

## Do not fail QA for these

These names exist in the catalog but are **not logged** today. Use the wired replacement in the same row.

| Catalog name | Use instead |
|--------------|-------------|
| `login_failed`, `registration`, `registration_failed`, `guest_login`, `logout` | `login`, `signup_success`, `unified_auth_success` |
| `identify_result` | `identify_result_success` / `identify_result_fail` |
| `photo_cropping_screen`, `photo_crop_tick`, `photo_submit_button` | `photo_submitted` |
| `identification_details_screen`, `identification_view_all` | mushroom details / other matches events |
| `view_all_button_global` | `our_other_app_view_all` |
| `filter_applied` | `filter_global_catalogue` / `filter_sub_collection` |
| `feed_view` | `feed_screen` |
| `subscription_page_view`, `subs_pack`, `subs_plan_viewed`, `subscription_*` | `subs_screen_viewed`, `subs_button`, `subs_confirm`, `subs_cancel`, `subs_fail` |
| `native_rate_*`, `native_permission_*` | `rate_us_*`, `permission_*` |
| `notification_modal_*`, `notification_permission_dismissed` | `notif_popup`, `permission_closed` |
