/**
 * Plant of the Day Refresh Modal
 * Shows when free user tries to refresh after limit
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { Modal } from "./Modal";
import { ModalBackgroundSvg } from "./ModalBackgroundSvg";
import { Card } from "../Card";
import { useStrings } from "../../hooks/useStrings";
import { getDarkPopupBorderStyle, getPopupPrimaryCtaStyle } from "../../design-system/modalTokens";

export interface MushroomOfTheDayRefreshModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const MushroomOfTheDayRefreshModal: React.FC<
  MushroomOfTheDayRefreshModalProps
> = ({ visible, onClose, onUpgrade }) => {
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
          variant="70"
          dark={isDark}
          style={styles.backgroundImage}
        />
        <Card
          padding="large"
          variant="elevated"
          style={[styles.card, { backgroundColor: "transparent" }]}
        >
          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={styles.title}
          >
            {strings.home.birdOfTheDay.refreshModal.title}
          </Text>

          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={styles.message}
          >
            {strings.home.birdOfTheDay.refreshModal.message}
          </Text>

          <View style={styles.actions}>
            <Button
              title={strings.common.buttons.close}
              variant="outline"
              size="large"
              onPress={onClose}
              style={styles.closeButton}
            />
            <Button
              title={strings.home.birdOfTheDay.refreshModal.upgrade}
              variant="primary"
              size="large"
              onPress={onUpgrade}
              style={[styles.upgradeButton, getPopupPrimaryCtaStyle(theme)]}
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
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  closeButton: {
    flex: 1,
  },
  upgradeButton: {
    flex: 1,
  },
});
