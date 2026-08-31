/**
 * FloatingActionButton atom component
 * Dynamic FAB with configurable icon, label, position, and styling
 */

import React from "react";
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle } from "react-native";
import { CreatePlusIcon } from "../../assets";
import { FONTS } from "../../common/typography";
import { useTheme } from "../../hooks/useTheme";
import { FEED_COLORS, UI_COLORS } from "../../constants/colorConstants";
import { Icon } from "../Icon";
import { Text } from "../Text";

import { spacing } from "../../design-system/spacing";

export interface FloatingActionButtonProps
  extends Omit<TouchableOpacityProps, "style"> {
  icon?: string;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  variant?: "primary" | "secondary" | "accent" | "feed";
  size?: "small" | "medium" | "large";
  bottomOffset?: number;
  rightOffset?: number;
  leftOffset?: number;
  topOffset?: number;
  style?: ViewStyle;
  iconColor?: string;
  backgroundColor?: string;
  labelColor?: string;
}

const SIZE_MAP = {
  small: { icon: 18, padding: 12, fontSize: 12, height: 40 },
  medium: { icon: 22, padding: spacing[4], fontSize: 14, height: 44 },
  large: { icon: 26, padding: 20, fontSize: 16, height: 52 },
} as const;

/** Figma 8035:46238 — Create chip */
const FEED_CREATE = {
  icon: 24,
  fontSize: 16,
  lineHeight: 24,
  paddingHorizontal: 16,
  paddingVertical: 10,
  gap: 8,
  height: 44,
} as const;

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  label,
  position = "bottom-right",
  variant = "primary",
  size = "medium",
  bottomOffset = 80,
  rightOffset = 20,
  leftOffset = 20,
  topOffset = 20,
  style,
  iconColor,
  backgroundColor,
  labelColor,
  ...props
}) => {
  const theme = useTheme();
  const { icon: iconSize, padding, fontSize, height } = SIZE_MAP[size];
  const isFeedCreate = variant === "feed";

  const getColors = () => {
    if (backgroundColor) {
      return {
        backgroundColor,
        borderColor: undefined as string | undefined,
        borderWidth: 0,
        iconColor: iconColor || theme.colors.textInverse,
        labelColor: labelColor || theme.colors.textInverse,
      };
    }

    switch (variant) {
      case "feed": {
        const isDark = theme.mode === "dark";
        return {
          backgroundColor: isDark
            ? FEED_COLORS.FAB.DARK.BACKGROUND
            : FEED_COLORS.FAB.LIGHT.BACKGROUND,
          borderColor: undefined as string | undefined,
          borderWidth: 0,
          iconColor:
            iconColor ||
            (isDark
              ? FEED_COLORS.FAB.DARK.TEXT
              : FEED_COLORS.FAB.LIGHT.TEXT),
          labelColor:
            labelColor ||
            (isDark
              ? FEED_COLORS.FAB.DARK.TEXT
              : FEED_COLORS.FAB.LIGHT.TEXT),
        };
      }
      case "primary":
        return {
          backgroundColor: theme.colors.surfaceBrand,
          borderColor: undefined as string | undefined,
          borderWidth: 0,
          iconColor: iconColor || theme.colors.textInverse,
          labelColor: labelColor || theme.colors.textInverse,
        };
      case "secondary":
        return {
          backgroundColor: theme.colors.surfaceAccentGreen,
          borderColor: undefined as string | undefined,
          borderWidth: 0,
          iconColor: iconColor || theme.colors.primary,
          labelColor: labelColor || theme.colors.primary,
        };
      case "accent":
        return {
          backgroundColor: theme.colors.surfaceAccentBrown,
          borderColor: undefined as string | undefined,
          borderWidth: 0,
          iconColor: iconColor || theme.colors.textBrand,
          labelColor: labelColor || theme.colors.textBrand,
        };
      default:
        return {
          backgroundColor: theme.colors.surfaceBrand,
          borderColor: undefined as string | undefined,
          borderWidth: 0,
          iconColor: iconColor || theme.colors.textInverse,
          labelColor: labelColor || theme.colors.textInverse,
        };
    }
  };

  const {
    backgroundColor: bgColor,
    borderColor,
    borderWidth,
    iconColor: finalIconColor,
    labelColor: finalLabelColor,
  } = getColors();

  const feedBorderRadius =
    variant === "feed" ? FEED_COLORS.FAB.BORDER_RADIUS : theme.radius.full;

  const getPositionStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: "absolute",
      // Stay above full-screen siblings (e.g. Feed content layer with zIndex: 1).
      zIndex: 10,
      elevation: isFeedCreate ? 0 : 8,
    };

    switch (position) {
      case "bottom-right":
        return {
          ...baseStyle,
          bottom: bottomOffset,
          right: rightOffset,
        };
      case "bottom-left":
        return {
          ...baseStyle,
          bottom: bottomOffset,
          left: leftOffset,
        };
      case "top-right":
        return {
          ...baseStyle,
          top: topOffset,
          right: rightOffset,
        };
      case "top-left":
        return {
          ...baseStyle,
          top: topOffset,
          left: leftOffset,
        };
      default:
        return {
          ...baseStyle,
          bottom: bottomOffset,
          right: rightOffset,
        };
    }
  };

  const resolvedIconSize = isFeedCreate ? FEED_CREATE.icon : iconSize;
  const resolvedFontSize = isFeedCreate ? FEED_CREATE.fontSize : fontSize;

  return (
    <TouchableOpacity
      onPress={props.onPress}
      activeOpacity={0.8}
      disabled={props.disabled}
      style={[
        styles.fab,
        isFeedCreate && styles.fabFeed,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth,
          paddingHorizontal: isFeedCreate
            ? FEED_CREATE.paddingHorizontal
            : label
              ? 16
              : padding,
          paddingVertical: isFeedCreate
            ? FEED_CREATE.paddingVertical
            : label
              ? 0
              : padding,
          height: isFeedCreate
            ? FEED_CREATE.height
            : label
              ? height
              : undefined,
          minHeight: isFeedCreate
            ? FEED_CREATE.height
            : label
              ? height
              : undefined,
          borderRadius: feedBorderRadius,
          gap: isFeedCreate && icon && label ? FEED_CREATE.gap : 0,
          ...getPositionStyle(),
        },
        style,
      ]}
      {...props}
    >
      {icon === "plus" && isFeedCreate ? (
        <CreatePlusIcon
          width={resolvedIconSize}
          height={resolvedIconSize}
          color={finalIconColor}
        />
      ) : icon ? (
        <Icon name={icon} size={resolvedIconSize} color={finalIconColor} />
      ) : null}
      {label && (
        <Text
          variant="body"
          size="small"
          weight={isFeedCreate ? "medium" : "semibold"}
          allowFontScaling={false}
          style={[
            styles.label,
            {
              marginLeft: isFeedCreate ? 0 : icon ? 8 : 0,
              fontSize: resolvedFontSize,
              lineHeight: isFeedCreate ? FEED_CREATE.lineHeight : undefined,
              fontFamily: isFeedCreate ? FONTS.medium : undefined,
              color: finalLabelColor,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: UI_COLORS.SHADOW,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  fabFeed: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  label: {
    // Label styles are applied inline for dynamic fontSize
  },
});
