/**
 * Settings Item Component
 * 60px row: optional 20px icon, Body/14px/Regular label, trailing value /
 * chevron / toggle. Divider is controlled by the parent SettingsSection.
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "../../../atoms";
import { FONTS } from "../../../common/typography";
import { useSettingsColors } from "../settingsColors";
import { SettingsIcon, SettingsIconName } from "./SettingsIcon";

export interface SettingsItemProps {
  title: string;
  subtitle?: string;
  icon?: SettingsIconName;
  /** Trailing grey value (e.g. Appearance → "System"). */
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  showBorder?: boolean;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  /** For toggle switch */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  /** Label + icon color override (e.g. Log Out in red) */
  textColor?: string;
  /** When true, row is non-interactive (e.g. sub-toggle when master is off). */
  disabled?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  subtitle,
  icon,
  value,
  onPress,
  showArrow = false,
  showBorder = false,
  rightComponent,
  leftComponent,
  switchValue,
  onSwitchChange,
  textColor,
  disabled = false,
}) => {
  const c = useSettingsColors();
  const labelColor = textColor ?? c.text;

  const content = (
    <View
      style={[
        styles.row,
        showBorder && {
          borderBottomWidth: 1,
          borderBottomColor: c.cardBorder,
        },
        disabled && styles.disabled,
      ]}
    >
      {leftComponent}
      {icon && <SettingsIcon name={icon} color={labelColor} />}
      <View style={styles.textContent}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.title, { color: labelColor }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={[styles.subtitle, { color: c.text }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightComponent}
      {switchValue !== undefined && onSwitchChange && (
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={disabled}
          onPress={() => onSwitchChange(!switchValue)}
          accessibilityRole="switch"
          accessibilityState={{ checked: switchValue, disabled }}
          accessibilityLabel={title}
          style={[
            styles.switchTrack,
            {
              backgroundColor: switchValue ? c.brand : c.toggleOff,
              alignItems: switchValue ? "flex-end" : "flex-start",
            },
          ]}
        >
          <View style={[styles.switchKnob, { backgroundColor: c.knob }]} />
        </TouchableOpacity>
      )}
      {(value || showArrow) && (
        <View style={styles.trailing}>
          {value ? (
            <Text style={[styles.value, { color: c.text }]}>{value}</Text>
          ) : null}
          {showArrow && <SettingsIcon name="chevronRight" color={c.text} />}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={disabled}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  textContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  switchTrack: {
    width: 56,
    height: 32,
    borderRadius: 32,
    padding: 2,
    justifyContent: "center",
  },
  switchKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  disabled: {
    opacity: 0.45,
  },
});
