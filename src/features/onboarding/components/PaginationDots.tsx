/**
 * Pagination Dots Component for Onboarding
 * Smooth width/color interpolation driven by horizontal scroll offset.
 */

import React from "react";
import { View, StyleSheet, Animated, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

const INACTIVE_DOT_WIDTH = 8;
const ACTIVE_DOT_WIDTH = 24;
const DOT_HEIGHT = 8;

export interface PaginationDotsProps {
  totalPages: number;
  scrollX: Animated.Value;
  pageWidth: number;
  containerStyle?: StyleProp<ViewStyle>;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({
  totalPages,
  scrollX,
  pageWidth,
  containerStyle,
}) => {
  const theme = useTheme();
  const inactiveColor = theme.colors.dotUnselected;
  const activeColor = theme.colors.dotSelected;

  return (
    <View style={[styles.container, containerStyle]}>
      {Array.from({ length: totalPages }).map((_, index) => {
        const inputRange = [
          (index - 1) * pageWidth,
          index * pageWidth,
          (index + 1) * pageWidth,
        ];

        const width = scrollX.interpolate({
          inputRange,
          outputRange: [
            INACTIVE_DOT_WIDTH,
            ACTIVE_DOT_WIDTH,
            INACTIVE_DOT_WIDTH,
          ],
          extrapolate: "clamp",
        });

        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [inactiveColor, activeColor, inactiveColor],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={`dot-${index}`}
            style={[
              styles.dot,
              {
                width,
                backgroundColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: DOT_HEIGHT,
    width: "100%",
  },
  dot: {
    height: DOT_HEIGHT,
    borderRadius: 4,
  },
});
