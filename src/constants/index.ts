/**
 * App constants
 * Note: These are now dynamic and come from app config
 * Use useAppConfig() hook to access these values
 * This file maintains backward compatibility for legacy code
 */

// Lazy import to avoid circular dependencies
let defaultConfig: any = null;
const getDefaultConfig = () => {
  if (!defaultConfig) {
    const { getDefaultAppConfig } = require("../config");
    defaultConfig = getDefaultAppConfig();
  }
  return defaultConfig;
};

// These are now deprecated - use useAppConfig() hook instead
export const APP_NAME = getDefaultConfig().appName;
export const PACKAGE_NAME = getDefaultConfig().packageName;

// API endpoints — prefer `constants/api.ts` (canonical). Legacy shape kept for old imports.
export { API_ENDPOINTS } from "./api";

/** @deprecated Use API_ENDPOINTS from constants/api.ts */
export const LEGACY_API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    REFRESH_TOKEN: "/auth/refresh-auth-token",
  },
  PROFILE: {
    GET: "/profile",
    UPDATE: "/profile",
    AVATAR: "/profile/avatar",
  },
  SUBSCRIPTION: {
    GET: "/subscription",
    UPGRADE: "/subscription/upgrade",
    CANCEL: "/subscription/cancel",
  },
  // Dynamic endpoints - use config instead
  IDENTIFY: getDefaultConfig().apiEndpoints?.identify || "/items/identify",
  SEARCH: getDefaultConfig().apiEndpoints?.search || "/items/search",
  DETAILS: getDefaultConfig().apiEndpoints?.details || "/items/:id",
  NOTIFICATIONS: {
    LIST: "/notifications",
    MARK_READ: "/notifications/:id/read",
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  THEME: "birdzy-theme-storage",
  AUTH: "birdzy-auth-storage",
  SUBSCRIPTION: "birdzy-subscription-storage",
  NOTIFICATIONS: "birdzy-notifications-storage",
  RATE_US: "birdzy-rate-us-storage",
} as const;

// Navigation routes
export const ROUTES = {
  SPLASH: "Splash",
  AUTH: {
    STACK: "AuthStack",
    LOGIN: "Login",
    REGISTER: "Register",
    FORGOT_PASSWORD: "ForgotPassword",
  },
  MAIN: {
    TABS: "MainTabs",
    HOME: "Home",
    IDENTIFY: "Identify",
    SUBSCRIPTION: "Subscription",
    PROFILE: "Profile",
  },
  POST_AUTH_ONBOARDING: "PostAuthOnboarding",
  MODAL: {
    STACK: "ModalStack",
    WEBVIEW: "WebView",
    BOTTOM_SHEET: "BottomSheet",
  },
} as const;

// Feature flags
export const FEATURES = {
  PREMIUM_IDENTIFICATION: "premium_identification",
  ADVANCED_CARE_TIPS: "advanced_care_tips",
  EXPERT_CONSULTATION: "expert_consultation",
  MUSHROOM_COLLECTION: "mushroom_collection",
  COMMUNITY: "community",
} as const;

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  PREMIUM: "premium",
  PRO: "pro",
} as const;

// Mineral identification confidence thresholds
export const IDENTIFICATION_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4,
} as const;

// App version
export const APP_VERSION = "0.0.1";

// Rate us settings
export const RATE_US = {
  MIN_LAUNCHES: 5,
  DAYS_BETWEEN_PROMPTS: 30,
} as const;

// Reminder options
// Reminder options removed - not needed for rocks/minerals app

// Mineral options (legacy plantOptions export for backward compatibility)
export * from "./plantOptions";

// Environment constants
export * from "./env";

// App constants (pagination, timing, categories, etc.)
export * from "./appConstants";

// App Store IDs and rating constants
export * from "./appStoreConstants";

// Branding — default display name constant
export * from "./branding";

// Modal & upgrade UI constants
export * from "./modals.constants";
// Color constants - centralized colors and specs
export * from "./colorConstants";

// UI Constants - dimensions, spacing, hit slops
export * from "./uiConstants";

// Storage Constants - all AsyncStorage keys
export * from "./storageConstants";
