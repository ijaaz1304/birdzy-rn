/**
 * Session-based location permission prompt (home flow, after subscription).
 * Uses the same custom → native → manage-settings flow as the rest of the app.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  LocationManageAccessPopup,
  LocationPermissionPopup,
} from "../../molecules/Modal";
import {
  completeCustomThenNativeFlow,
  getLocationPermissionEntryAction,
} from "../../services/permissions/locationPermissionFlow.service";
import { openDeviceSettings } from "../../services/permissions";
import { useLocationPermissionUiStore } from "../camera/locationPermissionUi.store";

export interface SessionLocationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SessionLocationPermissionModal: React.FC<
  SessionLocationPermissionModalProps
> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [showManagePopup, setShowManagePopup] = useState(false);
  const awaitingNative = useLocationPermissionUiStore((s) => s.awaitingNative);
  const setAwaitingNative = useLocationPermissionUiStore(
    (s) => s.setAwaitingNative
  );

  const finish = useCallback(() => {
    setShowManagePopup(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      setShowManagePopup(false);
      return;
    }
    let mounted = true;
    void getLocationPermissionEntryAction().then((entry) => {
      if (!mounted) return;
      if (entry === "granted") {
        finish();
        return;
      }
      if (entry === "manage_settings") {
        setShowManagePopup(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [visible, finish]);

  const handleContinueLocation = useCallback(async () => {
    const entry = await getLocationPermissionEntryAction();
    if (entry === "granted") {
      finish();
      return;
    }
    if (entry === "manage_settings") {
      setShowManagePopup(true);
      return;
    }

    setLoading(true);
    setAwaitingNative(true);
    try {
      const outcome = await completeCustomThenNativeFlow();
      if (outcome.granted) {
        finish();
        return;
      }
      if (outcome.showManageSettings) {
        setShowManagePopup(true);
      } else {
        finish();
      }
    } finally {
      setAwaitingNative(false);
      setLoading(false);
    }
  }, [finish, setAwaitingNative]);

  const handleOpenSettings = useCallback(() => {
    void openDeviceSettings();
    finish();
  }, [finish]);

  return (
    <>
      <LocationPermissionPopup
        visible={visible && !showManagePopup && !awaitingNative}
        onClose={finish}
        onAllowLocation={handleContinueLocation}
        onCustomLocation={finish}
        loading={loading}
      />
      <LocationManageAccessPopup
        visible={visible && showManagePopup}
        onClose={finish}
        onCustomLocation={finish}
        onGoToSettings={handleOpenSettings}
      />
    </>
  );
};
