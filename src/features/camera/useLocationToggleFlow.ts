import { useCallback } from "react";
import {
  completeCustomThenNativeFlow,
  getLocationPermissionEntryAction,
} from "../../services/permissions/locationPermissionFlow.service";
import {
  hasIdentificationLocationSet,
  resolveChangeLocationVariant,
} from "./locationToggle.helpers";
import { useIdentificationLocationStore } from "./identificationLocation.store";
import { useLocationPermissionUiStore } from "./locationPermissionUi.store";
import { useIdentificationLocation } from "./useIdentificationLocation";

/**
 * Shared location toggle UI + permission flow.
 * One store → same custom → native → manage-settings behavior everywhere.
 */
export function useLocationToggleFlow() {
  const {
    location,
    permissionGranted,
    locationLabel,
    applyManualLocation,
    refreshFromDevice,
    syncPermission,
  } = useIdentificationLocation();

  const showCustomPopup = useLocationPermissionUiStore((s) => s.showCustomPopup);
  const showManagePopup = useLocationPermissionUiStore((s) => s.showManagePopup);
  const showChangeLocationSheet = useLocationPermissionUiStore(
    (s) => s.showChangeLocationSheet
  );
  const loading = useLocationPermissionUiStore((s) => s.loading);
  const awaitingNative = useLocationPermissionUiStore((s) => s.awaitingNative);
  const changeLocationVariant = useLocationPermissionUiStore(
    (s) => s.changeLocationVariant
  );
  const setShowCustomPopup = useLocationPermissionUiStore(
    (s) => s.setShowCustomPopup
  );
  const setShowManagePopup = useLocationPermissionUiStore(
    (s) => s.setShowManagePopup
  );
  const setShowChangeLocationSheet = useLocationPermissionUiStore(
    (s) => s.setShowChangeLocationSheet
  );
  const setLoading = useLocationPermissionUiStore((s) => s.setLoading);
  const setAwaitingNative = useLocationPermissionUiStore(
    (s) => s.setAwaitingNative
  );
  const setChangeLocationVariant = useLocationPermissionUiStore(
    (s) => s.setChangeLocationVariant
  );

  const openCustomLocationSheet = useCallback(
    (variant?: "add" | "custom") => {
      const currentLocation =
        useIdentificationLocationStore.getState().location;
      setChangeLocationVariant(
        variant ?? resolveChangeLocationVariant(currentLocation)
      );
      setShowChangeLocationSheet(true);
    },
    [setChangeLocationVariant, setShowChangeLocationSheet]
  );

  /** Step 1: show custom popup, manage popup, or refresh if already granted. */
  const promptForLocation = useCallback(async () => {
    if (permissionGranted) {
      void refreshFromDevice();
      return;
    }

    const entry = await getLocationPermissionEntryAction();
    if (entry === "granted") {
      await syncPermission();
      return;
    }
    if (entry === "manage_settings") {
      setShowManagePopup(true);
      return;
    }
    setShowCustomPopup(true);
  }, [
    permissionGranted,
    refreshFromDevice,
    setShowCustomPopup,
    setShowManagePopup,
    syncPermission,
  ]);

  /** Step 2: user tapped Continue on custom popup → native OS prompt. */
  const onCustomPopupAllow = useCallback(async () => {
    if (loading) return;

    const entry = await getLocationPermissionEntryAction();
    if (entry === "granted") {
      setShowCustomPopup(false);
      await syncPermission();
      return;
    }
    if (entry === "manage_settings") {
      setShowCustomPopup(false);
      setShowManagePopup(true);
      return;
    }

    setLoading(true);
    setAwaitingNative(true);
    try {
      const outcome = await completeCustomThenNativeFlow();
      setShowCustomPopup(false);

      if (outcome.granted) {
        await syncPermission();
        return;
      }
      if (outcome.showManageSettings) {
        setShowManagePopup(true);
      }
    } finally {
      setAwaitingNative(false);
      setLoading(false);
    }
  }, [
    loading,
    setAwaitingNative,
    setLoading,
    setShowCustomPopup,
    setShowManagePopup,
    syncPermission,
  ]);

  const handleManagePopupCustomLocation = useCallback(() => {
    setShowManagePopup(false);
    openCustomLocationSheet();
  }, [openCustomLocationSheet, setShowManagePopup]);

  const isLocationPermissionFlowActive =
    showCustomPopup ||
    showManagePopup ||
    showChangeLocationSheet ||
    awaitingNative ||
    loading;

  return {
    location,
    locationLabel,
    permissionGranted,
    applyManualLocation,
    showManagePopup,
    setShowManagePopup,
    showEnableLocationPopup: showCustomPopup && !awaitingNative,
    setShowEnableLocationPopup: setShowCustomPopup,
    showChangeLocationSheet,
    setShowChangeLocationSheet,
    changeLocationVariant,
    handleToggleOn: promptForLocation,
    handleEnableLocationRequest: onCustomPopupAllow,
    locationRequestLoading: loading,
    promptLocationBeforeIdentify: (): boolean => {
      if (
        permissionGranted ||
        hasIdentificationLocationSet(
          useIdentificationLocationStore.getState().location
        )
      ) {
        return true;
      }
      void promptForLocation();
      return false;
    },
    handleManagePopupCustomLocation,
    openCustomLocationSheet,
    hasExistingLocation: hasIdentificationLocationSet(location),
    refreshFromDevice,
    syncPermission,
    isLocationPermissionFlowActive,
    onCustomPopupAllow,
    promptForLocation,
  };
}
