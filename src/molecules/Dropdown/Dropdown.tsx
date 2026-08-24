/**
 * Dropdown molecule component
 */

import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle, Modal, FlatList, TouchableWithoutFeedback } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { Images } from "../../assets";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Optional label text color override (UI-only). */
  labelTextColor?: string;
  /** Optional button background override (UI-only). */
  buttonBackgroundColor?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  /** Optional corner radius override (e.g. auth pill fields use 28). */
  borderRadius?: number;
  style?: ViewStyle;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onSelect,
  placeholder = "Select an option",
  label,
  labelTextColor,
  buttonBackgroundColor,
  error,
  helperText,
  disabled = false,
  size = "medium",
  fullWidth = true,
  borderRadius,
  style,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(
    options.find((opt) => opt.value === value) || null
  );

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    setSelectedOption(option);
    onSelect(option.value);
    setIsOpen(false);
  };

  const getButtonStyle = (): ViewStyle => {
    const radius =
      typeof borderRadius === "number" ? borderRadius : theme.radius.md;
    const baseStyle: ViewStyle = {
      borderRadius: radius,
      borderWidth: 1,
      borderColor: error
        ? theme.colors.error
        : isOpen
        ? theme.colors.primary
        : theme.colors.border,
      backgroundColor: disabled
        ? theme.colors.surfaceVariant
        : buttonBackgroundColor ?? theme.colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingVertical: theme.spacing[2],
        paddingHorizontal: theme.spacing[3],
        minHeight: 36,
      },
      medium: {
        paddingVertical: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        minHeight: 44,
      },
      large: {
        paddingVertical: theme.spacing[4],
        paddingHorizontal: theme.spacing[5],
        minHeight: 52,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...(disabled && { opacity: 0.5 }),
    };
  };

  const iconSize = size === "small" ? 18 : size === "large" ? 24 : 20;
  /** Match Input field text (15px) for large; keep smaller sizes compact. */
  const buttonFontSize = size === "small" ? 12 : size === "large" ? 15 : 14;

  return (
    <View style={[fullWidth && styles.fullWidth, style]}>
      {label && (
        <Text
          variant="label"
          size="medium"
          color={error ? "error" : "text"}
          weight="medium"
          style={[
            styles.label,
            labelTextColor ? { color: labelTextColor } : null,
          ]}
        >
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          {selectedOption?.icon && (
            <Icon
              name={selectedOption.icon}
              size={iconSize}
              color={
                selectedOption ? theme.colors.text : theme.colors.textTertiary
              }
              style={styles.leftIcon}
            />
          )}
          <Text
            variant="body"
            size={size === "large" ? "large" : "medium"}
            color={selectedOption ? "text" : "textTertiary"}
            style={[styles.buttonText, { fontSize: buttonFontSize }]}
            numberOfLines={1}
          >
            {selectedOption?.label || placeholder}
          </Text>
        </View>
        <AppImage
          source={isDark ? Images.arrowDownDark : Images.arrowDownLight}
          style={[
            styles.rightIconImage,
            { width: iconSize, height: iconSize },
            isOpen && styles.rotatedIcon,
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>
      {(error || helperText) && (
        <Text
          variant="body"
          size="small"
          color={error ? "error" : "textSecondary"}
          style={styles.helperText}
        >
          {error || helperText}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.colors.surface,
                    ...theme.shadows.xl,
                  },
                ]}
              >
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <Text variant="title" size="medium" weight="semibold">
                    {label || "Select an option"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsOpen(false)}
                    style={styles.closeButton}
                  >
                    <Icon name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => {
                    const isSelected = selectedOption?.value === item.value;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionItem,
                          {
                            backgroundColor: isSelected
                              ? theme.colors.primaryLight + "20"
                              : "transparent",
                            opacity: item.disabled ? 0.5 : 1,
                          },
                        ]}
                        onPress={() => handleSelect(item)}
                        disabled={item.disabled}
                      >
                        {item.icon && (
                          <Icon
                            name={item.icon}
                            size={20}
                            color={theme.colors.text}
                            style={styles.optionIcon}
                          />
                        )}
                        <Text
                          variant="body"
                          size="medium"
                          color={isSelected ? "primary" : "text"}
                          weight={isSelected ? "semibold" : "normal"}
                          style={styles.optionText}
                        >
                          {item.label}
                        </Text>
                        {isSelected && (
                          <Icon
                            name="check"
                            size={20}
                            color={theme.colors.primary}
                            style={styles.checkIcon}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ItemSeparatorComponent={() => (
                    <View
                      style={[
                        styles.separator,
                        { backgroundColor: theme.colors.borderLight },
                      ]}
                    />
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: "100%",
  },
  label: {
    marginBottom: 8,
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  leftIcon: {
    marginRight: 8,
  },
  buttonText: {
    flex: 1,
  },
  rightIcon: {
    marginLeft: 8,
  },
  rightIconImage: {
    marginLeft: 8,
  },
  rotatedIcon: {
    transform: [{ rotate: "180deg" }],
  },
  helperText: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: OVERLAY_COLORS.BACKDROP_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  separator: {
    height: 1,
    marginLeft: 16,
  },
});
