/**
 * Icon atom component
 * Uses react-native-vector-icons/Feather
 */

import React from "react";
import { StyleProp, TextStyle } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useTheme } from "../../hooks/useTheme";

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  style,
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.text;
  // Feather uses "x", not "close"
  const featherName = name === "close" ? "x" : name;

  return (
    <Feather
      name={featherName}
      size={size}
      color={iconColor}
      style={style as React.ComponentProps<typeof Feather>["style"]}
    />
  );
};
