/**
 * Store for passing saved edit result back to Mushroom Details screen.
 * When Edit Mushroom Details saves, it sets the result here; Details screen
 * on focus reads it and refreshes/merges so the saved response is reflected.
 */

import { create } from "zustand";

interface EditMushroomResultState {
  /** After update: specimen id that was updated */
  specimenId?: string | null;
  /** After add from identification: mushroom (archetype) id */
  mushroomId?: string | null;
  /** Saved specimen data from API (for merge on identification flow) */
  specimenData?: Record<string, unknown> | null;
  setEditResult: (params: {
    specimenId?: string | null;
    mushroomId?: string | null;
    specimenData?: Record<string, unknown> | null;
  }) => void;
  clear: () => void;
}

export const useEditMushroomResultStore = create<EditMushroomResultState>()(
  (set) => ({
    specimenId: null,
    mushroomId: null,
    specimenData: null,
    setEditResult: (params) =>
      set({
        specimenId: params.specimenId ?? null,
        mushroomId: params.mushroomId ?? null,
        specimenData: params.specimenData ?? null,
      }),
    clear: () =>
      set({
        specimenId: null,
        mushroomId: null,
        specimenData: null,
      }),
  })
);
