/**
 * Theme store using Zustand
 *
 * Stores themeMode (light/dark/system) and whether the user explicitly chose
 * an appearance. Remote Config only sets the initial theme when the user has
 * not selected one yet.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeMode } from "../../design-system/themes";

interface ThemeState {
  themeMode: ThemeMode;
  /** True only after the user picks System / Light / Dark in Appearance. */
  hasUserSelectedTheme: boolean;
  /** Bumps when Remote Config re-applies the theme experiment (Settings UI refresh). */
  experimentSyncToken: number;
  setThemeMode: (mode: ThemeMode) => void;
  /** Apply A/B default when the user has not chosen a theme yet. */
  applyExperimentDefault: (mode: ThemeMode) => boolean;
  /**
   * Force theme from experiment (e.g. Variant B → light).
   * Does not count as a user Appearance selection.
   */
  forceExperimentTheme: (mode: ThemeMode) => boolean;
  notifyExperimentApplied: () => void;
}

type PersistedThemeState = {
  themeMode?: ThemeMode;
  hasUserSelectedTheme?: boolean;
  /** Legacy flag from earlier experiment wiring */
  hasThemePreference?: boolean;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: "light",
      hasUserSelectedTheme: false,
      experimentSyncToken: 0,

      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode, hasUserSelectedTheme: true });
      },

      notifyExperimentApplied: () => {
        set((state) => ({
          experimentSyncToken: state.experimentSyncToken + 1,
        }));
      },

      applyExperimentDefault: (mode: ThemeMode) => {
        let applied = false;
        set((state) => {
          if (state.hasUserSelectedTheme) {
            return state;
          }
          if (state.themeMode === mode) {
            return state;
          }
          applied = true;
          return { themeMode: mode };
        });
        return applied;
      },

      forceExperimentTheme: (mode: ThemeMode) => {
        let applied = false;
        set((state) => {
          if (state.themeMode === mode && !state.hasUserSelectedTheme) {
            return state;
          }
          applied = true;
          // Clear user selection — Variant B locks Appearance off
          return { themeMode: mode, hasUserSelectedTheme: false };
        });
        return applied;
      },
    }),
    {
      name: "birdzy-theme-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        hasUserSelectedTheme: state.hasUserSelectedTheme,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as PersistedThemeState;
        // Returning users already had a stored themeMode before this experiment.
        // Treat them as having a preference so RC does not re-assign them.
        const isLegacyInstall =
          persisted.themeMode != null &&
          persisted.hasUserSelectedTheme === undefined &&
          persisted.hasThemePreference === undefined;

        const hasUserSelectedTheme =
          persisted.hasUserSelectedTheme === true ||
          persisted.hasThemePreference === true ||
          isLegacyInstall;

        return {
          ...currentState,
          ...persisted,
          themeMode: persisted.themeMode ?? currentState.themeMode,
          hasUserSelectedTheme,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Theme store hydration error:", error);
          if (state) {
            state.themeMode = "light";
            state.hasUserSelectedTheme = false;
          }
        }
      },
    }
  )
);
