import { ScrollView, useWindowDimensions } from "react-native";
/**
 * Subscription Success Modal — shown after a successful purchase or restore.
 * Figma overlay: rgba(0,0,0,0.8) backdrop + centered welcome card.
 */

import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { SUBSCRIPTION_COLORS } from "../../constants/colorConstants";
import { FONTS } from "../../common/typography";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

const WELCOME_BACKDROP = "rgba(0, 0, 0, 0.8)";

export interface SubscriptionSuccessModalProps {
  visible: boolean;
  onDismiss: () => void;
  appName?: string;
  ctaLabel?: string;
}

export const SubscriptionSuccessModal: React.FC<
  SubscriptionSuccessModalProps
> = ({ visible, onDismiss, appName = "Birdzy", ctaLabel = "Got it" }) => {
  const { height: windowHeight } = useWindowDimensions();
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const popupBg =
    theme.mode === "dark"
      ? SUBSCRIPTION_COLORS.POPUP_BG_DARK
      : SUBSCRIPTION_COLORS.POPUP_BG_LIGHT;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onDismiss}
          style={StyleSheet.absoluteFillObject}
        />
        <ScrollView
          style={{
            flexGrow: 0,
            maxHeight: Math.max(1, windowHeight - 64),
            width: 335,
            maxWidth: "100%",
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: popupBg },
            getPopupChromeStyle(theme),
          ]}
        >
          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={[styles.heading, { color: colors.textPrimary }]}
          >
            Hey, welcome to {appName}!
          </Text>

          <Text
            variant="body"
            size="medium"
            style={[styles.description, { color: colors.textSecondary }]}
          >
            Unlock unlimited bird IDs, expert details, personal collections, and
            AI answers — all in one place.
          </Text>

          <Button
            title={ctaLabel}
            variant="primary"
            size="large"
            style={{ backgroundColor: colors.primaryCTA }}
            textStyle={
              isDark
                ? { color: SUBSCRIPTION_COLORS.CTA_TEXT_DARK }
                : { color: SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT }
            }
            onPress={onDismiss}
            fullWidth
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: WELCOME_BACKDROP,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: 335,
    maxWidth: "100%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  heading: {
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 12,
  },
  description: {
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
});
