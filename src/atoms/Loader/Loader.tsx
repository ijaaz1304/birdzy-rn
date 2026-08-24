/**
 * Loader atom component
 */

import React from "react";
import { ActivityIndicator, ActivityIndicatorProps, View, ViewStyle, StyleSheet } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../Text";

export interface LoaderProps
  extends Omit<ActivityIndicatorProps, "color" | "size"> {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "text" | "textSecondary" | string;
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  style?: ViewStyle;
}

export const Loader: React.FC<LoaderProps> = ({
  size = "medium",
  color = "primary",
  message,
  fullScreen = false,
  overlay = false,
  style,
  ...props
}) => {
  const theme = useTheme();

  const getSize = (): "small" | "large" => {
    const sizeMap: Record<string, "small" | "large"> = {
      small: "small",
      medium: "large",
      large: "large",
    };
    return sizeMap[size] || "large";
  };

  const getColor = (): string => {
    if (
      typeof color === "string" &&
      !["primary", "secondary", "text", "textSecondary"].includes(color)
    ) {
      return color;
    }
    const colorMap: Record<string, string> = {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      text: theme.colors.text,
      textSecondary: theme.colors.textSecondary,
    };
    return colorMap[color] || theme.colors.primary;
  };

  const containerStyle: ViewStyle = {
    ...(fullScreen && {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    }),
    ...(overlay && {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.overlay,
      zIndex: 9999,
    }),
  };

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={getSize()} color={getColor()} {...props} />
      {message && (
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.message}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  message: {
    marginTop: 12,
    textAlign: "center",
  },
});
