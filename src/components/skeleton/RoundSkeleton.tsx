/**
 * Round Skeleton Loader
 * Circular shimmer effect for community/feed posts
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../hooks/useTheme";

interface RoundSkeletonProps {
  size?: number;
  style?: any;
}

export const RoundSkeleton: React.FC<RoundSkeletonProps> = ({
  size = 60,
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
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: shimmerOpacity,
            backgroundColor: colors.border || colors.surfaceSecondary,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  circle: {
    width: "100%",
    height: "100%",
  },
});
