import { SETTINGS_STRINGS } from "../../../config/strings/settings.strings";
import { ThemeMode } from "../../../design-system/themes";

export function getAppearanceModeLabel(mode: ThemeMode): string {
  switch (mode) {
    case "light":
      return SETTINGS_STRINGS.preferences.appearanceLight;
    case "dark":
      return SETTINGS_STRINGS.preferences.appearanceDark;
    case "system":
    default:
      return SETTINGS_STRINGS.preferences.appearanceSystem;
  }
}
