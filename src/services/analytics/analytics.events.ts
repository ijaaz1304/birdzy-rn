/**
 * Single analytics event catalog (root level).
 * All event names are snake_case constants.
 * Use params instead of multiple similar event names (e.g. source, collection_type).
 * Covers 100+ performance analytics events per product spec.
 */

export const EVENTS = {
  // ----- App lifecycle -----
  app_open: "app_open",
  app_open_android: "app_open_android",
  first_open: "first_open",
  /** Custom GA4 event — Firebase reserves `first_open` and drops custom logs of that name. */
  app_first_open: "app_first_open",

  // ----- Auth -----
  login: "login",
  login_failed: "login_failed",
  registration: "registration",
  registration_failed: "registration_failed",
  guest_login: "guest_login",
  /** First-time guest account created (once per guest id) */
  guest_signup_success: "guest_signup_success",
  /** Email / SSO signup or login with unified payload (signup once; returning users use `login` only) */
  unified_auth_success: "unified_auth_success",
  /** Firebase/GA4: explicit signup completion (logged with unified_auth_success on signup) */
  signup_success: "signup_success",
  logout: "logout",

  // ----- Deep linking -----
  deep_link_received: "deep_link_received",
  deep_link_applied: "deep_link_applied",
  deep_link_skipped: "deep_link_skipped",

  // ----- Screen (spec screen events + generic) -----
  screen_view: "screen_view",
  homescreen: "homescreen",
  collection_screen: "collection_screen",
  identification_screen: "identification_screen",
  feed_screen: "feed_screen",
  ask_ai_screen: "ask_ai_screen",
  ask_ai_banner_clicked: "ask_ai_banner_clicked",
  ask_ai_message_sent: "ask_ai_message_sent",
  ask_ai_image_uploaded: "ask_ai_image_uploaded",
  ask_ai_camera_used: "ask_ai_camera_used",
  ask_ai_response_success: "ask_ai_response_success",
  ask_ai_response_fail: "ask_ai_response_fail",
  ask_ai_limit_reached: "ask_ai_limit_reached",
  subscription_screen: "subscription_screen",
  settings_screen: "settings_screen",
  global_catalogue_screen: "global_catalogue_screen",
  bird_of_the_day_screen: "bird_of_the_day_screen",
  login_screen: "login_screen",

  // ----- Session -----
  app_session_start: "app_session_start",
  session_end: "session_end",
  time_spent_screen: "time_spent_screen",
  feature_error: "feature_error",
  app_open_day_1: "app_open_day_1",
  app_open_day_7: "app_open_day_7",
  app_open_day_30: "app_open_day_30",

  // ----- Identify flow -----
  identify_click: "identify_click",
  identify_photo: "identify_photo",
  identify_result: "identify_result",
  identify_camera_opened: "identify_camera_opened",
  identify_image_captured: "identify_image_captured",
  identify_image_uploaded: "identify_image_uploaded",
  identify_result_success: "identify_result_success",
  identify_result_fail: "identify_result_fail",
  // Spec identification flow names (aliases / additional)
  camera_permission_popup: "camera_permission_popup",
  camera_permission_granted: "camera_permission_granted",
  camera_permission_denied: "camera_permission_denied",
  photo_clicked: "photo_clicked",
  photo_uploaded: "photo_uploaded",
  photo_submitted: "photo_submitted",
  identification_done_success: "identification_done_success",
  identification_done_failure: "identification_done_failure",
  identification_limit_exceeded: "identification_limit_exceeded",
  identification_details_screen: "identification_details_screen",
  identification_view_all: "identification_view_all",
  identification_all_options_screen: "identification_all_options_screen",
  identification_option_chosen: "identification_option_chosen",
  photo_screen: "photo_screen",
  photo_cropping_screen: "photo_cropping_screen",
  photo_crop_tick: "photo_crop_tick",
  photo_submit_button: "photo_submit_button",

  // ----- Bottom nav & homepage buttons -----
  identify_bottom_nav: "identify_bottom_nav",
  feed_bottom_nav: "feed_bottom_nav",
  home_bottom_nav: "home_bottom_nav",
  global_catalogue_bottom_nav: "global_catalogue_bottom_nav",
  private_collection_bottom_nav: "private_collection_bottom_nav",
  subs_discount_banner: "subs_discount_banner",
  view_all_button_global: "view_all_button_global",
  our_other_app_view_all: "our_other_app_view_all",
  get_app: "get_app",
  go_pro_button: "go_pro_button",
  bird_of_day_button: "bird_of_day_button",

  // ----- Bird of the day -----
  bird_of_the_day_preview: "bird_of_the_day_preview",
  bird_of_the_day_refresh_preview: "bird_of_the_day_refresh_preview",
  bird_of_the_day_refresh_more_details: "bird_of_the_day_refresh_more_details",
  refresh_button_bird_of_day: "refresh_button_bird_of_day",
  bird_of_the_day_seen_streak: "bird_of_the_day_seen_streak",

  // ----- Collection (private) -----
  collection_action: "collection_action",
  collection_clicked: "collection_clicked",
  sub_collection_screen: "sub_collection_screen",
  sub_collection_item: "sub_collection_item",
  filter_sub_collection: "filter_sub_collection",
  filter_field_selected_collection: "filter_field_selected_collection",

  // ----- Global catalogue -----
  global_catalogue_item: "global_catalogue_item",
  filter_global_catalogue: "filter_global_catalogue",
  filter_field_selected_catalogue: "filter_field_selected_catalogue",
  search_used: "search_used",
  content_share_success: "content_share_success",
  content_share_cancelled: "content_share_cancelled",

  // ----- Bird detail -----
  bird_view: "bird_view",
  bird_edit: "bird_edit",

  // ----- Filters (generic) -----
  filter_applied: "filter_applied",

  // ----- Limits -----
  limit_reached: "limit_reached",

  // ----- Subscription -----
  subscription_page_view: "subscription_page_view",
  subscription_pack_click: "subscription_pack_click",
  subscription_confirm: "subscription_confirm",
  subscription_restore: "subscription_restore",
  subscription_cancel: "subscription_cancel",
  subscription_fail: "subscription_fail",
  subscription_discount: "subscription_discount",
  subs_pack: "subs_pack",
  subs_button: "subs_button",
  subs_native: "subs_native",
  subs_confirm: "subs_confirm",
  subs_cancel: "subs_cancel",
  subs_fail: "subs_fail",
  subs_screen_viewed: "subs_screen_viewed",
  subs_plan_viewed: "subs_plan_viewed",
  subs_payment_initiated: "subs_payment_initiated",
  /** Non-trial paid purchase (GA4-style `value`, `currency`, `transaction_id`, etc.) */
  paid_purchase: "paid_purchase",
  /** Same payload as `paid_purchase`; duplicate event name for GA4 / BigQuery revenue funnels. */
  paid_purchase_ga4: "paid_purchase_ga4",
  /** Trial start (parity with native) */
  trial_purchase: "trial_purchase",
  /** Exact name used on native Android for funnel compatibility */
  trial_started: "Trial_started",
  /** Fired when a trial converts to paid (same product as prior `Trial_started`) */
  trial_converted: "Trial_converted",

  // ----- Feed -----
  feed_view: "feed_view",
  feed_tab_changed: "feed_tab_changed",
  feed_add: "feed_add",
  feed_like: "feed_like",
  feed_comment: "feed_comment",
  time_spent_feed: "time_spent_feed",
  feed_post: "feed_post",
  post_viewed: "post_viewed",
  post_image_selected: "post_image_selected",
  post_created: "post_created",
  post_created_success: "post_created_success",
  post_updated: "post_updated",
  post_deleted: "post_deleted",
  post_liked: "post_liked",
  post_unliked: "post_unliked",
  post_hidden: "post_hidden",
  post_reported: "post_reported",
  posts_viewed: "posts_viewed",
  posts_fetch_error: "posts_fetch_error",
  community_rules_agreed: "community_rules_agreed",

  // ----- Rate us -----
  rate_us_popup: "rate_us_popup",
  rate_us_rate_now: "rate_us_rate_now",
  rate_us_not_now: "rate_us_not_now",
  rate_us_feedback: "rate_us_feedback",
  user_closes: "user_closes",
  rate_1_3: "rate_1_3",
  rate_4_5: "rate_4_5",
  native_rate_open: "native_rate_open",
  native_rate_give: "native_rate_give",
  feedback_popup_opened: "feedback_popup_opened",
  feedback_submitted: "feedback_submitted",
  feedback_closed: "feedback_closed",

  // ----- Notification permission -----
  notification_permission_granted: "notification_permission_granted",
  notification_permission_denied: "notification_permission_denied",
  notification_permission_dismissed: "notification_permission_dismissed",
  notification_received: "notification_received",
  notification_opened: "notification_opened",
  notif_popup: "notif_popup",
  permission_given: "permission_given",
  permission_denied: "permission_denied",
  permission_closed: "permission_closed",
  native_permission: "native_permission",
  native_permission_given: "native_permission_given",
  native_permission_denied: "native_permission_denied",
  native_permission_closed: "native_permission_closed",

  // ----- Session & popups -----
  session_incremented: "session_incremented",
  session_length: "session_length",
  subscription_modal_shown: "subscription_modal_shown",
  subscription_modal_dismissed: "subscription_modal_dismissed",
  subscription_modal_cta_click: "subscription_modal_cta_click",
  notification_modal_shown: "notification_modal_shown",
  notification_modal_dismissed: "notification_modal_dismissed",
  bird_of_day_popup_shown: "bird_of_day_popup_shown",
  bird_of_day_popup_dismissed: "bird_of_day_popup_dismissed",
  identification_limit_reached: "identification_limit_reached",
  identification_limit_upgrade_click: "identification_limit_upgrade_click",
  identify_banner: "identify_banner",
  version_update_modal_shown: "version_update_modal_shown",

  // ----- Which bird are you (Quiz) -----
  quiz_started: "quiz_started",
  quiz_question_answered: "quiz_question_answered",
  quiz_completed: "quiz_completed",
  quiz_result_view: "quiz_result_view",
  quiz_result_shared: "quiz_result_shared",
  quiz_restarted: "quiz_restarted",
  quiz_view_bird_details: "quiz_view_bird_details",
  quiz_abandoned: "quiz_abandoned",
  which_bird_banner: "which_bird_banner",
  which_bird_screen_1: "which_bird_screen_1",
  which_bird_screen_1_answer: "which_bird_screen_1_answer",
  which_bird_screen_2: "which_bird_screen_2",
  which_bird_screen_2_answer: "which_bird_screen_2_answer",
  which_bird_screen_3: "which_bird_screen_3",
  which_bird_screen_3_answer: "which_bird_screen_3_answer",
  which_bird_screen_4: "which_bird_screen_4",
  which_bird_screen_4_answer: "which_bird_screen_4_answer",
  which_bird_screen_answer: "which_bird_screen_answer",
  which_bird_share: "which_bird_share",

  // ----- Storage -----
  image_uploaded: "image_uploaded",
  image_deleted: "image_deleted",

  // ----- Pack purchase (canonical GA4 names) -----
  yearly_pack_birdzy: "yearly_pack_birdzy",
  weekly_pack_birdzy: "weekly_pack_birdzy",
  lifetime_pack_birdzy: "lifetime_pack_birdzy",

  // ----- Collection CRUD / wishlist -----
  create_collection: "create_collection",
  rename_collection: "rename_collection",
  delete_collection: "delete_collection",
  added_to_wishlist: "added_to_wishlist",
  remove_wishlist: "remove_wishlist",
  delete_wishlist: "delete_wishlist",

  // ----- Theme / appearance experiment -----
  theme_experiment_variant_assigned: "theme_experiment_variant_assigned",
  theme_default_applied: "theme_default_applied",
  appearance_settings_opened: "appearance_settings_opened",
  theme_changed: "theme_changed",
  theme_mode_changed: "theme_mode_changed",
  experiment_exposure: "experiment_exposure",

  // ----- Errors -----
  error_occurred: "error_occurred",
  api_error: "api_error",
} as const;

export type AnalyticsEventName = (typeof EVENTS)[keyof typeof EVENTS];
