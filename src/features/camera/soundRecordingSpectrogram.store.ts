import { create } from "zustand";

type SoundRecordingSpectrogramStore = {
  columns: number[][];
  setColumns: (columns: number[][]) => void;
  clear: () => void;
};

/** Holds recorded mel columns in memory (navigation params are not reliable for large arrays). */
export const useSoundRecordingSpectrogramStore =
  create<SoundRecordingSpectrogramStore>((set) => ({
    columns: [],
    setColumns: (columns) => set({ columns }),
    clear: () => set({ columns: [] }),
  }));
