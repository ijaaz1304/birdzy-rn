/**
 * Confirmation Modal component
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Button } from "../../atoms";
import { Icon } from "../../atoms";
import { Modal } from "./Modal";
import { ModalBackgroundSvg } from "./ModalBackgroundSvg";
import { Card } from "../Card";
import { getDarkPopupBorderStyle, getPopupPrimaryCtaStyle, getPopupPrimaryCtaTextColor, getPopupSecondaryCtaStyle, getPopupSecondaryCtaTextColor } from "../../design-system/modalTokens";

export interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "error";
  icon?: string;
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  icon,
  loading = false,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      animationType="fade"
      contentStyle={styles.modalContent}
    >
      <View
        style={[
          styles.cardWrapper,
          { borderRadius: theme.radius["2xl"] },
          getDarkPopupBorderStyle(theme),
        ]}
      >
        <ModalBackgroundSvg
          variant="70"
          dark={isDark}
          style={styles.backgroundImage}
        />
        <Card padding="large" variant="elevated" style={styles.card}>
          {icon && (
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      confirmVariant === "error"
                        ? theme.colors.error + "20"
                        : theme.colors.primary + "20",
                  },
                ]}
              >
                <Icon
                  name={icon}
                  size={48}
                  color={
                    confirmVariant === "error"
                      ? theme.colors.error
                      : theme.colors.primary
                  }
                />
              </View>
            </View>
          )}

          <View style={styles.textContainer}>
            <Text
              variant="headline"
              size="medium"
              weight="semibold"
              style={styles.title}
            >
              {title}
            </Text>
            <Text
              variant="body"
              size="medium"
              color="textSecondary"
              style={styles.message}
            >
              {message}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="outline"
              size="large"
              onPress={onClose}
              disabled={loading}
              style={[styles.cancelButton, getPopupSecondaryCtaStyle(theme)]}
              textStyle={{ color: getPopupSecondaryCtaTextColor(theme) }}
            />
            <Button
              title={confirmLabel}
              variant={confirmVariant === "error" ? "primary" : confirmVariant}
              size="large"
              onPress={handleConfirm}
              loading={loading}
              style={[styles.confirmButton, getPopupPrimaryCtaStyle(theme)]}
              textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "90%",
    maxWidth: 400,
  },
  cardWrapper: {
    position: "relative",
    overflow: "hidden",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: "transparent",
    zIndex: 1,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
