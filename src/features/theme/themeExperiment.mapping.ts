import { ThemeMode } from "../../design-system/themes";

export type ThemeExperimentVariant = "variant_a" | "variant_b";

/**
 * Map Remote Config string → initial ThemeMode.
 * - system / variant_a → System (follow device)
 * - light / variant_b → Light (ignore device)
 */
export const mapThemeDefaultToMode = (raw: string): ThemeMode => {
  const value = raw.trim().toLowerCase();
  if (value === "light" || value === "variant_b") {
    return "light";
  }
  return "system";
};

export const mapThemeDefaultToVariant = (
  raw: string
): ThemeExperimentVariant => {
  const mode = mapThemeDefaultToMode(raw);
  return mode === "light" ? "variant_b" : "variant_a";
};
