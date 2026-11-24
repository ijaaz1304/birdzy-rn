import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mergeRecentLocations } from "../discovery/stepByStep.store";
import type { WizardRecentLocation } from "../discovery/stepByStep.types";

/**
 * Places chosen in the custom-location sheet, newest first, for its
 * "Recently Used" list. Kept apart from the step-by-step wizard's history so
 * picking a place here never marks the wizard location question as used.
 */
export type RecentCustomLocation = WizardRecentLocation;

export const MAX_RECENT_CUSTOM_LOCATIONS = 5;

type RecentCustomLocationsState = {
  recent: RecentCustomLocation[];
  remember: (location: RecentCustomLocation) => void;
  clear: () => void;
};

/** Only resolved places are worth offering again; 0,0 means geocoding failed. */
export function isReusableLocation(location: RecentCustomLocation): boolean {
  return (
    !!location.label.trim() &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    (location.latitude !== 0 || location.longitude !== 0)
  );
}

export const useRecentCustomLocationsStore =
  create<RecentCustomLocationsState>()(
    persist(
      (set) => ({
        recent: [],
        remember: (location) => {
          if (!isReusableLocation(location)) return;
          set((state) => ({
            recent: mergeRecentLocations([location], state.recent).slice(
              0,
              MAX_RECENT_CUSTOM_LOCATIONS
            ),
          }));
        },
        clear: () => set({ recent: [] }),
      }),
      {
        name: "birdzy-recent-custom-locations",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ recent: state.recent }),
      }
    )
  );
