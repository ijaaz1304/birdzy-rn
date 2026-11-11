/**
 * useExploreLocationToggleFlow
 *
 * Gates entry into Explore Near You behind location access before navigating
 * away from Home or Catalogue. GPS resolution happens separately on the
 * Explore screen.
 *
 * Mirrors src/features/camera/useLocationToggleFlow.ts's shape, but does
 * NOT reuse its store — that one holds state for the identification flow
 * specifically. Sharing it here would let Explore's location search
 * silently overwrite an in-progress identification's saved location.
 */

import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  getLocationPermissionEntryAction,
  completeCustomThenNativeFlow,
} from "../../services/permissions/locationPermissionFlow.service";

export function useExploreLocationToggleFlow() {
  const [showEnablePopup, setShowEnablePopup] = useState(false);
  const [showManagePopup, setShowManagePopup] = useState(false);
  const [showAddLocationSheet, setShowAddLocationSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const nativePending = useRef(false);

  /** Call when the user taps the Explore entry point. */
  const requestExploreAccess = useCallback(async (): Promise<
    "granted" | "pending"
  > => {
    if (nativePending.current) return "pending";
    const entry = await getLocationPermissionEntryAction();
    if (entry === "granted") return "granted";
    if (entry === "manage_settings") {
      setShowManagePopup(true);
      return "pending";
    }
    setShowEnablePopup(true);
    return "pending";
  }, []);

  /** Wires the enable-popup's "Allow Location" button. Resolves true if access was granted. */
  const handleAllowLocation = useCallback(async (): Promise<boolean> => {
    if (nativePending.current) return false;
    nativePending.current = true;
    setLoading(true);
    setShowEnablePopup(false);
    try {
      const outcome = await completeCustomThenNativeFlow();
      setShowEnablePopup(false);
      if (outcome.granted) return true;
      if (outcome.showManageSettings) setShowManagePopup(true);
      return false;
    } catch {
      Alert.alert(
        "Location access",
        "Unable to request location access. Please try again or use a custom location."
      );
      return false;
    } finally {
      nativePending.current = false;
      setLoading(false);
    }
  }, []);

  /** Wires either popup's "Use Custom Location" button. */
  const openAddLocation = useCallback(() => {
    setShowEnablePopup(false);
    setShowManagePopup(false);
    setShowAddLocationSheet(true);
  }, []);

  return {
    showEnablePopup,
    setShowEnablePopup,
    showManagePopup,
    setShowManagePopup,
    showAddLocationSheet,
    setShowAddLocationSheet,
    loading,
    requestExploreAccess,
    handleAllowLocation,
    openAddLocation,
  };
}
