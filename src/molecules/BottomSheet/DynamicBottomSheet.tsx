/**
 * Dynamic Bottom Sheet – same style as Rate Us / Feedback (shared BackgroundHeader).
 * Uses BottomSheetWithHeader. Title, subtitle, optional children, buttons.
 */

import React, { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "../../atoms";
import { BottomSheetWithHeader } from "../Modal/BottomSheetWithHeader";

export interface DynamicBottomSheetButton {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

export interface DynamicBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  heightPercent?: 50 | 70;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  buttons: DynamicBottomSheetButton[];
  enableBackdropDismiss?: boolean;
}

export const DynamicBottomSheet: React.FC<DynamicBottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  buttons,
  heightPercent,
}) => {
  return (
    <BottomSheetWithHeader
      visible={visible}
      onClose={onClose}
      heightPercent={heightPercent}
    >
      <Text variant="title" size="large" weight="semibold" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={styles.subtitle}
        >
          {subtitle}
        </Text>
      ) : null}
      {children ? <View style={styles.content}>{children}</View> : null}
      <View style={styles.actions}>
        {buttons.map((button, index) => (
          <Button
            key={index}
            title={button.label}
            variant={button.variant || "primary"}
            size="large"
            onPress={button.onPress}
            loading={button.loading}
            disabled={button.disabled}
            style={[
              styles.button,
              buttons.length === 1 && styles.fullWidthButton,
              buttons.length > 1 && styles.flexButton,
            ]}
          />
        ))}
      </View>
    </BottomSheetWithHeader>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
  },
  content: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  button: {
    minWidth: 100,
  },
  fullWidthButton: {
    width: "100%",
  },
  flexButton: {
    flex: 1,
  },
});
