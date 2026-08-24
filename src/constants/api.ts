/**
 * API Endpoints Constants
 * All API endpoint paths - no hardcoded values
 * Following banknote app pattern
 */

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    REFRESH_TOKEN: "/auth/refresh-auth-token",
    SOCIAL_LOGIN_GOOGLE: "/auth/social-login/google",
    SOCIAL_LOGIN_APPLE: "/auth/social-login/apple",
    GUEST_LOGIN: "/auth/guest-login",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    GET_PROFILE: "/auth/me",
    UPDATE_PROFILE: "/auth/me",
    DELETE_PROFILE: "/auth/me",
    RESEND_VERIFICATION: "/auth/resend-verification-mail",
    GET_REFERRALS: "/auth/referrals",
    USE_REFERRAL: "/auth/referrals",
    SUBSCRIBE_GOOGLE: "/auth/subscribe/google",
    UNSUBSCRIBE_GOOGLE: "/auth/unsubscribe/google",
    SUBSCRIBE_APPLE: "/auth/subscribe/apple",
    UNSUBSCRIBE_APPLE: "/auth/unsubscribe/apple",
    PARSE_GOOGLE_TOKEN: "/auth/parse-google-purchasetoken",
  },
  CORE: {
    IDENTIFY: "/core/ai/identify",
    IDENTIFY_SOUND: "/core/ai/identify-sound",
    CHAT: "/core/chat",
    GOT_BITTEN: "/got-bitten",
    /** @deprecated Bird backend returns 500 — use ARCHETYPE_FILTER_ITEMS only. */
    FILTER_ITEMS: "/core/specimen/filteritems",
    SPECIMEN_STATS: "/core/specimen/stats",
    SPECIMEN_DETAILS: "/core/specimen/getDetails",
    SPECIMEN_ADD: "/core/specimen/add",
    SPECIMEN_FETCH_ALL: "/core/specimen/fetchAll",
    SPECIMEN_DELETE: "/core/specimen/delete",
    SPECIMEN_UPDATE: "/core/specimen/update",
    COLLECTION_ADD: "/core/collections/add",
    COLLECTION_LIST: "/core/collections/fetchAll",
    COLLECTION_DETAILS: "/core/collections/getDetails",
    COLLECTION_UPDATE: "/core/collections/update",
    COLLECTION_DELETE: "/core/collections/delete",
    COLLECTION_STATS: "/core/collections/stats",
    WISHLIST_ADD: "/core/archetypes/wishlist/add",
    WISHLIST_REMOVE: "/core/archetypes/wishlist/remove",
    ARCHETYPE_FILTER_ITEMS: "/core/archetypes/filteritems",
    ARCHETYPE_LIST: "/core/archetypes/fetchAll",
    ARCHETYPE_DETAILS: "/core/archetypes/getDetails",
    ARCHETYPE_STATS: "/core/archetypes/stats",
    ARCHETYPE_STEP_BY_STEP: "/core/archetypes/step-by-step",
    ARCHETYPE_IDENTIFIED_ADD: "/core/archetypes/identified/add",
    SPECIMENS_OF_THE_DAY: "/core/archetypes/specimens-of-the-day",
    /** Live Bird dev host serves this under /core (not /gallery/audio). */
    GALLERY_AUDIO: "/core/gallery/audio",
  },
  MAPS: {
    GEOCODE: "/maps/geocode",
    REVERSE_GEOCODE: "/maps/reverse-geocode",
    SEARCH_PLACES: "/maps/places/search",
    STATIC_MAP: "/maps/static",
  },
  NOTIFICATION: {
    REGISTER_DEVICE: "/device",
  },
} as const;
