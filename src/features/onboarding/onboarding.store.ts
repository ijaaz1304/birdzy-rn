/**
 * Onboarding store using Zustand
 * Optimized for fast navigation - persist happens asynchronously
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingState {
  hasCompletedOnboarding: boolean;

  // Actions
  setHasCompletedOnboarding: (completed: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,

      setHasCompletedOnboarding: (completed: boolean) => {
        // Update state immediately - persist will handle storage in background
        set({ hasCompletedOnboarding: completed });
      },

      reset: () => {
        set({ hasCompletedOnboarding: false });
      },
    }),
    {
      name: "birdzy-onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Skip hydration delay for faster initial load
      skipHydration: false,
      // Use partialize to only persist what's needed
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Onboarding store hydration error:", error);
          // Reset to default state on hydration error
          if (state) {
            state.hasCompletedOnboarding = false;
          }
        }
      },
    }
  )
);
