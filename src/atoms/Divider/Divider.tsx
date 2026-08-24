/**
 * Divider atom component
 */

import React from "react";
import { View, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  thickness?: number;
  spacing?: number;
  marginVertical?: number;
  color?: string;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  thickness = 1,
  spacing = 0,
  marginVertical,
  color,
  style,
}) => {
  const theme = useTheme();
  const dividerColor = color || theme.colors.border;

  // Use marginVertical if provided, otherwise use spacing
  const verticalMargin =
    marginVertical !== undefined ? marginVertical : spacing;

  const dividerStyle: ViewStyle = {
    backgroundColor: dividerColor,
    ...(orientation === "horizontal"
      ? {
          width: "100%",
          height: thickness,
          marginVertical: verticalMargin,
        }
      : {
          height: "100%",
          width: thickness,
          marginHorizontal: spacing,
        }),
  };

  return <View style={[dividerStyle, style]} />;
};
