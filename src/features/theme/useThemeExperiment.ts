/**
 * Hook exposing the current theme A/B experiment assignment.
 * Prefer this over reading Remote Config directly in UI code.
 */

import {
  getThemeDefaultRcValue,
  getThemeExperimentInitialMode,
  getThemeExperimentVariant,
  isAppearanceSettingsEnabled,
  ThemeDefaultRcValue,
  ThemeExperimentVariant,
} from "./themeExperiment.service";
import { ThemeMode } from "../../design-system/themes";
import { useThemeStore } from "./theme.store";

export interface ThemeExperimentInfo {
  variant: ThemeExperimentVariant;
  themeDefault: ThemeDefaultRcValue;
  initialMode: ThemeMode;
  /** True only for Variant A — Appearance row / picker is shown. */
  canChangeAppearance: boolean;
}

export const useThemeExperiment = (): ThemeExperimentInfo => {
  // Re-read when theme store updates (RC apply / user selection)
  useThemeStore((s) => s.themeMode);
  useThemeStore((s) => s.experimentSyncToken);

  return {
    variant: getThemeExperimentVariant(),
    themeDefault: getThemeDefaultRcValue(),
    initialMode: getThemeExperimentInitialMode(),
    canChangeAppearance: isAppearanceSettingsEnabled(),
  };
};
