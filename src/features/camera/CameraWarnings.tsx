/**
 * Camera Warnings Component
 * Displays warning messages on the camera view
 */

import React from "react";
import { View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { cameraStyles } from "./camera.styles";

export interface CameraWarningsProps {
  text: string;
}

export const CameraWarnings: React.FC<CameraWarningsProps> = ({ text }) => {
  const theme = useTheme();

  return (
    <View
      style={[
        cameraStyles.warning,
        {
          backgroundColor: theme.colors.surfaceInvert,
        },
      ]}
    >
      <Text
        variant="body"
        size="small"
        style={[cameraStyles.warningText, { color: theme.colors.textInverse }]}
      >
        {text}
      </Text>
    </View>
  );
};
