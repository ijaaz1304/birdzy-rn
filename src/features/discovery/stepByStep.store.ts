import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  WizardAnswers,
  WizardQuestion,
  WizardRecentLocation,
} from "./stepByStep.types";

const MAX_RECENT_LOCATIONS = 8;

function sameRecentLocation(
  a: WizardRecentLocation,
  b: WizardRecentLocation
): boolean {
  const labelA = a.label.trim().toLowerCase();
  const labelB = b.label.trim().toLowerCase();
  if (labelA.length > 0 && labelA === labelB) return true;

  const aHasCoords = a.latitude !== 0 || a.longitude !== 0;
  const bHasCoords = b.latitude !== 0 || b.longitude !== 0;
  return (
    aHasCoords &&
    bHasCoords &&
    a.latitude === b.latitude &&
    a.longitude === b.longitude
  );
}

/** Newer entries stay first. Matching labels collapse; 0,0 coords do not. */
export function mergeRecentLocations(
  primary: WizardRecentLocation[],
  secondary: WizardRecentLocation[]
): WizardRecentLocation[] {
  const next: WizardRecentLocation[] = [];
  for (const location of [...primary, ...secondary]) {
    if (!location?.label?.trim()) continue;
    if (next.some((item) => sameRecentLocation(item, location))) continue;
    next.push(location);
    if (next.length >= MAX_RECENT_LOCATIONS) break;
  }
  return next;
}

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
        set((state) => ({
          recentLocations: mergeRecentLocations(
            [location],
            state.recentLocations
          ),
          hasUsedWizardLocation: true,
        })),

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
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as {
          recentLocations?: WizardRecentLocation[];
          hasUsedWizardLocation?: boolean;
        };
        const recentLocations = mergeRecentLocations(
          currentState.recentLocations ?? [],
          Array.isArray(persisted.recentLocations)
            ? persisted.recentLocations
            : []
        );
        return {
          ...currentState,
          recentLocations,
          hasUsedWizardLocation:
            currentState.hasUsedWizardLocation ||
            Boolean(persisted.hasUsedWizardLocation) ||
            recentLocations.length > 0,
        };
      },
    }
  )
);
