/**
 * `theme_default` Remote Config value.
 *
 * `system` / `variant_a` — initial theme follows the device.
 * `light` / `variant_b` — initial theme is Light.
 * Neither arm hides Appearance or locks the app once dark mode is enabled.
 */

export type ThemeDefaultArm = "system" | "light";

const LIGHT_RC_VALUES = new Set(["light", "variant_b"]);

export function normalizeThemeDefaultRc(raw: string): ThemeDefaultArm {
  return LIGHT_RC_VALUES.has(raw.trim().toLowerCase()) ? "light" : "system";
}

export function isAppearanceOptionVisibleForThemeDefault(raw: string): boolean {
  return normalizeThemeDefaultRc(raw) === "system";
}

/** Appearance stays visible on every build once dark mode is on. */
export function isAppearanceOptionVisibleForBuild(
  _raw: string,
  darkModeEnabled: boolean
): boolean {
  return darkModeEnabled;
}

export function isThemeLockedToLightForThemeDefault(raw: string): boolean {
  return normalizeThemeDefaultRc(raw) === "light";
}

/** Dark mode is never locked to light once it is enabled for the app. */
export function isThemeLockedToLightForBuild(
  _raw: string,
  darkModeEnabled: boolean
): boolean {
  return !darkModeEnabled;
}
