/**
 * Card molecule component
 */

import React from "react";
import { View, TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";

export interface CardProps extends Omit<TouchableOpacityProps, "style"> {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: "elevated" | "outlined" | "filled";
  padding?: "none" | "small" | "medium" | "large";
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  variant = "elevated",
  padding = "medium",
  onPress,
  style,
  contentStyle,
  ...props
}) => {
  const theme = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface,
    };

    const paddingMap: Record<string, number> = {
      none: 0,
      small: theme.spacing[3],
      medium: theme.spacing[4],
      large: theme.spacing[6],
    };

    const variantStyles: Record<string, ViewStyle> = {
      elevated: {
        ...(theme.shadows?.md || {}),
        borderWidth: 0,
      },
      outlined: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...(theme.shadows?.none || {}),
      },
      filled: {
        backgroundColor: theme.colors.surfaceVariant,
        borderWidth: 0,
        ...(theme.shadows?.none || {}),
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      padding: paddingMap[padding],
    };
  };

  const content = (
    <>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text
              variant="title"
              size="medium"
              weight="semibold"
              style={styles.title}
            >
              {title}
            </Text>
          )}
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
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getCardStyle(), style]}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 0,
  },
  content: {
    flex: 1,
  },
});
