import { create } from "zustand";
import type { PossibleMatchListItem } from "../../utils/mushroomApiMappers";

type IdentificationResultsStore = {
  matches: PossibleMatchListItem[];
  identificationImage?: { uri: string };
  /** Uploaded recording URLs from POST /core/ai/identify-sound `data.soundUrls`. */
  uploadedSoundUrls?: string[];
  /** Reference image URLs returned by identify-sound (used when saving recordings). */
  uploadedImageUrls?: string[];
  setResults: (
    matches: PossibleMatchListItem[],
    identificationImage?: { uri: string },
    extras?: { uploadedSoundUrls?: string[]; uploadedImageUrls?: string[] }
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
        uploadedImageUrls: extras?.uploadedImageUrls,
      }),
    clear: () =>
      set({
        matches: [],
        identificationImage: undefined,
        uploadedSoundUrls: undefined,
        uploadedImageUrls: undefined,
      }),
  })
);
