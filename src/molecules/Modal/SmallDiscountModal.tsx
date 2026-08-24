/**
 * Small Discount Modal (50% off)
 * Compact discount notification
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button, Chip } from "../../atoms";
import { Modal } from "./Modal";
import { ModalBackgroundSvg } from "./ModalBackgroundSvg";
import { Card } from "../Card";
import { useStrings } from "../../hooks/useStrings";
import { getDarkPopupBorderStyle } from "../../design-system/modalTokens";

export interface SmallDiscountModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  percentage?: number;
}

export const SmallDiscountModal: React.FC<SmallDiscountModalProps> = ({
  visible,
  onClose,
  onSubscribe,
  percentage = 50,
}) => {
  const theme = useTheme();
  const _colors = theme.colors;
  const _spacing = theme.spacing;
  const _radius = theme.radius;
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
          variant="50"
          dark={isDark}
          style={styles.backgroundImage}
        />
        <Card
          padding="medium"
          variant="elevated"
          style={[styles.card, { backgroundColor: "transparent" }]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon isDark={isDark} size={20} />
          </TouchableOpacity>

          <View style={styles.content}>
            <Chip
              label={`${percentage}% OFF`}
              variant="filled"
              size="small"
              color="warning"
              style={styles.badge}
            />

            <Text
              variant="title"
              size="medium"
              weight="bold"
              style={styles.title}
            >
              {strings.discount.subsequentVisit.title}
            </Text>

            <Text
              variant="body"
              size="small"
              color="textSecondary"
              style={styles.subtitle}
            >
              {strings.discount.subsequentVisit.subtitle}
            </Text>

            <Button
              title={strings.discount.subsequentVisit.ctaText}
              variant="primary"
              size="medium"
              onPress={onSubscribe}
              fullWidth
              style={styles.button}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "85%",
    maxWidth: 350,
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
    position: "relative",
    zIndex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  content: {
    alignItems: "center",
    marginTop: 8,
  },
  badge: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  button: {
    marginBottom: 0,
  },
});
