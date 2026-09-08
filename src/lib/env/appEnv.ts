/**
 * App Environment Intent
 *
 * Determines the app's intent (dev vs prod) from environment variables.
 * This is the source of truth for distinguishing DEV vs PROD intent,
 * independent of Metro bundler's __DEV__ flag.
 *
 * Priority:
 * 1. APP_ENV environment variable (explicit app intent)
 * 2. ENV constant (from .env file or process.env.ENV)
 * 3. __DEV__ as last resort (fallback only)
 */

export type AppEnv = "dev" | "prod";

let cachedIntent: AppEnv | null = null;

function normalizeEnv(value: string | undefined): AppEnv {
  if (!value) return "prod";
  const v = value.toLowerCase().trim();
  if (v === "dev" || v === "development") return "dev";
  if (v === "prod" || v === "production") return "prod";
  return "prod";
}

/**
 * Get app intent from environment variables
 *
 * @returns 'dev' if app intent is development, 'prod' otherwise
 */
export function getAppIntent(): AppEnv {
  if (cachedIntent !== null) return cachedIntent;

  // Try APP_ENV first (explicit app intent)
  let appEnv: string | undefined;
  try {
    const envModule = require("@env");
    appEnv = envModule?.APP_ENV || process.env.APP_ENV;
  } catch (e) {
    appEnv = process.env.APP_ENV;
  }

  if (appEnv) {
    cachedIntent = normalizeEnv(appEnv);
    return cachedIntent;
  }

  // Fall back to ENV constant (from .env file)
  try {
    const { ENV } = require("../../constants/env");
    if (ENV) {
      cachedIntent = normalizeEnv(ENV);
      return cachedIntent;
    }
  } catch (e) {
    // ENV constant not available
  }

  // Last resort: use __DEV__ (not ideal, but safe fallback)
  cachedIntent = __DEV__ ? "dev" : "prod";
  return cachedIntent;
}

/** True when the dev APK / dev intent is active (not store prod). */
export function isDevIntent(): boolean {
  return getAppIntent() === "dev";
}

/** True when the prod APK / prod intent is active. */
export function isProdIntent(): boolean {
  return getAppIntent() === "prod";
}

/** Dev-only Settings UI (premium toggle, env info). Dev APK or Metro debug. */
export function isDevSettingsVisible(): boolean {
  return __DEV__ || isDevIntent();
}
