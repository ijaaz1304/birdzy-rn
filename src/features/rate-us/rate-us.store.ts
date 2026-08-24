/**
 * Rate Us store using Zustand
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface RateUsState {
  hasRated: boolean;
  hasDeclined: boolean;
  lastPromptDate: string | null;
  appLaunchCount: number;

  // Actions
  incrementLaunchCount: () => void;
  setHasRated: (rated: boolean) => void;
  setHasDeclined: (declined: boolean) => void;
  shouldShowPrompt: () => boolean;
  reset: () => void;
}

const MIN_LAUNCHES = 5; // Show prompt after 5 launches
const DAYS_BETWEEN_PROMPTS = 30; // Don't show again for 30 days

export const useRateUsStore = create<RateUsState>()(
  persist(
    (set, get) => ({
      hasRated: false,
      hasDeclined: false,
      lastPromptDate: null,
      appLaunchCount: 0,

      incrementLaunchCount: () => {
        set((state) => ({ appLaunchCount: state.appLaunchCount + 1 }));
      },

      setHasRated: (rated: boolean) => {
        set({ hasRated: rated });
      },

      setHasDeclined: (declined: boolean) => {
        set({
          hasDeclined: declined,
          lastPromptDate: new Date().toISOString(),
        });
      },

      shouldShowPrompt: () => {
        const { hasRated, hasDeclined, appLaunchCount, lastPromptDate } = get();

        if (hasRated) return false;
        if (appLaunchCount < MIN_LAUNCHES) return false;

        if (hasDeclined && lastPromptDate) {
          const daysSinceLastPrompt = Math.floor(
            (Date.now() - new Date(lastPromptDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return daysSinceLastPrompt >= DAYS_BETWEEN_PROMPTS;
        }

        return true;
      },

      reset: () => {
        set({
          hasRated: false,
          hasDeclined: false,
          lastPromptDate: null,
          appLaunchCount: 0,
        });
      },
    }),
    {
      name: "birdzy-rate-us-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
