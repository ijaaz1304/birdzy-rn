/**
 * TopNavBar organism component
 * Optimized and dynamic version of AppTopNavBar
 */

import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text, Icon, NavBackIcon } from "../../atoms";

export interface TopNavBarProps {
  label?: string;
  showTitle?: boolean;
  leftAction?: {
    type: "icon" | "button";
    icon?: string;
    label?: string;
    onPress?: () => void;
  };
  rightAction?: {
    type: "icon" | "button";
    icon?: string;
    label?: string;
    onPress?: () => void;
  };
  containerStyle?: ViewStyle;
  titleStyle?: ViewStyle;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  label = "",
  showTitle = true,
  leftAction,
  rightAction,
  containerStyle,
  titleStyle,
}) => {
  const theme = useTheme();

  const renderAction = (
    align: "left" | "right",
    action?: TopNavBarProps["leftAction"] | TopNavBarProps["rightAction"]
  ) => {
    if (!action) return null;

    const content =
      action.type === "button" && action.label ? (
        <Text variant="body" size="medium" color="text" weight="semibold">
          {action.label}
        </Text>
      ) : action.icon === "arrow-left" ||
        action.icon === "chevron-left" ||
        action.icon === "chevron-back" ? (
        <NavBackIcon color={theme.colors.textPrimary} />
      ) : action.icon ? (
        <Icon name={action.icon} size={20} color={theme.colors.textPrimary} />
      ) : null;

    return (
      <TouchableOpacity
        onPress={action.onPress}
        style={[styles.sideButton, align === "right" && styles.rightButton]}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSecondary,
        },
        containerStyle,
      ]}
    >
      {/* Left side */}
      {renderAction("left", leftAction)}

      {/* Title */}
      {showTitle && (
        <Text
          variant="title"
          size="medium"
          color="text"
          weight="semibold"
          style={[styles.title, titleStyle]}
        >
          {label}
        </Text>
      )}

      {/* Right side */}
      {renderAction("right", rightAction)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
    height: 48,
  },
  sideButton: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    minWidth: 44,
  },
  rightButton: {
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    textAlign: "left",
    marginHorizontal: 12,
  },
});
