/**
 * Environment Constants
 *
 * These constants are loaded from environment variables.
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy .env.example to .env: cp .env.example .env
 * 2. Add your API keys to .env file
 * 3. Install react-native-dotenv: npm install react-native-dotenv
 * 4. Update babel.config.js (see API_SETUP.md)
 *
 * @see API_SETUP.md for complete setup instructions
 * @see .env.example for required environment variables
 */

// Try to import from @env (react-native-dotenv) or use fallback
let envVars: {
  GOOGLE_MAPS_API_KEY?: string;
  GOOGLE_GEOCODING_API_BASE_URL?: string;
  GOOGLE_PLACES_API_BASE_URL?: string;
  GEOCODING_API_BASE_URL?: string;
  GEOCODING_API_KEY?: string;
  API_BASE_URL?: string;
  BIRDS_API_BASE_URL?: string;
  MUSHROOMS_API_BASE_URL?: string;
  MINERALS_API_BASE_URL?: string;
  NOTIFICATION_BASE_URL?: string;
  PUBLISHED_APPS?: string;
  COUNTRIES_JSON?: string;
  ENV?: string;
  APP_CODE?: string;
  GOOGLE_WEB_CLIENT_ID?: string;
  APP_STORE_ID?: string;
  PLAY_STORE_ID?: string;
  SUBSCRIPTION_VALUE?: string;
  RATING_FEEDBACK_API?: string;
  APP_SPECIFIC_SHARED_SECRET?: string;
  /** Apple App Store receipt validation shared secret (password). Use APP_SHARED_SECRET in .env. */
  APP_SHARED_SECRET?: string;
  /** Optional: inbox for App Logs → Email from in-app screen. */
  APP_LOGS_SUPPORT_EMAIL?: string;
  /** When true, enables Settings → Diagnostics in prod builds (local debugging). */
  APP_LOGS_ENABLED?: string;
  FACEBOOK_APP_ID?: string;
  FACEBOOK_CLIENT_TOKEN?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_APP_ID?: string;
} = {};

// SECURITY: Frontend MUST NEVER contain:
// - Any Google Weather credentials

try {
  // Try to import from @env if react-native-dotenv is configured
  const env = require("@env");
  envVars = env;
} catch (e) {
  // Fallback: Use process.env or empty strings
  // In React Native, process.env may not work, so you'll need to set these manually
  // or install react-native-dotenv/react-native-config
  envVars = {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || "",
    GOOGLE_GEOCODING_API_BASE_URL:
      process.env.GOOGLE_GEOCODING_API_BASE_URL ||
      "https://maps.googleapis.com/maps/api",
    GOOGLE_PLACES_API_BASE_URL:
      process.env.GOOGLE_PLACES_API_BASE_URL ||
      "https://maps.googleapis.com/maps/api",
    GEOCODING_API_BASE_URL:
      process.env.GEOCODING_API_BASE_URL || "https://geocode.maps.co",
    GEOCODING_API_KEY: process.env.GEOCODING_API_KEY || "",
    BIRDS_API_BASE_URL:
      process.env.BIRDS_API_BASE_URL ||
      process.env.API_BASE_URL ||
      process.env.MUSHROOMS_API_BASE_URL ||
      "",
    MUSHROOMS_API_BASE_URL:
      process.env.MUSHROOMS_API_BASE_URL ||
      process.env.BIRDS_API_BASE_URL ||
      process.env.API_BASE_URL ||
      "",
    MINERALS_API_BASE_URL:
      process.env.MINERALS_API_BASE_URL ||
      process.env.BIRDS_API_BASE_URL ||
      process.env.MUSHROOMS_API_BASE_URL ||
      process.env.API_BASE_URL ||
      "",
    API_BASE_URL:
      process.env.API_BASE_URL ||
      process.env.BIRDS_API_BASE_URL ||
      process.env.MUSHROOMS_API_BASE_URL ||
      process.env.MINERALS_API_BASE_URL ||
      "",
    NOTIFICATION_BASE_URL:
      process.env.NOTIFICATION_BASE_URL ||
      process.env.API_BASE_URL ||
      "https://notification-service.trackzio.com",
    ENV: process.env.ENV || (__DEV__ ? "development" : "production"),
    APP_CODE:
      process.env.APP_CODE || "",
    PUBLISHED_APPS:
      process.env.PUBLISHED_APPS ||
      "https://progresspal-assets.s3.us-west-2.amazonaws.com/cross-promo-apps/list.json",
    COUNTRIES_JSON:
      process.env.COUNTRIES_JSON ||
      "https://progresspal-assets.s3.us-west-2.amazonaws.com/cross-promo-apps/countries.json",
    GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID || "",
    APP_STORE_ID: process.env.APP_STORE_ID || "",
    PLAY_STORE_ID: process.env.PLAY_STORE_ID || "com.trackzio.birds",
    SUBSCRIPTION_VALUE: process.env.SUBSCRIPTION_VALUE ?? "",
    RATING_FEEDBACK_API:
      process.env.RATING_FEEDBACK_API ||
      "https://msmnafgy53ptj4qqt3oqkk4gpe0pdtic.lambda-url.us-west-2.on.aws/",
    APP_SPECIFIC_SHARED_SECRET: process.env.APP_SPECIFIC_SHARED_SECRET || "",
    APP_SHARED_SECRET:
      process.env.APP_SHARED_SECRET ||
      process.env.APP_SPECIFIC_SHARED_SECRET ||
      "",
    APP_LOGS_SUPPORT_EMAIL: process.env.APP_LOGS_SUPPORT_EMAIL || "",
    APP_LOGS_ENABLED: process.env.APP_LOGS_ENABLED || "",
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || "",
    FACEBOOK_CLIENT_TOKEN: process.env.FACEBOOK_CLIENT_TOKEN || "",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "",
  };
}

