/**
 * Dark mode feature gate — Appearance picker visibility.
 * Visible for the whole app whenever dark mode is enabled.
 */

import { isDarkModeEnabledForApp } from "../../constants/featureFlags";
import { isAppearanceSettingsEnabled } from "./themeExperiment.service";

/** Whether the user can select dark / system appearance. */
export function isDarkModeFeatureEnabled(): boolean {
  return isDarkModeEnabledForApp() && isAppearanceSettingsEnabled();
}
