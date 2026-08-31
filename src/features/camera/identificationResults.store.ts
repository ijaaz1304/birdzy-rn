import { create } from "zustand";
import type { PossibleMatchListItem } from "../../utils/mushroomApiMappers";

type IdentificationResultsStore = {
  matches: PossibleMatchListItem[];
  identificationImage?: { uri: string };
  /** Uploaded recording URLs from POST /core/ai/identify-sound `data.soundUrls`. */
  uploadedSoundUrls?: string[];
  setResults: (
    matches: PossibleMatchListItem[],
    identificationImage?: { uri: string },
    extras?: { uploadedSoundUrls?: string[] }
  ) => void;
  clear: () => void;
};

/** Holds latest identify matches in memory so navigation params stay lightweight. */
export const useIdentificationResultsStore = create<IdentificationResultsStore>(
  (set) => ({
    matches: [],
    identificationImage: undefined,
    uploadedSoundUrls: undefined,
    setResults: (matches, identificationImage, extras) =>
      set({
        matches,
        identificationImage,
        uploadedSoundUrls: extras?.uploadedSoundUrls,
      }),
    clear: () =>
      set({
        matches: [],
        identificationImage: undefined,
        uploadedSoundUrls: undefined,
      }),
  })
);
