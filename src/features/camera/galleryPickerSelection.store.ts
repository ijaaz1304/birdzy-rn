import { create } from "zustand";
import type { GalleryPhoto } from "./galleryPhoto.types";

type GalleryPickerSelectionState = {
  selected: GalleryPhoto | null;
  thumbUri: string | null;
  setSelected: (photo: GalleryPhoto | null) => void;
  setThumbUri: (uri: string | null) => void;
  clear: () => void;
};

export const useGalleryPickerSelectionStore = create<GalleryPickerSelectionState>(
  (set) => ({
    selected: null,
    thumbUri: null,
    setSelected: (selected) => set({ selected }),
    setThumbUri: (thumbUri) => set({ thumbUri }),
    clear: () => set({ selected: null, thumbUri: null }),
  })
);
