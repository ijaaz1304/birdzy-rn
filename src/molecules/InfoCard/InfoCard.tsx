import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { UI_COLORS } from "../../constants/colorConstants";

import { spacing } from "../../design-system/spacing";

export interface InfoCardProps extends ViewProps {
  children: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  children,
  style,
  ...props
}) => {
  const theme = useTheme();

  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfacePrimary,
          shadowColor: UI_COLORS.SHADOW,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",

    // iOS shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    // Android elevation
    elevation: 4,
  },
});
