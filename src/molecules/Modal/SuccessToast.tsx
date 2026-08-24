/**
 * Success Toast Modal
 * Shows success messages (e.g., "Added to favorite successfully")
 */

import React, { useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../hooks/useTheme";
import { APP_COLORS, UI_COLORS } from "../../config/colors";
import { Text } from "../../atoms";

export interface SuccessToastProps {
  visible: boolean;
  message: string;
  onHide: () => void;
  duration?: number;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  visible,
  message,
  onHide,
  duration = 2000,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 100,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, fadeAnim, slideAnim, duration, onHide]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.success,
            borderRadius: radius.md,
            padding: spacing[3],
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <MaterialIcons
          name="check-circle"
          size={20}
          color={APP_COLORS.modalTextOnPrimary}
        />
        <Text
          variant="body"
          size="small"
          weight="medium"
          style={[
            styles.message,
            { color: APP_COLORS.modalTextOnPrimary, marginLeft: spacing[2] },
          ]}
        >
          {message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    shadowColor: UI_COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    flex: 1,
  },
});
