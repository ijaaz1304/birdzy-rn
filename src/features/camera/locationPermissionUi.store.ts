import { create } from "zustand";
import type { ChangeLocationSheetVariant } from "./locationToggle.helpers";

type LocationPermissionUiState = {
  showCustomPopup: boolean;
  showManagePopup: boolean;
  showChangeLocationSheet: boolean;
  loading: boolean;
  awaitingNative: boolean;
  changeLocationVariant: ChangeLocationSheetVariant;
  setShowCustomPopup: (show: boolean) => void;
  setShowManagePopup: (show: boolean) => void;
  setShowChangeLocationSheet: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setAwaitingNative: (awaiting: boolean) => void;
  setChangeLocationVariant: (variant: ChangeLocationSheetVariant) => void;
  resetPopups: () => void;
};

export const useLocationPermissionUiStore = create<LocationPermissionUiState>(
  (set) => ({
    showCustomPopup: false,
    showManagePopup: false,
    showChangeLocationSheet: false,
    loading: false,
    awaitingNative: false,
    changeLocationVariant: "add",
    setShowCustomPopup: (show) => set({ showCustomPopup: show }),
    setShowManagePopup: (show) => set({ showManagePopup: show }),
    setShowChangeLocationSheet: (show) => set({ showChangeLocationSheet: show }),
    setLoading: (loading) => set({ loading }),
    setAwaitingNative: (awaiting) => set({ awaitingNative: awaiting }),
    setChangeLocationVariant: (variant) =>
      set({ changeLocationVariant: variant }),
    resetPopups: () =>
      set({
        showCustomPopup: false,
        showManagePopup: false,
        showChangeLocationSheet: false,
        loading: false,
        awaitingNative: false,
      }),
  })
);

/** True while location permission UI or change-location sheet is open. */
export function isLocationPermissionFlowActive(): boolean {
  const s = useLocationPermissionUiStore.getState();
  return (
    s.showCustomPopup ||
    s.showManagePopup ||
    s.showChangeLocationSheet ||
    s.awaitingNative ||
    s.loading
  );
}
