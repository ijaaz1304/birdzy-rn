import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, GestureResponderEvent } from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useTheme } from "../../design/theme";
import { Radius } from "../../design";

type Variant = "primary" | "secondary" | "ghost";
type Size = "large" | "medium" | "small" | "xsmall";

type Props = {
  icon: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
};

const AppIconButton: React.FC<Props> = ({
  icon,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();

  const sizeMap = {
    large: 48,
    medium: 44,
    small: 36,
    xsmall: 28,
  };

  const iconSize = {
    large: 24,
    medium: 24,
    small: 20,
    xsmall: 16,
  };

  const diameter = sizeMap[size];
  const iconPx = iconSize[size];

  const getColors = () => {
    if (disabled) {
      return {
        backgroundColor:
          variant === "ghost" ? "transparent" : colors.surfaceSecondary,
        borderColor:
          variant === "secondary" || variant === "ghost"
            ? colors.borderSecondary
            : "transparent",
        iconColor:
          variant === "ghost" ? colors.textTertiary : colors.textInverse,
      };
    }

    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.surfaceBrand,
          borderColor: colors.textInverse,
          iconColor: colors.textInverse,
        };
      case "secondary":
        return {
          backgroundColor: colors.surfacePrimary,
          borderColor: colors.border0,
          iconColor: colors.textPrimary,
        };
      case "ghost":
        return {
          backgroundColor: colors.surfaceAccentBrown,
          borderColor: colors.textBrand,
          iconColor: colors.surfaceAccentBrown,
        };
      default:
        return {
          backgroundColor: colors.surfaceSecondary,
          borderColor: "transparent",
          iconColor: colors.textTertiary,
        };
    }
  };

  const { backgroundColor, borderColor, iconColor } = getColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.button,
        {
          width: diameter,
          height: diameter,
          borderRadius: Radius.full,
          backgroundColor,
          borderColor,
          borderWidth: variant === "secondary" || variant === "ghost" ? 1 : 0,
        },
        style,
      ]}
    >
      <Feather name={icon} size={iconPx} color={iconColor} />
    </TouchableOpacity>
  );
};

export default AppIconButton;

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
});
