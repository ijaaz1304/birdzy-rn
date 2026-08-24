/**
 * Settings Item Component
 * Reusable row item for settings with optional arrow, switch, or custom right component
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text } from "../../../atoms";
import { useTheme } from "../../../hooks/useTheme";

import { FONTS } from "../../../common/typography";

import { Radius } from "../../../design";

export interface SettingsItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  showBorder?: boolean;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  /** For toggle switch */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  /** Text color override (e.g., for error items like Delete Account) */
  textColor?: string;
  /** Right-side value label (e.g. "Use System theme") */
  value?: string;
  /** When true, row is non-interactive (e.g. sub-toggle when master is off). */
  disabled?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  subtitle,
  onPress,
  showArrow = false,
  showBorder = false,
  rightComponent,
  leftComponent,
  switchValue,
  onSwitchChange,
  textColor,
  value,
  disabled = false,
}) => {
  const colors = useTheme().colors;

  // Arrow color based on theme
  const arrowColor = colors.textSecondary; // #5D5D5D light, #D1D1D1 dark

  const content = (
    <View
      style={[
        styles.itemContainer,
        showBorder && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.leftContent}>
        {leftComponent}
        <View style={styles.textContent}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.title, { color: textColor ?? colors.textSecondary }]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Right side */}
      <View style={styles.rightContent}>
        {value ? (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.value, { color: colors.textBrand }]}
          >
            {value}
          </Text>
        ) : null}
        {rightComponent}
        {switchValue !== undefined && onSwitchChange && (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={disabled}
            onPress={() => {
              if (disabled) return;
              onSwitchChange(!switchValue);
            }}
            style={[
              styles.switchTrack,
              {
                backgroundColor: switchValue ? colors.primary : colors.border,
                justifyContent: switchValue ? "flex-end" : "flex-start",
              },
            ]}
          >
            <View
              style={[styles.switchThumb, { backgroundColor: colors.surface }]}
            />
          </TouchableOpacity>
        )}
        {showArrow && (
          <View style={styles.arrowWrap}>
            <MaterialIcons name="chevron-right" size={20} color={arrowColor} />
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View>{content}</View>;
};

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  /** Sub header: Body/14px/Medium – Satoshi 500, line-height 20px */
  title: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    lineHeight: 20,
    marginBottom: 0,
    overflow: "hidden",
  },
  subtitle: {
    marginTop: 2,
  },
  value: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    lineHeight: 24,
    maxWidth: 180,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  /** Arrow: 20×20, overflow hidden */
  arrowWrap: {
    width: 20,
    height: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  /** Circular switch: pill track + circular thumb */
  switchTrack: {
    width: 51,
    height: 31,
    borderRadius: Radius.lg,
    padding: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  switchThumb: {
    width: 25,
    height: 25,
    borderRadius: Radius.full,
  },
  disabled: {
    opacity: 0.45,
  },
});
