/**
 * Theme experiment service
 *
 * Reads Firebase Remote Config A/B parameter `theme_default` and applies it
 * as the INITIAL theme experience.
 *
 * Variant A (system): follow device; Appearance settings visible.
 * Variant B (light): locked to Light; Appearance settings hidden.
 */

import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";
import { isDarkModeEnabledForApp } from "../../constants/featureFlags";
import { getRemoteConfigValue } from "../../services/remoteConfig/remoteConfig.service";
import { ThemeMode } from "../../design-system/themes";
import { useThemeStore } from "./theme.store";
import {
  mapThemeDefaultToMode,
  mapThemeDefaultToVariant,
  type ThemeExperimentVariant,
} from "./themeExperiment.mapping";

/** Remote Config parameter that drives the dark-mode A/B experiment. */
export const THEME_DEFAULT_RC_KEY = "theme_default" as const;

/** Allowed Remote Config values (and aliases). */
export type ThemeDefaultRcValue =
  | "system"
  | "light"
  | "variant_a"
  | "variant_b";

export type { ThemeExperimentVariant } from "./themeExperiment.mapping";

export {
  mapThemeDefaultToMode,
  mapThemeDefaultToVariant,
} from "./themeExperiment.mapping";

const VALID_RC_VALUES = new Set<string>([
  "system",
  "light",
  "variant_a",
  "variant_b",
]);

let hasLoggedVariantAssigned = false;
let hasLoggedDefaultApplied = false;
let themeExperimentInitialized = false;

/** Read and normalize the experiment parameter from Remote Config. */
export const getThemeDefaultRcValue = (): ThemeDefaultRcValue => {
  const raw = String(getRemoteConfigValue("theme_default") ?? "system")
    .trim()
    .toLowerCase();
  if (VALID_RC_VALUES.has(raw)) {
    return raw as ThemeDefaultRcValue;
  }
  return "system";
};

export const getThemeExperimentVariant = (): ThemeExperimentVariant =>
  mapThemeDefaultToVariant(getThemeDefaultRcValue());

export const getThemeExperimentInitialMode = (): ThemeMode =>
  mapThemeDefaultToMode(getThemeDefaultRcValue());

/** Appearance (System / Light / Dark) is only available for Variant A. */
export const isAppearanceSettingsEnabled = (): boolean =>
  isDarkModeEnabledForApp() && getThemeExperimentVariant() === "variant_a";

/** Dark mode disabled globally, or Variant B locked to light. */
export const isThemeLockedToLight = (): boolean =>
  !isDarkModeEnabledForApp() || getThemeExperimentVariant() === "variant_b";

/** True after startup has applied the experiment (UI may paint). */
export const isThemeExperimentInitialized = (): boolean =>
  themeExperimentInitialized;

