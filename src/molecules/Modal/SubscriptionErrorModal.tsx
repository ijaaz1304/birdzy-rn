/**
 * Subscription Error Modal
 * Shows subscription-related errors
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { Modal } from "./Modal";
import { ModalBackgroundSvg } from "./ModalBackgroundSvg";
import { Card } from "../Card";
import { useStrings } from "../../hooks/useStrings";
import { Images } from "../../assets";
import { getDarkPopupBorderStyle, getPopupPrimaryCtaStyle } from "../../design-system/modalTokens";

export interface SubscriptionErrorModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  errorMessage?: string;
  errorType?: "purchase" | "restore" | "network" | "unknown";
}

export const SubscriptionErrorModal: React.FC<SubscriptionErrorModalProps> = ({
  visible,
  onClose,
  onRetry,
  errorMessage,
  errorType = "unknown",
}) => {
  const theme = useTheme();
  const _colors = theme.colors;
  const _spacing = theme.spacing;
  const _radius = theme.radius;
  const strings = useStrings();
  const isDark = useIsDark();

  const getErrorConfig = () => {
    switch (errorType) {
      case "purchase":
        return strings.subscription.error.purchase;
      case "restore":
        return strings.subscription.error.restore;
      case "network":
        return strings.subscription.error.network;
      default:
        return strings.subscription.error.unknown;
    }
  };

  const errorConfig = getErrorConfig();

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
        <Card
          padding="large"
          variant="elevated"
          style={[styles.card, { backgroundColor: "transparent" }]}
        >
          <View style={styles.iconContainer}>
            <AppImage
              source={
                isDark ? Images.subscriptionFailedDark : Images.subscriptionFailed
              }
              style={styles.errorImage}
              resizeMode="contain"
            />
          </View>

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={styles.title}
          >
            {errorConfig.title}
          </Text>

          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.message}
          >
            {errorMessage || errorConfig.message}
          </Text>

          <View style={styles.actions}>
            <Button
              title={strings.common.buttons.close}
              variant="outline"
              size="large"
              onPress={onClose}
              style={styles.closeButton}
            />
            {onRetry && (
              <Button
                title={strings.common.buttons.retry}
                variant="primary"
                size="large"
                onPress={onRetry}
                style={[styles.retryButton, getPopupPrimaryCtaStyle(theme)]}
              />
            )}
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
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  errorImage: {
    width: 120,
    height: 120,
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  closeButton: {
    flex: 1,
  },
  retryButton: {
    flex: 1,
  },
});
