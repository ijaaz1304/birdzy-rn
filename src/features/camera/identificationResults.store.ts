import { create } from "zustand";
import type { PossibleMatchListItem } from "../../utils/mushroomApiMappers";

type IdentificationResultsStore = {
  matches: PossibleMatchListItem[];
  identificationImage?: { uri: string };
  setResults: (
    matches: PossibleMatchListItem[],
    identificationImage?: { uri: string }
  ) => void;
  clear: () => void;
};

/** Holds latest identify matches in memory so navigation params stay lightweight. */
export const useIdentificationResultsStore = create<IdentificationResultsStore>(
  (set) => ({
    matches: [],
    identificationImage: undefined,
    setResults: (matches, identificationImage) =>
      set({ matches, identificationImage }),
    clear: () => set({ matches: [], identificationImage: undefined }),
  })
);
