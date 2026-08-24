import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { PrimaryActionCardProps } from "../../types/ui";
import { Text } from "../../atoms/Text";
import { useTheme, useIsDark } from "../../hooks/useTheme";

export const PrimaryActionCard = ({
  icon,
  title,
  description,
  buttonLabel,
  onPress,
}: PrimaryActionCardProps) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const isDark = useIsDark();

  // Use surfaceBrand2Light for dark mode, surfaceBrand2Accent for light mode
  const cardBackgroundColor = isDark
    ? theme.colors.surfaceBrand2Light
    : theme.colors.surfaceBrand2Accent;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBackgroundColor,
          borderRadius: radius.lg,
          padding: spacing[4],
          marginTop: spacing[3],
        },
      ]}
    >
      {icon}
      <Text weight="semibold" style={{ marginTop: spacing[2] }}>
        {title}
      </Text>
      <Text color="textSecondary" style={{ marginTop: spacing[1] }}>
        {description}
      </Text>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.warning,
            borderRadius: radius.xl,
            marginTop: spacing[3],
            paddingVertical: 10,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text color="onPrimary">{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
  },
  button: {
    alignItems: "center",
    width: "100%",
  },
});
