/**
 * Toast molecule component
 */

import React, { useEffect } from "react";
import { StyleSheet, Animated } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { UI_COLORS } from "../../constants/colorConstants";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  visible: boolean;
  duration?: number;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  visible,
  duration = 3000,
  onHide,
}) => {
  const theme = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible, duration, opacity, onHide]);

  if (!visible) return null;

  const getTypeColor = () => {
    switch (type) {
      case "success":
        return theme.colors.success;
      case "error":
        return theme.colors.error;
      case "warning":
        return theme.colors.warning;
      default:
        return theme.colors.info;
    }
  };

  const getIconName = () => {
    switch (type) {
      case "success":
        return "check-circle";
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderLeftColor: getTypeColor(),
          borderLeftWidth: 4,
          opacity,
        },
      ]}
    >
      <Icon name={getIconName()} size={20} color={getTypeColor()} />
      <Text variant="body" size="small" style={styles.message}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: Radius.sm,
    shadowColor: UI_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    marginLeft: 12,
    flex: 1,
  },
});
