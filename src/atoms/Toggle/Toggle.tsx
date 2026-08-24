/**
 * Toggle atom component
 * Optimized and dynamic version of AppToggle
 */

import React, { useRef, useEffect } from "react";
import { View, TouchableOpacity, TouchableOpacityProps, StyleSheet, Animated, Easing, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface ToggleProps extends Omit<TouchableOpacityProps, "style"> {
  value: boolean;
  onToggle?: (val: boolean) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  trackColor?: {
    active?: string;
    inactive?: string;
  };
  thumbColor?: {
    active?: string;
    inactive?: string;
  };
}

const SIZE_MAP = {
  small: { trackWidth: 32, trackHeight: 18, thumb: 14 },
  medium: { trackWidth: 40, trackHeight: 24, thumb: 20 },
  large: { trackWidth: 48, trackHeight: 28, thumb: 24 },
} as const;

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onToggle,
  disabled = false,
  size = "medium",
  style,
  trackColor,
  thumbColor,
  ...props
}) => {
  const theme = useTheme();
  const { trackWidth, trackHeight, thumb: thumbSize } = SIZE_MAP[size];
  const thumbAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(thumbAnim, {
      toValue: value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.circle),
      useNativeDriver: false,
    }).start();
  }, [value, thumbAnim]);

  const thumbTranslate = thumbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, trackWidth - thumbSize - 2],
  });

  const defaultTrackColor = disabled
    ? theme.colors.surfaceTertiary
    : value
    ? theme.colors.borderBrand
    : theme.colors.borderPrimary;

  const defaultThumbColor = disabled
    ? theme.colors.textTertiary
    : theme.colors.surfacePrimary;

  const finalTrackColor = value
    ? trackColor?.active || defaultTrackColor
    : trackColor?.inactive || defaultTrackColor;

  const finalThumbColor = value
    ? thumbColor?.active || defaultThumbColor
    : thumbColor?.inactive || defaultThumbColor;

  const backgroundColor = disabled
    ? theme.colors.surfacePrimary
    : value
    ? theme.colors.borderBrand
    : theme.colors.surfaceTertiary;

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPress={() => !disabled && onToggle?.(!value)}
      style={[{ opacity: disabled ? 0.6 : 1 }, style]}
      disabled={disabled}
      {...props}
    >
      <View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            borderRadius: theme.radius.full,
            backgroundColor: finalTrackColor || backgroundColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: finalThumbColor,
              transform: [{ translateX: thumbTranslate }],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    justifyContent: "center",
    padding: 2,
  },
  thumb: {
    position: "absolute",
    top: 2,
  },
});
