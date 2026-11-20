import { isProdIntent } from "../lib/env/appEnv";

/**
 * Master switch for in-app dark mode.
 * When true, Settings → Appearance is available and Light / Dark / System
 * apply across the app.
 */
export function isDarkModeEnabledForApp(): boolean {
  return true;
}

/**
 * True on non-production builds when dark mode is enabled.
 * Appearance and the active theme do not depend on this helper.
 */
export function isDarkModeLocalRolloutEnabled(): boolean {
  return isDarkModeEnabledForApp() && !isProdIntent();
}
