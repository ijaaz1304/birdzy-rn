/**
 * Multi-Value Chip Input Component
 * Allows adding/removing multiple text values as chips
 * Used for Synonyms, Commonly Found In, Color, Elements, Common Impurities, etc.
 */

import React, { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../hooks/useTheme";
import { Text, Chip } from "../../atoms";

/** Single-line field border radius to match Edit screen */
const INPUT_BORDER_RADIUS = 30;

export interface MultiValueChipInputProps {
  label?: string;
  /** When 'inside', label is shown inside the same bordered row as the input, with Add next to it. */
  labelPosition?: "above" | "inside";
  /** Optional label text color override (UI-only). */
  labelTextColor?: string;
  /** Optional input background override (UI-only). */
  inputBackgroundColor?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  chipVariant?: "filled" | "outlined";
  maxValues?: number;
}

export const MultiValueChipInput: React.FC<MultiValueChipInputProps> = ({
  label,
  labelPosition = "above",
  labelTextColor,
  inputBackgroundColor,
  values = [],
  onChange,
  placeholder = "Enter value and press Add",
  error,
  disabled = false,
  chipVariant = "outlined",
  maxValues,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;

  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      if (maxValues && values.length >= maxValues) {
        return;
      }
      onChange([...values, trimmed]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Enter" || e.nativeEvent.key === " ") {
      handleAdd();
    }
  };

  const bgColor = inputBackgroundColor ?? colors.surfacePrimary;
  const borderColor = error ? colors.error : colors.border;
  const addDisabled =
    disabled ||
    !inputValue.trim() ||
    (maxValues ? values.length >= maxValues : false);

  return (
    <View style={styles.container}>
      {label && labelPosition === "above" && (
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
      {/* Input Row: when labelPosition='inside', one bordered row [ label | input ] [ Add ]; else [ input ] [ Add ] */}
      {labelPosition === "inside" ? (
        <View style={styles.outerRow}>
          <View
            style={[
              styles.inputRow,
              {
                flex: 1,
                backgroundColor: bgColor,
                borderColor,
                borderRadius: INPUT_BORDER_RADIUS,
                borderWidth: 1,
                paddingLeft: spacing[3],
                paddingRight: spacing[2],
                alignItems: "center",
                gap: 0,
              },
            ]}
          >
            {label && (
              <Text
                variant="label"
                size="small"
                numberOfLines={1}
                style={[
                  styles.labelInside,
                  labelTextColor
                    ? { color: labelTextColor }
                    : { color: colors.textSecondary },
                ]}
              >
                {label}
              </Text>
            )}
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: "transparent",
                  borderWidth: 0,
                  paddingLeft: spacing[2],
                  flex: 1,
                  color: colors.textPrimary,
                  opacity: disabled ? 0.6 : 1,
                },
              ]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={placeholder}
              placeholderTextColor={colors.textTertiary}
              onSubmitEditing={handleAdd}
              onKeyPress={handleKeyPress}
              editable={!disabled}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            disabled={addDisabled}
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
                borderRadius: INPUT_BORDER_RADIUS,
                opacity: addDisabled ? 0.5 : 1,
              },
            ]}
          >
            <MaterialIcons name="add" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: bgColor,
                borderColor,
                borderRadius: radius.md,
                borderWidth: 1,
                color: colors.textPrimary,
                opacity: disabled ? 0.6 : 1,
              },
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={handleAdd}
            onKeyPress={handleKeyPress}
            editable={!disabled}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleAdd}
            disabled={addDisabled}
            style={[
              styles.addButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                opacity: addDisabled ? 0.5 : 1,
              },
            ]}
          >
            <MaterialIcons name="add" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Chips Display */}
      {values.length > 0 && (
        <View style={[styles.chipsContainer, { marginTop: spacing[2] }]}>
          {values.map((value, index) => (
            <Chip
              key={index}
              label={value}
              variant={chipVariant}
              size="small"
              onClose={() => handleRemove(index)}
              style={{ marginRight: spacing[1], marginBottom: spacing[1] }}
            />
          ))}
        </View>
      )}

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

      {maxValues && values.length >= maxValues && (
        <Text
          variant="body"
          size="small"
          color="textSecondary"
          style={{ marginTop: spacing[1] }}
        >
          Maximum {maxValues} values reached
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  outerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  labelInside: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
