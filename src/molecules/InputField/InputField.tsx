/**
 * InputField molecule component
 */

import React, { useState } from "react";
import { View, TextInput, TextInputProps, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Icon } from "../../atoms";

export interface InputFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  /** Optional label text color override (UI-only). */
  labelTextColor?: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  variant?: "outlined" | "filled" | "underlined";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  labelTextColor,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = "outlined",
  size = "medium",
  fullWidth = true,
  containerStyle,
  inputStyle,
  secureTextEntry,
  ...props
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getInputStyle = (): ViewStyle & TextStyle => {
    const baseStyle: ViewStyle & TextStyle = {
      borderRadius: theme.radius.md,
      backgroundColor:
        variant === "filled" ? theme.colors.surfaceVariant : "transparent",
      borderWidth: variant === "underlined" ? 0 : 1,
      borderBottomWidth: variant === "underlined" ? 1 : undefined,
      borderColor: error
        ? theme.colors.error
        : isFocused
        ? theme.colors.primary
        : theme.colors.border,
      color: theme.colors.text,
    };

    const sizeStyles: Record<string, ViewStyle & TextStyle> = {
      small: {
        paddingVertical: theme.spacing[2],
        paddingHorizontal: theme.spacing[3],
        fontSize: 14,
        minHeight: 36,
      },
      medium: {
        paddingVertical: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        fontSize: 16,
        minHeight: 44,
      },
      large: {
        paddingVertical: theme.spacing[4],
        paddingHorizontal: theme.spacing[5],
        fontSize: 18,
        minHeight: 52,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...(leftIcon && { paddingLeft: theme.spacing[10] }),
      ...(rightIcon || secureTextEntry
        ? { paddingRight: theme.spacing[10] }
        : {}),
    };
  };

  const iconSize = size === "small" ? 18 : size === "large" ? 24 : 20;
  const iconColor = error
    ? theme.colors.error
    : isFocused
    ? theme.colors.primary
    : theme.colors.textSecondary;

  return (
    <View style={[fullWidth && styles.fullWidth, containerStyle]}>
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
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon name={leftIcon} size={iconSize} color={iconColor} />
          </View>
        )}
        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {(rightIcon || secureTextEntry) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={() => {
              if (secureTextEntry) {
                setIsPasswordVisible(!isPasswordVisible);
              } else {
                onRightIconPress?.();
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={
                secureTextEntry
                  ? isPasswordVisible
                    ? "eye-off"
                    : "eye"
                  : rightIcon || "eye"
              }
              size={iconSize}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
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
  inputContainer: {
    position: "relative",
  },
  leftIconContainer: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  rightIconContainer: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  helperText: {
    marginTop: 4,
  },
});