// ============================================
// SECURITY: Weather API Architecture
// ============================================
//
// WHY Backend-Only:
// - Google Weather API requires OAuth 2.0 / Service Account authentication
// - Cannot be securely implemented in React Native frontend
// - Backend handles: OAuth, caching, rate limiting, cost control
//
// Frontend: Calls ONLY GET /weather?lat={lat}&lon={lon}
// Backend: Handles Google Weather API (OAuth/Service Account)
//
// NO Google Weather API keys should be in frontend .env file

// Google Maps API Configuration
export const GOOGLE_MAPS_API_KEY = envVars.GOOGLE_MAPS_API_KEY || "";
export const GOOGLE_GEOCODING_API_BASE_URL =
  envVars.GOOGLE_GEOCODING_API_BASE_URL ||
  "https://maps.googleapis.com/maps/api";
export const GOOGLE_PLACES_API_BASE_URL =
  envVars.GOOGLE_PLACES_API_BASE_URL || "https://maps.googleapis.com/maps/api";

/** OpenStreetMap geocoding (geocode.maps.co) — identify location & change location. */
export const GEOCODING_API_BASE_URL =
  envVars.GEOCODING_API_BASE_URL || "https://geocode.maps.co";
export const GEOCODING_API_KEY = envVars.GEOCODING_API_KEY || "";

// API Configuration
// Host root only (no trailing /auth or /core). Paths in api.ts add /auth/* and /core/*.
// Dev/staging: https://birds-api.trackzio.com
// Production:   https://birds-api-prod.trackzio.com (confirm with backend)
export const BIRDS_API_BASE_URL =
  envVars.BIRDS_API_BASE_URL ||
  envVars.API_BASE_URL ||
  envVars.MUSHROOMS_API_BASE_URL ||
  envVars.MINERALS_API_BASE_URL ||
  "";

/** @deprecated Use BIRDS_API_BASE_URL */
export const MUSHROOMS_API_BASE_URL = BIRDS_API_BASE_URL;

/** Primary API host for auth + core (axios baseURL). */
export const API_BASE_URL = BIRDS_API_BASE_URL;

const trimTrailingSlash = (url: string) => url.replace(/\/$/, "");

/** Full auth module base — e.g. https://birds-api.trackzio.com/auth */
export const AUTH_API_BASE_URL = BIRDS_API_BASE_URL
  ? `${trimTrailingSlash(BIRDS_API_BASE_URL)}/auth`
  : "";

/** Full core module base — e.g. https://birds-api.trackzio.com/core */
export const CORE_API_BASE_URL = BIRDS_API_BASE_URL
  ? `${trimTrailingSlash(BIRDS_API_BASE_URL)}/core`
  : "";

// Notification service (shared Trackzio infra — same host dev + prod; app identified via APP_CODE)
// Device register: POST {NOTIFICATION_BASE_URL}/device  + header x-app-code: BirdsDev | Birds
export const NOTIFICATION_BASE_URL =
  envVars.NOTIFICATION_BASE_URL ||
  "https://notification-service.trackzio.com";

/** Notification service app identifier — BirdsDev (dev) / Birds (prod) */
export const APP_CODE = envVars.APP_CODE || "";

