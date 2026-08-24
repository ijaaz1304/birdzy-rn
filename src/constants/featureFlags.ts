import { isProdIntent } from "../lib/env/appEnv";

/**
 * Master switch for in-app dark mode UI.
 * Keep false until dark theme screens are implemented.
 */
export function isDarkModeEnabledForApp(): boolean {
  return false;
}

/**
 * Dev APK normally enables dark-mode rollout locally when the master switch is on.
 * Prod follows Remote Config `darkModeEnabled` + `themeDefault` A/B.
 */
export function isDarkModeLocalRolloutEnabled(): boolean {
  return isDarkModeEnabledForApp() && !isProdIntent();
}
