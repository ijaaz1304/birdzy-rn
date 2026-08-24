/**
 * MultiSelectDropdown Component
 * Allows selecting multiple values from a dropdown list
 */

import { AppImage } from "@/components/AppImage";
import React, { useState } from "react";
import { View, StyleSheet, Modal, TouchableOpacity, FlatList } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Chip } from "../../atoms";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { DropdownOption } from "../Dropdown/Dropdown";
import { Images } from "../../assets";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";

export interface MultiSelectDropdownProps {
  label?: string;
  /** Optional label text color override (UI-only). */
  labelTextColor?: string;
  /** Optional dropdown background override (UI-only). */
  inputBackgroundColor?: string;
  options: DropdownOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  labelTextColor,
  inputBackgroundColor,
  options,
  selectedValues = [],
  onSelectionChange,
  placeholder = "Select options",
  error,
  disabled = false,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const isDark = useIsDark();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <View style={styles.container}>
      {label && (
        <Text
          variant="label"
          size="small"
          style={{
            marginBottom: spacing[1],
            ...(labelTextColor ? { color: labelTextColor } : null),
          }}
        >
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.dropdown,
          {
            backgroundColor: inputBackgroundColor ?? colors.surfacePrimary,
            borderColor: error ? colors.error : colors.border,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <View style={styles.selectedContainer}>
          {selectedLabels.length > 0 ? (
            <View style={styles.chipsContainer}>
              {selectedLabels.slice(0, 2).map((label, index) => (
                <Chip
                  key={index}
                  label={label}
                  size="small"
                  variant="filled"
                  style={{ marginRight: spacing[1] }}
                />
              ))}
              {selectedLabels.length > 2 && (
                <Text variant="body" size="small" color="textSecondary">
                  +{selectedLabels.length - 2} more
                </Text>
              )}
            </View>
          ) : (
            <Text variant="body" size="medium" color="textSecondary">
              {placeholder}
            </Text>
          )}
        </View>
        <AppImage
          source={isDark ? Images.arrowDownDark : Images.arrowDownLight}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {error && (
        <Text
          variant="body"
          size="small"
          color="error"
          style={{ marginTop: spacing[1] }}
        >
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surfacePrimary },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: colors.border }]}
            >
              <Text variant="title" size="medium" weight="semibold">
                {label || "Select Options"}
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = selectedValues.includes(item.value);
                return (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      {
                        backgroundColor: isSelected
                          ? colors.surfaceBrand
                          : "transparent",
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => toggleOption(item.value)}
                  >
                    <Text variant="body" size="medium">
                      {item.label}
                    </Text>
                    {isSelected && (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectedContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  chipsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: OVERLAY_COLORS.BACKDROP_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
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
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing[4],
    borderBottomWidth: 1,
  },
});
