/**
 * Persisted post-auth onboarding progress (slide index + completion).
 * Resumes mid-flow after app restart; cleared on logout via clearSessionStorage().
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  POST_AUTH_ONBOARDING_STEPS,
  POST_AUTH_ONBOARDING_SLIDE_COUNT,
} from "./constants";

interface PostAuthOnboardingState {
  /** User was routed into post-auth onboarding (login / sign-up / guest). */
  hasEnteredPostAuthOnboarding: boolean;
  hasCompletedPostAuthOnboarding: boolean;
  currentSlide: number;
  _hasHydrated: boolean;

  beginPostAuthOnboarding: () => void;
  setCurrentSlide: (slide: number) => void;
  markCompleted: () => void;
  reset: () => void;
}

function clampSlide(slide: number): number {
  return Math.max(
    POST_AUTH_ONBOARDING_STEPS.LOCATION,
    Math.min(slide, POST_AUTH_ONBOARDING_SLIDE_COUNT - 1)
  );
}

export const usePostAuthOnboardingStore = create<PostAuthOnboardingState>()(
  persist(
    (set) => ({
      hasEnteredPostAuthOnboarding: false,
      hasCompletedPostAuthOnboarding: false,
      currentSlide: POST_AUTH_ONBOARDING_STEPS.LOCATION,
      _hasHydrated: false,

      beginPostAuthOnboarding: () => {
        set({
          hasEnteredPostAuthOnboarding: true,
          hasCompletedPostAuthOnboarding: false,
        });
      },

      setCurrentSlide: (slide: number) => {
        set({ currentSlide: clampSlide(slide) });
      },

      markCompleted: () => {
        set({
          hasCompletedPostAuthOnboarding: true,
          currentSlide: POST_AUTH_ONBOARDING_STEPS.LOCATION,
        });
      },

      reset: () => {
        set({
          hasEnteredPostAuthOnboarding: false,
          hasCompletedPostAuthOnboarding: false,
          currentSlide: POST_AUTH_ONBOARDING_STEPS.LOCATION,
        });
      },
    }),
    {
      name: "birdzy-post-auth-onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasEnteredPostAuthOnboarding: state.hasEnteredPostAuthOnboarding,
        hasCompletedPostAuthOnboarding: state.hasCompletedPostAuthOnboarding,
        currentSlide: state.currentSlide,
      }),
      onRehydrateStorage: () => (state, error) => {
        usePostAuthOnboardingStore.setState({ _hasHydrated: true });
        if (error) {
          usePostAuthOnboardingStore.getState().reset();
        }
      },
    }
  )
);

/** Whether an authenticated user should resume post-auth onboarding on cold start. */
export function shouldResumePostAuthOnboarding(): boolean {
  const {
    hasEnteredPostAuthOnboarding,
    hasCompletedPostAuthOnboarding,
  } = usePostAuthOnboardingStore.getState();
  return hasEnteredPostAuthOnboarding && !hasCompletedPostAuthOnboarding;
}
