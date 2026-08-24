/**
 * Pagination molecule component
 * Optimized and dynamic version of AppPagination
 */

import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export interface PaginationProps {
  total: number;
  activeIndex: number;
  onPageChange?: (index: number) => void;
  variant?: "dots" | "numbers";
  size?: "small" | "medium" | "large";
  containerStyle?: ViewStyle;
  dotStyle?: ViewStyle;
  activeDotStyle?: ViewStyle;
}

const SIZE_MAP = {
  small: { dot: 6, gap: 4 },
  medium: { dot: 8, gap: 6 },
  large: { dot: 10, gap: 8 },
} as const;

export const Pagination: React.FC<PaginationProps> = ({
  total,
  activeIndex,
  onPageChange,
  variant = "dots",
  size = "medium",
  containerStyle,
  dotStyle,
  activeDotStyle,
}) => {
  const theme = useTheme();
  const { dot: dotSize, gap } = SIZE_MAP[size];

  if (variant === "dots") {
    return (
      <View style={[styles.container, { gap }, containerStyle]}>
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onPageChange?.(i)}
              activeOpacity={0.7}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: isActive
                    ? theme.colors.dotSelected
                    : theme.colors.dotUnselected,
                  opacity: isActive ? 1 : 1,
                },
                isActive ? activeDotStyle : dotStyle,
              ]}
            />
          );
        })}
      </View>
    );
  }

  // Numbers variant (for future implementation)
  return (
    <View style={[styles.container, containerStyle]}>
      {Array.from({ length: total }).map((_, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onPageChange?.(i)}
          style={[
            styles.number,
            {
              backgroundColor:
                i === activeIndex ? theme.colors.primary : "transparent",
            },
          ]}
        >
          {/* Number would go here */}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    // Dot styles applied inline
  },
  number: {
    // Number styles for future implementation
  },
});