// Environment
export const ENV = envVars.ENV || (__DEV__ ? "development" : "production");

// Published / cross-promo apps list JSON URL
export const PUBLISHED_APPS_URL =
  envVars.PUBLISHED_APPS ||
  process.env.PUBLISHED_APPS ||
  "https://progresspal-assets.s3.us-west-2.amazonaws.com/cross-promo-apps/list.json";

// Country list JSON URL (profile dropdown, etc.)
export const COUNTRIES_JSON_URL =
  envVars.COUNTRIES_JSON ||
  process.env.COUNTRIES_JSON ||
  "https://progresspal-assets.s3.us-west-2.amazonaws.com/cross-promo-apps/countries.json";

// Google Sign-In (OAuth 2.0 Web Client ID)
export const GOOGLE_WEB_CLIENT_ID = envVars.GOOGLE_WEB_CLIENT_ID || "";

// App Store / Play Store
export const APP_STORE_ID = envVars.APP_STORE_ID || "";
export const PLAY_STORE_ID = envVars.PLAY_STORE_ID || "com.trackzio.birds";

// Subscription / IAP
// Set SUBSCRIPTION_VALUE in .env to your Birdzy pack list URL. When set, app fetches from URL; when unset, uses in-code fallback product IDs.
export const SUBSCRIPTION_VALUE = envVars.SUBSCRIPTION_VALUE ?? "";
/** Apple receipt validation shared secret (password). Set APP_SHARED_SECRET in .env. Used for receipt-body password on purchase success / validateReceiptIosSmart. */
export const APPLE_RECEIPT_SHARED_SECRET =
  envVars.APP_SHARED_SECRET || envVars.APP_SPECIFIC_SHARED_SECRET || "";
export const APP_SPECIFIC_SHARED_SECRET =
  envVars.APP_SPECIFIC_SHARED_SECRET || "";

// Rating & feedback – URL where feedback/rating submissions are sent (set RATING_FEEDBACK_API in .env)
export const RATING_FEEDBACK_API =
  envVars.RATING_FEEDBACK_API ||
  "https://msmnafgy53ptj4qqt3oqkk4gpe0pdtic.lambda-url.us-west-2.on.aws/";

/** Inbox for App Logs screen “Send email” (override with APP_LOGS_SUPPORT_EMAIL in .env). */
export const APP_LOGS_SUPPORT_EMAIL =
  envVars.APP_LOGS_SUPPORT_EMAIL || "ijaaz@trackzio.com";

/** When "true", enables in-app diagnostic logs in prod/release builds (see .env.prod). */
export const APP_LOGS_ENABLED =
  String(envVars.APP_LOGS_ENABLED ?? "")
    .trim()
    .toLowerCase() === "true";

export const FACEBOOK_APP_ID = envVars.FACEBOOK_APP_ID || "";
export const FACEBOOK_CLIENT_TOKEN = envVars.FACEBOOK_CLIENT_TOKEN || "";
export const FIREBASE_PROJECT_ID = envVars.FIREBASE_PROJECT_ID || "";
export const FIREBASE_APP_ID = envVars.FIREBASE_APP_ID || "";

// API Configuration Constants
export const API_TIMEOUT = 30000; // 30 seconds - can be overridden via env if needed
export const API_REQUEST_TIMEOUT = API_TIMEOUT;
export const API_RESPONSE_TIMEOUT = API_TIMEOUT;

// ============================================
// Validation
// ============================================
if (!API_BASE_URL && __DEV__) {
  console.warn(
    "⚠️  API_BASE_URL is not set. Auth and core API calls will fail until configured in .env"
  );
}
if (!APP_CODE && __DEV__) {
  console.warn(
    "⚠️  APP_CODE is not set. Notification service registration may fail."
  );
}
if (!GEOCODING_API_KEY && __DEV__) {
  console.warn(
    "⚠️  GEOCODING_API_KEY is not set. Identify location labels and Change Location search will fall back to coordinates/text only."
  );
}
if (!GOOGLE_MAPS_API_KEY && __DEV__) {
  console.warn(
    "⚠️  GOOGLE_MAPS_API_KEY is not set. Static Maps will not work."
  );
  console.warn(
    "   Please set it in .env file or install react-native-dotenv. See API_SETUP.md"
  );
  console.warn(
    "   This key is used ONLY for Google Static Maps API (non-interactive images)."
  );
  console.warn(
    "   Note: Weather API is handled by backend - no key needed in frontend."
  );
}
