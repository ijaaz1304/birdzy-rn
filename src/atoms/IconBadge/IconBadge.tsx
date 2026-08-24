import React from "react";
import { View, StyleSheet } from "react-native";
import { IconBadgeProps } from "../../types/ui";
import { useTheme } from "../../hooks/useTheme";

export const IconBadge = ({ icon }: IconBadgeProps) => {
  const theme = useTheme();
  const colors = theme.colors;
  const radius = theme.radius;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.md,
        },
      ]}
    >
      {icon}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
