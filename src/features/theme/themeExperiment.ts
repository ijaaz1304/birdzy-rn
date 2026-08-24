/**
 * `themeDefault` Remote Config experiment — theme A/B.
 *
 * Variant A (control): `system` | `variant_a` — default follows device, appearance visible.
 * Variant B (treatment): `light` | `variant_b` — locked to light, appearance hidden.
 */

import { isDarkModeLocalRolloutEnabled } from "../../constants/featureFlags";

export type ThemeDefaultArm = "system" | "light";

const LIGHT_RC_VALUES = new Set(["light", "variant_b"]);

export function normalizeThemeDefaultRc(raw: string): ThemeDefaultArm {
  return LIGHT_RC_VALUES.has(raw.trim().toLowerCase()) ? "light" : "system";
}

export function isAppearanceOptionVisibleForThemeDefault(raw: string): boolean {
  return normalizeThemeDefaultRc(raw) === "system";
}

/** Dev APK always shows appearance controls when dark mode is on; prod follows `themeDefault`. */
export function isAppearanceOptionVisibleForBuild(
  raw: string,
  darkModeEnabled: boolean
): boolean {
  if (!darkModeEnabled) return false;
  if (isDarkModeLocalRolloutEnabled()) return true;
  return isAppearanceOptionVisibleForThemeDefault(raw);
}

export function isThemeLockedToLightForThemeDefault(raw: string): boolean {
  return normalizeThemeDefaultRc(raw) === "light";
}

/** Dev APK never locks theme; prod may lock to light per `themeDefault`. */
export function isThemeLockedToLightForBuild(
  raw: string,
  darkModeEnabled: boolean
): boolean {
  if (!darkModeEnabled) return true;
  if (isDarkModeLocalRolloutEnabled()) return false;
  return isThemeLockedToLightForThemeDefault(raw);
}
