/**
 * App Constants Helper
 * Provides constants from app configuration
 */

import { useAppConfig } from "./context";
import { API_ENDPOINTS as AUTH_API_PATHS } from "../constants/api";

/**
 * Hook to get app constants
 * Use this instead of importing from constants/index.ts
 */
export const useAppConstants = () => {
  const config = useAppConfig();

  return {
    appName: config.appName,
    packageName: config.packageName,
    appType: config.appType,
    apiEndpoints: {
      ...config.apiEndpoints,
      auth: AUTH_API_PATHS.AUTH,
      profile: {
        get: "/profile",
        update: "/profile",
        avatar: "/profile/avatar",
      },
      subscription: {
        get: "/subscription",
        upgrade: "/subscription/upgrade",
        cancel: "/subscription/cancel",
      },
      notifications: {
        list: "/notifications",
        markRead: "/notifications/:id/read",
      },
    },
    constants: config.constants || {},
  };
};
