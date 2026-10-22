/**
 * Theme Provider Component
 * Provides theme context to the app
 */

import React, { useMemo, useCallback, useEffect } from "react";
import { Appearance, StatusBar, View, useColorScheme } from "react-native";
import { useThemeStore } from "../features/theme/theme.store";
import { Theme, themes } from "../design-system/themes";
import {
  isAppearanceSettingsEnabled,
  isThemeLockedToLight,
} from "../features/theme/themeExperiment.service";

interface ThemeContextValue {
  theme: Theme;
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
}

export const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> =
  React.memo(({ children }) => {
    const { themeMode, setThemeMode } = useThemeStore();
    const systemColorScheme = useColorScheme();
    const lockedToLight = isThemeLockedToLight();

    const effectiveMode = useMemo(() => {
      if (lockedToLight) {
        return "light";
      }
      if (themeMode === "system") {
        const scheme =
          systemColorScheme ?? Appearance.getColorScheme();
        return scheme === "dark" ? "dark" : "light";
      }
      return themeMode;
    }, [lockedToLight, themeMode, systemColorScheme]);

    useEffect(() => {
      if (lockedToLight) {
        Appearance.setColorScheme("light");
        return;
      }
      Appearance.setColorScheme(themeMode === "system" ? null : themeMode);
    }, [lockedToLight, themeMode]);

    // Memoize theme object to prevent unnecessary re-renders
    const currentTheme = useMemo(() => themes[effectiveMode], [effectiveMode]);

    // Memoize setThemeMode callback to prevent context value changes
    const handleSetThemeMode = useCallback(
      (mode: "light" | "dark" | "system") => {
        // Variant B: Appearance disabled — ignore theme changes
        if (!isAppearanceSettingsEnabled()) {
          return;
        }
        setThemeMode(mode);
      },
      [setThemeMode]
    );

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(
      () => ({
        theme: currentTheme,
        themeMode,
        setThemeMode: handleSetThemeMode,
      }),
      [currentTheme, themeMode, handleSetThemeMode]
    );

    const statusBarProps = useMemo(
      () => ({
        barStyle:
          effectiveMode === "dark"
            ? ("light-content" as const)
            : ("dark-content" as const),
        backgroundColor:
          effectiveMode === "dark" ? "#000000" : currentTheme.colors.background,
        translucent: effectiveMode === "light",
      }),
      [effectiveMode, currentTheme.colors.background]
    );

    return (
      <ThemeContext.Provider value={contextValue}>
        <StatusBar {...statusBarProps} />
        <View
          style={{ flex: 1, backgroundColor: currentTheme.colors.surfacePrimary }}
        >
          {children}
        </View>
      </ThemeContext.Provider>
    );
  });

ThemeProvider.displayName = "ThemeProvider";

/**
 * Hook to access theme context
 */
export const useThemeContext = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
};
