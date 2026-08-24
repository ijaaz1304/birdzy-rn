/**
 * ListItem molecule component
 * Optimized and dynamic version of AppListItem
 */

import React from "react";
import { View, TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";

export interface ListItemProps extends Omit<TouchableOpacityProps, "style"> {
  label: string;
  selected?: boolean;
  showIcon?: boolean;
  icon?: string;
  rightIcon?: string;
  onPress?: () => void;
  variant?: "default" | "radio" | "checkbox";
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  label,
  selected = false,
  showIcon = true,
  icon,
  rightIcon,
  onPress,
  variant = "radio",
  style,
  ...props
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected
            ? theme.colors.surfaceSecondary
            : theme.colors.surfacePrimary,
          borderBottomColor: theme.colors.border0,
          borderRadius: theme.radius.sm,
        },
        style,
      ]}
      {...props}
    >
      {/* Left Icon/Indicator */}
      {showIcon && (
        <View style={styles.leftSection}>
          {variant === "radio" && (
            <View
              style={[
                styles.circle,
                {
                  borderColor: theme.colors.textBrand,
                },
              ]}
            >
              {selected && (
                <View
                  style={[
                    styles.innerCircle,
                    { backgroundColor: theme.colors.textBrand },
                  ]}
                />
              )}
            </View>
          )}
          {variant === "checkbox" && (
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: selected
                    ? theme.colors.borderBrand
                    : theme.colors.borderPrimary,
                  backgroundColor: selected
                    ? theme.colors.surfaceBrand
                    : theme.colors.surfacePrimary,
                },
              ]}
            >
              {selected && (
                <Icon
                  name="check"
                  size={10}
                  color={theme.colors.surfacePrimary}
                />
              )}
            </View>
          )}
          {icon && variant === "default" && (
            <Icon
              name={icon}
              size={20}
              color={
                selected ? theme.colors.textBrand : theme.colors.textSecondary
              }
            />
          )}
        </View>
      )}

      {/* Label */}
      <Text
        variant="body"
        size="medium"
        color={selected ? "text" : "textSecondary"}
        weight={selected ? "semibold" : "normal"}
        style={{ flex: 1 }}
      >
        {label}
      </Text>

      {/* Right Icon */}
      {rightIcon && (
        <Icon
          name={rightIcon}
          size={20}
          color={theme.colors.textSecondary}
          style={styles.rightIcon}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: "100%",
    gap: 8,
  },
  leftSection: {
    marginRight: 0,
  },
  circle: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  rightIcon: {
    marginLeft: 8,
  },
});
