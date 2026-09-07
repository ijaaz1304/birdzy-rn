/**
 * Session-based location permission prompt (home flow, after subscription).
 * First-session prompt is informational only — no native OS dialog and no custom
 * location entry until that flow ships. Native permission is requested later
 * from the identification flow when the user opts in.
 */

import React, { useCallback, useEffect } from "react";
import { LocationPermissionPopup } from "../../molecules/Modal";
import { getLocationPermissionEntryAction } from "../../services/permissions/locationPermissionFlow.service";

export interface SessionLocationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SessionLocationPermissionModal: React.FC<
  SessionLocationPermissionModalProps
> = ({ visible, onClose }) => {
  const finish = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    void getLocationPermissionEntryAction().then((entry) => {
      if (!mounted) return;
      if (entry === "granted" || entry === "manage_settings") {
        finish();
      }
    });
    return () => {
      mounted = false;
    };
  }, [visible, finish]);

  return (
    <LocationPermissionPopup
      visible={visible}
      onClose={finish}
      onAllowLocation={finish}
      onCustomLocation={finish}
      showCustomLocationButton={false}
    />
  );
};
