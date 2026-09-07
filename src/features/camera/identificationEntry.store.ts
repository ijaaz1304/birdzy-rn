import { create } from "zustand";
import type { ExternalCameraReturnTarget } from "./identifyCameraNavigation";

type IdentificationEntryStore = {
  pendingFromBottomTab: boolean;
  setPendingFromBottomTab: (pending: boolean) => void;
  /** Skip FTUE tooltip auto-tab switch (e.g. explicit return to Home after identify). */
  suppressFtueAutoNavigation: boolean;
  setSuppressFtueAutoNavigation: (suppress: boolean) => void;
  /** @deprecated Use suppressFtueAutoNavigation */
  skipFtueAutoNavigationOnce: boolean;
  setSkipFtueAutoNavigationOnce: (skip: boolean) => void;
  cameraPermissionGranted: boolean | null;
  setCameraPermissionGranted: (granted: boolean | null) => void;
  startEntryHandler: (() => void) | null;
  setStartEntryHandler: (handler: (() => void) | null) => void;
  startSoundEntryHandler: (() => void) | null;
  setStartSoundEntryHandler: (handler: (() => void) | null) => void;
  externalCameraReturnTarget: ExternalCameraReturnTarget | null;
  setExternalCameraReturnTarget: (
    target: ExternalCameraReturnTarget | null
  ) => void;
};

export const useIdentificationEntryStore = create<IdentificationEntryStore>(
  (set) => ({
    pendingFromBottomTab: false,
    setPendingFromBottomTab: (pending) =>
      set({ pendingFromBottomTab: pending }),
    suppressFtueAutoNavigation: false,
    setSuppressFtueAutoNavigation: (suppress) =>
      set({ suppressFtueAutoNavigation: suppress }),
    skipFtueAutoNavigationOnce: false,
    setSkipFtueAutoNavigationOnce: (skip) =>
      set({ suppressFtueAutoNavigation: skip, skipFtueAutoNavigationOnce: skip }),
    cameraPermissionGranted: null,
    setCameraPermissionGranted: (granted) =>
      set({ cameraPermissionGranted: granted }),
    startEntryHandler: null,
    setStartEntryHandler: (handler) => set({ startEntryHandler: handler }),
    startSoundEntryHandler: null,
    setStartSoundEntryHandler: (handler) =>
      set({ startSoundEntryHandler: handler }),
    externalCameraReturnTarget: null,
    setExternalCameraReturnTarget: (target) =>
      set({ externalCameraReturnTarget: target }),
  })
);
