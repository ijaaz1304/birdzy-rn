import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  WizardAnswers,
  WizardQuestion,
  WizardRecentLocation,
} from "./stepByStep.types";

const MAX_RECENT_LOCATIONS = 4;

const EMPTY_ANSWERS: WizardAnswers = {
  location: null,
  seenDate: null,
  sizeIndex: null,
  colors: [],
  habitat: null,
};

type StepByStepState = {
  answers: WizardAnswers;
  recentLocations: WizardRecentLocation[];
  /** True after the user has picked a location at least once (persisted). */
  hasUsedWizardLocation: boolean;
  editQuestion: WizardQuestion | null;
  setLocation: (location: WizardRecentLocation | null) => void;
  setSeenDate: (seenDate: string | null) => void;
  setSizeIndex: (sizeIndex: number | null) => void;
  toggleColor: (color: string) => void;
  setHabitat: (habitat: string | null) => void;
  setEditQuestion: (question: WizardQuestion | null) => void;
  rememberLocation: (location: WizardRecentLocation) => void;
  resetAnswers: () => void;
};

function isoToday(): string {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export const useStepByStepStore = create<StepByStepState>()(
  persist(
    (set) => ({
      answers: { ...EMPTY_ANSWERS, seenDate: isoToday() },
      recentLocations: [],
      hasUsedWizardLocation: false,
      editQuestion: null,

      setLocation: (location) =>
        set((state) => ({
          answers: { ...state.answers, location },
        })),

      setSeenDate: (seenDate) =>
        set((state) => ({
          answers: { ...state.answers, seenDate },
        })),

      setSizeIndex: (sizeIndex) =>
        set((state) => ({
          answers: { ...state.answers, sizeIndex },
        })),

      toggleColor: (color) =>
        set((state) => {
          const selected = state.answers.colors.includes(color)
            ? state.answers.colors.filter((item) => item !== color)
            : [...state.answers.colors, color];
          return { answers: { ...state.answers, colors: selected } };
        }),

      setHabitat: (habitat) =>
        set((state) => ({
          answers: { ...state.answers, habitat },
        })),

      setEditQuestion: (question) => set({ editQuestion: question }),

      rememberLocation: (location) =>
        set((state) => {
          const next = [
            location,
            ...state.recentLocations.filter(
              (item) =>
                item.label !== location.label &&
                !(
                  item.latitude === location.latitude &&
                  item.longitude === location.longitude
                )
            ),
          ].slice(0, MAX_RECENT_LOCATIONS);
          return {
            recentLocations: next,
            hasUsedWizardLocation: true,
          };
        }),

      resetAnswers: () =>
        set({
          answers: { ...EMPTY_ANSWERS, seenDate: isoToday() },
          editQuestion: null,
        }),
    }),
    {
      name: "birdzy-step-by-step",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recentLocations: state.recentLocations,
        hasUsedWizardLocation: state.hasUsedWizardLocation,
      }),
    }
  )
);
