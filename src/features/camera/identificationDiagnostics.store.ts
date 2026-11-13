import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppLog } from "../app-logs/app-logs.store";

export const IDENTIFICATION_DIAGNOSTICS_KEY =
  "birdzy-identification-diagnostics-v1";
const MAX_ENTRIES = 20;
let sequence = 0;

type DiagnosticsState = {
  logs: AppLog[];
  record: (matches: string[], counts: { totalCount: number }) => void;
  clear: () => void;
};

/** Only public result names/counts: never photos, location, tokens or complete API payloads. */
export const useIdentificationDiagnosticsStore = create<DiagnosticsState>()(
  persist(
    (set) => ({
      logs: [],
      record: (matches, counts) => {
        const entry: AppLog = {
          id: `identification-${Date.now()}-${++sequence}`,
          level: "info",
          timestamp: new Date().toISOString(),
          message: "[Identify] Top 5 Matches",
          metadata: {
            ...counts,
            resolvedCount: matches.length,
            displayedCount: Math.min(5, matches.length),
            matches: matches.slice(0, 5).map((item, index) => ({
              rank: index + 1,
              name: item.slice(0, 160),
            })),
          },
        };
        set((state) => ({ logs: [...state.logs, entry].slice(-MAX_ENTRIES) }));
      },
      clear: () => set({ logs: [] }),
    }),
    {
      name: IDENTIFICATION_DIAGNOSTICS_KEY,
      storage: createJSONStorage(() => ({
        getItem: (key) => AsyncStorage.getItem(key).catch(() => null),
        setItem: (key, value) =>
          AsyncStorage.setItem(key, value).catch(() => {}),
        removeItem: (key) => AsyncStorage.removeItem(key).catch(() => {}),
      })),
      partialize: (state) => ({ logs: state.logs }),
      // Preserve an event recorded while AsyncStorage hydration was still running.
      merge: (persisted, current) => {
        const saved = (persisted as Partial<DiagnosticsState> | undefined)
          ?.logs;
        const logs = [...(Array.isArray(saved) ? saved : []), ...current.logs];
        return {
          ...current,
          logs: Array.from(
            new Map(logs.map((log) => [log.id, log])).values()
          ).slice(-MAX_ENTRIES),
        };
      },
    }
  )
);
