/**
 * Theme hook for accessing theme in components
 */

import { useThemeContext } from "../app/ThemeProvider";

export const useTheme = () => useThemeContext().theme;

/** Returns only theme.colors for convenience (design spec: use colors.primaryCTA, colors.dotSelected, etc.) */
export const useThemeColors = () => useTheme().colors;

/** Returns true when effective theme is dark (resolves themeMode + system preference). */
export const useIsDark = (): boolean => useTheme().mode === "dark";
