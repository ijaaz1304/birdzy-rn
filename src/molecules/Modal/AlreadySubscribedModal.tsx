/**
 * Already Subscribed Modal
 * Shows when user tries to subscribe but already has an active subscription
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { Modal } from "./Modal";
import { ModalBackgroundSvg } from "./ModalBackgroundSvg";
import { Card } from "../Card";
import { useStrings } from "../../hooks/useStrings";
import { getDarkPopupBorderStyle } from "../../design-system/modalTokens";

export interface AlreadySubscribedModalProps {
  visible: boolean;
  onClose: () => void;
  onViewStatus: () => void;
  planName?: string;
}

export const AlreadySubscribedModal: React.FC<AlreadySubscribedModalProps> = ({
  visible,
  onClose,
  onViewStatus,
  planName,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();
  const isDark = useIsDark();

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
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.success + "20",
                },
              ]}
            >
              <MaterialIcons
                name="check-circle"
                size={48}
                color={colors.success}
              />
            </View>
          </View>

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={styles.title}
          >
            {strings.subscription.alreadySubscribed.title}
          </Text>

          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.message}
          >
            {strings.subscription.alreadySubscribed.message}
          </Text>

          {planName && (
            <View
              style={[
                styles.planBadge,
                {
                  backgroundColor: colors.primary + "20",
                  borderRadius: radius.md,
                  padding: spacing[2],
                  marginBottom: 24,
                },
              ]}
            >
              <Text
                variant="body"
                size="small"
                weight="semibold"
                style={{ color: colors.primary }}
              >
                {planName}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title={strings.common.buttons.close}
              variant="outline"
              size="large"
              onPress={onClose}
              style={styles.closeButton}
            />
            <Button
              title={strings.subscription.buttons.manageSubscription}
              variant="primary"
              size="large"
              onPress={onViewStatus}
              style={styles.viewButton}
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
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
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
  planBadge: {
    alignSelf: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  closeButton: {
    flex: 1,
  },
  viewButton: {
    flex: 1,
  },
});
