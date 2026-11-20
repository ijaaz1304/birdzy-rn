import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { isDarkModeEnabledForApp } from "../constants/featureFlags";
import {
  isAppearanceOptionVisibleForBuild,
  isThemeLockedToLightForBuild,
} from "../features/theme/themeExperiment";
import { getRemoteConfigValue } from "../services/remoteConfig/remoteConfig.service";

export function readThemeDefaultRcValue(): string {
  const raw = getRemoteConfigValue("theme_default");
  return typeof raw === "string" && raw.trim() ? raw : "system";
}

export function readDarkModeEnabledFromRemoteConfig(): boolean {
  return isDarkModeEnabledForApp();
}

export function readAppearanceOptionVisible(): boolean {
  return isAppearanceOptionVisibleForBuild(
    readThemeDefaultRcValue(),
    readDarkModeEnabledFromRemoteConfig()
  );
}

export function readThemeLockedToLight(): boolean {
  return isThemeLockedToLightForBuild(
    readThemeDefaultRcValue(),
    readDarkModeEnabledFromRemoteConfig()
  );
}

/** True while in-app dark mode is enabled. */
export function useDarkModeEnabled(): boolean {
  const [enabled, setEnabled] = useState(() =>
    readDarkModeEnabledFromRemoteConfig()
  );

  const refresh = useCallback(() => {
    setEnabled(readDarkModeEnabledFromRemoteConfig());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return enabled;
}

/** Whether Settings should show the dark-mode toggle. */
export function useAppearanceOptionVisible(darkModeEnabled?: boolean): boolean {
  const darkModeFromHook = useDarkModeEnabled();
  const resolvedDarkMode = darkModeEnabled ?? darkModeFromHook;
  const [visible, setVisible] = useState(() =>
    isAppearanceOptionVisibleForBuild(
      readThemeDefaultRcValue(),
      resolvedDarkMode
    )
  );

  const refresh = useCallback(() => {
    setVisible(
      isAppearanceOptionVisibleForBuild(
        readThemeDefaultRcValue(),
        resolvedDarkMode
      )
    );
  }, [resolvedDarkMode]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return visible;
}
