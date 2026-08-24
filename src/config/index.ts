/**
 * App Configuration Exports
 * Central export point for all configuration
 */

export * from "./types";
export * from "./context";
export * from "./constants";
export * from "./colors";
export { birdsAppConfig } from "./birds.config";
/** @deprecated Use birdsAppConfig */
export { birdsAppConfig as mushroomsAppConfig } from "./birds.config";
export * from "./subscription.config";
export * from "./subscriptionConfig";
export * from "./strings";

import { AppType, AppConfig } from "./types";
import { birdsAppConfig } from "./birds.config";

const configMap: Record<string, AppConfig> = {
  birds: birdsAppConfig,
  /** Legacy alias */
  mushrooms: birdsAppConfig,
};

/**
 * Get app configuration by type
 */
export const getAppConfig = (appType: AppType): AppConfig => {
  const config = configMap[appType];
  if (!config) {
    console.warn(
      `No config found for app type: ${appType}, falling back to birds config`
    );
    return birdsAppConfig;
  }
  return config;
};

/**
 * Get default app config (birds)
 */
export const getDefaultAppConfig = (): AppConfig => {
  return birdsAppConfig;
};
