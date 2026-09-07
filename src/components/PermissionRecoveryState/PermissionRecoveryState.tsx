/**
 * Inline permission recovery state — not a modal/popup.
 */

import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Text } from "../../atoms";
import { useTheme } from "../../hooks/useTheme";

type PermissionRecoveryStateProps = {
  icon?: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
};

export const PermissionRecoveryState: React.FC<PermissionRecoveryStateProps> = ({
  icon = "settings",
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <MaterialIcons
        name={icon}
        size={56}
        color={theme.colors.textTertiary}
      />
      <Text variant="body" size="medium" weight="medium" style={styles.title}>
        {title}
      </Text>
      <Text
        variant="body"
        size="small"
        color="textSecondary"
        style={styles.subtitle}
      >
        {subtitle}
      </Text>
      <TouchableOpacity
        onPress={onAction}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.85}
      >
        <Text variant="body" size="medium" weight="semibold" color="surface">
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    minWidth: 180,
    alignItems: "center",
  },
});
