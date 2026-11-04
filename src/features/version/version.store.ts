/**
 * Version check store using Zustand
 */

import { create } from "zustand";
import { getVersion } from "react-native-device-info";

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  isUpdateRequired: boolean;
  isUpdateAvailable: boolean;
  updateUrl?: string;
  releaseNotes?: string;
  updateNotes?: string[]; // Array of update notes for the modal
}

interface VersionState {
  versionInfo: VersionInfo | null;
  isLoading: boolean;
  error: string | null;
  lastChecked: string | null;

  // Actions
  checkVersion: () => Promise<void>;
  reset: () => void;
}

export const useVersionStore = create<VersionState>((set) => ({
  versionInfo: null,
  isLoading: false,
  error: null,
  lastChecked: null,

  checkVersion: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implement actual version check API call
      // const versionInfo = await versionService.checkVersion();
      // set({ versionInfo, lastChecked: new Date().toISOString(), isLoading: false });

      // Installed native version may differ from the JavaScript package version.
      const currentVersion = getVersion();
      const versionInfo: VersionInfo = {
        currentVersion,
        latestVersion: currentVersion,
        isUpdateRequired: false,
        isUpdateAvailable: false,
      };

      set({
        versionInfo,
        lastChecked: new Date().toISOString(),
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to check version",
        isLoading: false,
      });
    }
  },

  reset: () => {
    set({
      versionInfo: null,
      isLoading: false,
      error: null,
      lastChecked: null,
    });
  },
}));
