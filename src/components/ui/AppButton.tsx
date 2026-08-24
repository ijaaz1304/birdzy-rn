import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, GestureResponderEvent } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Space, Radius, Typography } from "../../design";

import { FONTS } from "../../common/typography";

type Variant = "primary" | "secondary" | "text" | "ghost";
type Size = "large" | "medium" | "small" | "xsmall";

type Props = {
  title: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const AppButton: React.FC<Props> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const sizeMap = {
    large: {
      height: 48,
      paddingHorizontal: Space.lg,
      font: Typography.presets.button16,
    },
    medium: {
      height: 44,
      paddingHorizontal: Space.md,
      font: Typography.presets.button14,
    },
    small: {
      height: 36,
      paddingHorizontal: Space.sm,
      font: Typography.presets.caption12,
    },
    xsmall: {
      height: 28,
      paddingHorizontal: Space.xs,
      font: Typography.presets.caption12,
    },
  };

  const { height, paddingHorizontal, font } = sizeMap[size];

  const getColors = () => {
    if (disabled) {
      return {
        backgroundColor:
          variant === "text" || variant === "ghost"
            ? "transparent"
            : colors.surfaceBrand,
        textColor: colors.textTertiary,
        borderColor:
          variant === "secondary" || variant === "ghost"
            ? colors.borderSecondary
            : "transparent",
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.surfaceBrand,
          textColor: colors.textInverse,
          borderColor: "transparent",
        };
      case "secondary":
        return {
          backgroundColor: colors.surfacePrimary,
          textColor: colors.textPrimary,
          borderColor: colors.borderBrand,
        };
      case "text":
        return {
          backgroundColor: "transparent",
          textColor: colors.textPrimary,
          borderColor: "transparent",
        };
      case "ghost":
        return {
          backgroundColor: colors.surfaceAccentBrown,
          textColor: colors.textBrand,
          borderColor: colors.surfaceAccentBrown,
        };
      default:
        return {
          backgroundColor: colors.surfacePrimary,
          textColor: colors.textPrimary,
          borderColor: "transparent",
        };
    }
  };

  const { backgroundColor, textColor, borderColor } = getColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === "secondary" || variant === "ghost" ? 1 : 0,
          height,
          paddingHorizontal,
          borderRadius: Radius.button,
          alignSelf: "flex-start",
          opacity: disabled ? 1 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: textColor,
            fontSize: font.fontSize,
            fontFamily: FONTS.medium,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default AppButton;

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
});
