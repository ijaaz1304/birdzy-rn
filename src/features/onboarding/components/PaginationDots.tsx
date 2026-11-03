/**
 * Pagination Dots Component for Onboarding
 * Figma: 8×8 circles, 4px gap; active/inactive differ only by color.
 * Color interpolates smoothly with the horizontal scroll offset.
 */

import React from "react";
import { View, StyleSheet, Animated, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../../hooks/useTheme";

const DOT_SIZE = 8;
const DOT_GAP = 4;

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
        const backgroundColor = scrollX.interpolate({
          inputRange: [
            (index - 1) * pageWidth,
            index * pageWidth,
            (index + 1) * pageWidth,
          ],
          outputRange: [inactiveColor, activeColor, inactiveColor],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={`dot-${index}`}
            style={[styles.dot, { backgroundColor }]}
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
    gap: DOT_GAP,
    height: DOT_SIZE,
    width: "100%",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
