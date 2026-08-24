/**
 * Dark mode feature gate — Appearance picker visibility.
 * Disabled globally until dark UI is ready; then Variant A/B rules apply.
 */

import { isDarkModeEnabledForApp } from "../../constants/featureFlags";
import { isAppearanceSettingsEnabled } from "./themeExperiment.service";

/** Whether the user can select dark / system appearance. */
export function isDarkModeFeatureEnabled(): boolean {
  return isDarkModeEnabledForApp() && isAppearanceSettingsEnabled();
}
