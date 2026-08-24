/**
 * Slider Component
 * Simple slider for numeric values (e.g., Mohs Hardness 0-10, Rarity Score 0-10)
 */

import React, { useState } from "react";
import { View, StyleSheet, PanResponder, Animated } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { Text } from "../../atoms";

import { Radius } from "../../design";

export interface SliderProps {
  label?: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onValueChange,
  min = 0,
  max = 10,
  step = 0.1,
  disabled = false,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const [sliderWidth, setSliderWidth] = useState(0);
  const pan = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (sliderWidth > 0) {
      const percentage = ((value - min) / (max - min)) * 100;
      const newPosition = (percentage / 100) * sliderWidth;
      pan.setValue(newPosition);
    }
  }, [value, min, max, sliderWidth]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        if (sliderWidth > 0) {
          const percentage = ((value - min) / (max - min)) * 100;
          pan.setValue((percentage / 100) * sliderWidth);
          pan.setOffset((pan as Animated.Value & { _value: number })._value);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (sliderWidth > 0) {
          const newPosition = Math.max(
            0,
            Math.min(sliderWidth, (pan as Animated.Value & { _value: number })._value + gestureState.dx)
          );
          pan.setValue(newPosition);
        }
      },
      onPanResponderRelease: () => {
        if (sliderWidth > 0) {
          pan.flattenOffset();
          const percentage = ((pan as Animated.Value & { _value: number })._value / sliderWidth) * 100;
          const newValue =
            Math.round(((percentage / 100) * (max - min) + min) / step) * step;
          const clampedValue = Math.max(min, Math.min(max, newValue));
          onValueChange(clampedValue);
        }
      },
    })
  ).current;

  const percentage = sliderWidth > 0 ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <View style={styles.container}>
      {label && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing[2],
          }}
        >
          <Text variant="label" size="small">
            {label}
          </Text>
          <Text variant="body" size="medium" weight="semibold">
            {value.toFixed(1)}
          </Text>
        </View>
      )}
      <View
        style={[styles.track, { backgroundColor: colors.border }]}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.thumb,
            {
              left: `${percentage}%`,
              backgroundColor: colors.primary,
              transform: [{ translateX: -8 }],
            },
          ]}
        />
      </View>
      <View style={styles.labels}>
        <Text variant="body" size="small" color="textSecondary">
          {min}
        </Text>
        <Text variant="body" size="small" color="textSecondary">
          {max}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: "relative",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  thumb: {
    width: 16,
    height: 16,
    borderRadius: Radius.sm,
    position: "absolute",
    top: -6,
    borderWidth: 2,
    borderColor: OVERLAY_COLORS.BORDER_WHITE,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
});
