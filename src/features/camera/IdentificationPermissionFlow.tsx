/**
 * Camera permission gate for the identify flow.
 * Location is handled before the camera (identification entry gate).
 */

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { INTERACTIVE_COLORS } from "../../constants/colorConstants";
import { checkCameraPermission } from "../../services/permissions";
import { CameraPermissionGate } from "./CameraPermissionGate";

const CAMERA_BG_FALLBACK = INTERACTIVE_COLORS.CAMERA_BG_FALLBACK;

export interface IdentificationPermissionFlowProps {
  onCameraGranted: () => void;
  onCancel?: () => void;
}

export const IdentificationPermissionFlow: React.FC<
  IdentificationPermissionFlowProps
> = ({ onCameraGranted, onCancel }) => {
  const [ready, setReady] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const camera = await checkCameraPermission();
        if (cancelled || finishedRef.current) return;

        if (camera.granted) {
          finishedRef.current = true;
          onCameraGranted();
          return;
        }
      } catch {
        // fall through to camera gate
      }

      if (!cancelled) {
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onCameraGranted]);

  if (!ready) {
    return <View style={styles.placeholder} />;
  }

  return (
    <CameraPermissionGate
      onGranted={() => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        onCameraGranted();
      }}
      onCancel={onCancel}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: CAMERA_BG_FALLBACK,
  },
});
