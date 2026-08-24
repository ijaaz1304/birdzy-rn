/**
 * Camera Overlay Component
 * Displays a frame overlay on the camera view
 */

import React from "react";
import { View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { cameraStyles } from "./camera.styles";

export const CameraOverlay: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={cameraStyles.overlay}>
      <View
        style={[
          cameraStyles.frameBox,
          {
            borderColor: theme.colors.warning, // Yellow frame color
          },
        ]}
      />
    </View>
  );
};
