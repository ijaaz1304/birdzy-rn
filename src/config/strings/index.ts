/**
 * Centralized Strings Configuration
 * Modular string management system
 */

export * from "./common.strings";
// Plant-specific calculators removed - not needed for rocks/minerals app
// export * from './waterCalculator.strings';
// export * from './potSizeCalculator.strings';
export * from "./collection.strings";
export * from "./subscription.strings";
export * from "./settings.strings";
export * from "./catalogue.strings";
export * from "./auth.strings";
export * from "./feed.strings";
export * from "./camera.strings";
export * from "./guides.strings";
export * from "./home.strings";
// Reminders strings removed - not needed for rocks/minerals app
export * from "./discount.strings";
export * from "./subscriptionStatus.strings";
export * from "./permissions.strings";
export * from "./modals.strings";
export * from "./onboarding.strings";
export * from "./ask-ai.strings";
export { MODAL_STRINGS } from "./modals.strings";

// Re-export helper function
export { formatString, pluralize, capitalize } from "./utils";

// Main strings object - combines all modules
import { COMMON_STRINGS } from "./common.strings";
// Plant-specific calculators removed - not needed for rocks/minerals app
// import { WATER_CALCULATOR_STRINGS } from './waterCalculator.strings';
// import { POT_SIZE_CALCULATOR_STRINGS } from './potSizeCalculator.strings';
import { COLLECTION_STRINGS } from "./collection.strings";
import { SUBSCRIPTION_STRINGS } from "./subscription.strings";
import { SETTINGS_STRINGS } from "./settings.strings";
import { CATALOGUE_STRINGS } from "./catalogue.strings";
import { AUTH_STRINGS } from "./auth.strings";
import { FEED_STRINGS } from "./feed.strings";
import { CAMERA_STRINGS } from "./camera.strings";
import { GUIDES_STRINGS } from "./guides.strings";
import { HOME_STRINGS } from "./home.strings";
// Reminders strings removed - not needed for rocks/minerals app
import { DISCOUNT_STRINGS } from "./discount.strings";
import { SUBSCRIPTION_STATUS_STRINGS } from "./subscriptionStatus.strings";
import { PERMISSIONS_STRINGS } from "./permissions.strings";
import { MODAL_STRINGS } from "./modals.strings";
import { ONBOARDING_STRINGS } from "./onboarding.strings";
import { ASK_AI_STRINGS } from "./ask-ai.strings";

export const APP_STRINGS = {
  common: COMMON_STRINGS,
  // Plant-specific calculators removed - not needed for rocks/minerals app
  // waterCalculator: WATER_CALCULATOR_STRINGS,
  // potSizeCalculator: POT_SIZE_CALCULATOR_STRINGS,
  collection: COLLECTION_STRINGS,
  subscription: SUBSCRIPTION_STRINGS,
  settings: SETTINGS_STRINGS,
  catalogue: CATALOGUE_STRINGS,
  auth: AUTH_STRINGS,
  feed: FEED_STRINGS,
  camera: CAMERA_STRINGS,
  guides: GUIDES_STRINGS,
  home: HOME_STRINGS,
  // reminders removed - not needed for rocks/minerals app
  discount: DISCOUNT_STRINGS,
  subscriptionStatus: SUBSCRIPTION_STATUS_STRINGS,
  permissions: PERMISSIONS_STRINGS,
  modals: MODAL_STRINGS,
  onboarding: ONBOARDING_STRINGS,
  askAi: ASK_AI_STRINGS,
} as const;
