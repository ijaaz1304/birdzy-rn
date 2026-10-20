/**
 * Settings flow color roles (Figma: Settings / My Profile / Login & Security).
 */

import { useTheme } from "../../hooks/useTheme";
import { PRIMITIVE_COLORS } from "../../design-system/colors";

export function useSettingsColors() {
  const { colors, mode } = useTheme();
  const isDark = mode === "dark";
  return {
    screen: isDark ? colors.surfacePrimary : "#FFFFFF",
    card: colors.cardBackground,
    /** color/grey/50 – card border + row dividers */
    cardBorder: colors.surfaceVariant,
    text: colors.textPrimary,
    label: colors.textSecondary,
    /** color/grey/300 – subtitles, trailing values, placeholders */
    muted: isDark ? colors.textTertiary : PRIMITIVE_COLORS.grey[300],
    placeholder: colors.textTertiary,
    fieldBorder: colors.border,
    fieldBg: colors.surfacePrimary,
    brand: colors.primary,
    danger: colors.error,
    toggleOff: colors.border,
    knob: PRIMITIVE_COLORS.grey.white,
  };
}

export type SettingsColors = ReturnType<typeof useSettingsColors>;
