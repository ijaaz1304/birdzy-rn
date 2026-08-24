/**
 * Card Skeleton Loader
 * Shimmer effect skeleton for mineral/rock cards
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface CardSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  width = "100%",
  height = 200,
  borderRadius = 12,
  style,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity: shimmerOpacity,
            backgroundColor: colors.border || colors.surfaceSecondary,
            borderRadius,
          },
        ]}
      />
      {/* Image placeholder */}
      <View
        style={[
          styles.imagePlaceholder,
          {
            backgroundColor: colors.surfaceSecondary,
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
          },
        ]}
      />
      {/* Content placeholder */}
      <View style={styles.contentContainer}>
        <View
          style={[
            styles.titlePlaceholder,
            { backgroundColor: colors.surfaceSecondary, borderRadius: 4 },
          ]}
        />
        <View
          style={[
            styles.subtitlePlaceholder,
            { backgroundColor: colors.surfaceSecondary, borderRadius: 4 },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imagePlaceholder: {
    width: "100%",
    height: "70%",
  },
  contentContainer: {
    padding: 12,
    gap: 8,
  },
  titlePlaceholder: {
    height: 16,
    width: "80%",
  },
  subtitlePlaceholder: {
    height: 12,
    width: "60%",
  },
});