const waitForThemeStoreHydration = (): Promise<void> => {
  const api = useThemeStore.persist;
  if (api.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = api.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
};

/**
 * Apply current Remote Config theme default.
 * Variant B always forces Light (no Appearance).
 * Variant A applies only when the user has not chosen yet.
 */
export const applyThemeExperimentFromRemoteConfig = (): void => {
  if (!isDarkModeEnabledForApp()) {
    const changed = useThemeStore.getState().forceExperimentTheme("light");
    if (__DEV__) {
      console.log(
        "[THEME] Dark mode disabled — locked to light",
        changed ? "(updated)" : "(already light)"
      );
    }
    useThemeStore.getState().notifyExperimentApplied();
    return;
  }

  const rcValue = getThemeDefaultRcValue();
  const variant = mapThemeDefaultToVariant(rcValue);
  const initialMode = mapThemeDefaultToMode(rcValue);

  if (!hasLoggedVariantAssigned) {
    hasLoggedVariantAssigned = true;
    analyticsService.logEvent(EVENTS.theme_experiment_variant_assigned, {
      variant,
      theme_default: rcValue,
      initial_theme: initialMode,
      appearance_enabled: variant === "variant_a" ? "true" : "false",
    });
    analyticsService.logEvent(EVENTS.experiment_exposure, {
      experiment_id: "dark_mode_test",
      variant,
      theme_default: rcValue,
      rc_source: "remote_config",
    });
    analyticsService.setUserProperties({
      theme_exp_variant: variant,
      theme_default: rcValue,
      theme_mode: initialMode,
    });
  }

  const {
    hasUserSelectedTheme,
    themeMode,
    applyExperimentDefault,
    forceExperimentTheme,
  } = useThemeStore.getState();

  // Variant B: lock to Light and hide Appearance in Settings.
  if (variant === "variant_b") {
    const changed = forceExperimentTheme("light");

    if (!hasLoggedDefaultApplied) {
      hasLoggedDefaultApplied = true;
      analyticsService.logEvent(EVENTS.theme_default_applied, {
        variant,
        theme_default: rcValue,
        theme: "light",
        source: "remote_config",
        changed: changed ? "true" : "false",
        locked: "true",
      });
    }

    if (__DEV__) {
      console.log(
        "[THEME_EXPERIMENT] Variant B locked to light",
        changed ? "(updated)" : "(already light)"
      );
    }
    useThemeStore.getState().notifyExperimentApplied();
    return;
  }

  // Variant A: respect saved Appearance choice
  if (hasUserSelectedTheme) {
    if (__DEV__) {
      console.log(
        "[THEME_EXPERIMENT] Skipping RC default; user preference:",
        themeMode
      );
    }
    useThemeStore.getState().notifyExperimentApplied();
    return;
  }

  const changed = applyExperimentDefault(initialMode);

  if (!hasLoggedDefaultApplied) {
    hasLoggedDefaultApplied = true;
    analyticsService.logEvent(EVENTS.theme_default_applied, {
      variant,
      theme_default: rcValue,
      theme: initialMode,
      source: "remote_config",
      changed: changed ? "true" : "false",
    });
  }

  if (__DEV__) {
    console.log(
      "[THEME_EXPERIMENT]",
      changed ? "Applied" : "Already set",
      "theme:",
      initialMode,
      "variant:",
      variant
    );
  }

  useThemeStore.getState().notifyExperimentApplied();
};

export type InitializeThemeExperimentOptions = {
  /**
   * When true, refresh stale Remote Config before applying.
   * Startup should leave this false — RC is already loaded/activated;
   * background fetch will re-apply via loadAndCacheConfig.
   */
  refreshIfStale?: boolean;
};

/**
 * Hydrate theme store and apply the experiment from current RC values.
 * Call only after Remote Config has been initialized (cache and/or first fetch).
 */
export const initializeThemeExperiment = async (
  options?: InitializeThemeExperimentOptions
): Promise<void> => {
  try {
    await waitForThemeStoreHydration();

    if (options?.refreshIfStale) {
      try {
        const {
          refreshRemoteConfig,
        } = require("../../services/remoteConfig/remoteConfig.service");
        await refreshRemoteConfig();
      } catch {
        // Fall through and apply whatever is cached / defaulted
      }
    }

    applyThemeExperimentFromRemoteConfig();
  } catch (error) {
    if (__DEV__) {
      console.warn("[THEME_EXPERIMENT] Init failed:", error);
    }
    try {
      applyThemeExperimentFromRemoteConfig();
    } catch {
      /* ignore */
    }
  } finally {
    themeExperimentInitialized = true;
  }
};

export const trackAppearanceSettingsOpened = (
  currentTheme: ThemeMode
): void => {
  analyticsService.logEvent(EVENTS.appearance_settings_opened, {
    current_theme: currentTheme,
    experiment_variant: getThemeExperimentVariant(),
  });
};

export const trackThemeChanged = (
  previousTheme: ThemeMode,
  newTheme: ThemeMode
): void => {
  const experimentVariant = getThemeExperimentVariant();
  analyticsService.logEvent(EVENTS.theme_changed, {
    previous_theme: previousTheme,
    new_theme: newTheme,
    experiment_variant: experimentVariant,
  });
  analyticsService.logEvent(EVENTS.theme_mode_changed, {
    theme_mode: newTheme,
    previous_theme: previousTheme,
    source: "appearance_settings",
    experiment_variant: experimentVariant,
  });
  analyticsService.setUserProperties({
    theme_mode: newTheme,
    theme_exp_variant: experimentVariant,
  });
};
