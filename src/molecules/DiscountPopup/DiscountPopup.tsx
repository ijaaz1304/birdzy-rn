/**
 * Discount Popup Component
 * Reusable discount popup with countdown timer
 */

import { AppImage } from "@/components/AppImage";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { Modal } from "../Modal";
import { useStrings } from "../../hooks/useStrings";
import { Images } from "../../assets";
import {
  OVERLAY_COLORS,
  ACCENT_COLORS,
  SCREEN_COLORS,
} from "../../constants/colorConstants";
import { formatCountdownSegment } from "../../utils";

import { FONTS } from "../../common/typography";

import { Radius } from "../../design";

import { spacing } from "../../design-system/spacing";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

export interface DiscountPopupConfig {
  visible: boolean;
  percentage: number; // 50 / 70
  durationSeconds: number; // e.g. 1200 (20 mins)
  title: string;
  subtitle: string;
  ctaText: string;
}

interface DiscountPopupProps {
  config: DiscountPopupConfig;
  onClose: () => void;
  onCTAPress: () => void;
}

export const DiscountPopup: React.FC<DiscountPopupProps> = ({
  config,
  onClose,
  onCTAPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const strings = useStrings();
  const isDark = useIsDark();

  const [secondsLeft, setSecondsLeft] = useState(config.durationSeconds);

  useEffect(() => {
    if (!config.visible) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.visible, onClose]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Use subscription popup 50% or 70% WebP background
  const isSeventy = Number(config.percentage) >= 70;
  const bgSource = isSeventy
    ? isDark
      ? Images.subscriptionPopup70Dark
      : Images.subscriptionPopup70Light
    : isDark
    ? Images.subscriptionPopup50Dark
    : Images.subscriptionPopup50Light;

  return (
    <Modal
      visible={config.visible}
      onClose={onClose}
      animationType="fade"
      backdropOpacity={1}
      backdropColor={OVERLAY_COLORS.MODAL_BACKDROP}
      closeOnBackdropPress={true}
      contentStyle={styles.modalContent}
      debugName="DiscountPopup"
    >
      <SafeAreaView style={styles.safeWrapper} edges={["top", "bottom"]}>
        <View style={styles.backgroundContainer}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <AppImage
              source={bgSource}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </View>

          <View
            style={[
              styles.card,
              getPopupChromeStyle(theme),
              {
                padding: spacing[6],
                width: "100%",
                minHeight: 300,
                shadowColor: ACCENT_COLORS.SHADOW,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.close}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                variant="headline"
                size="large"
                weight="bold"
                style={[styles.closeText, { color: colors.textPrimary }]}
              >
                {strings.discount.buttons.close}
              </Text>
            </TouchableOpacity>

            {/* Badge/Illustration */}
            <View style={styles.illustration}>
              <View
                style={[
                  styles.badgeContainer,
                  {
                    backgroundColor:
                      colors.warning || ACCENT_COLORS.WARNING_ORANGE,
                  },
                ]}
              >
                <Text
                  variant="headline"
                  size="large"
                  weight="bold"
                  style={{ color: ACCENT_COLORS.ON_PRIMARY, fontSize: 36 }}
                >
                  {config.percentage}%
                </Text>
                <Text
                  variant="body"
                  size="small"
                  weight="semibold"
                  style={{ color: ACCENT_COLORS.ON_PRIMARY, marginTop: -4 }}
                >
                  OFF
                </Text>
              </View>
            </View>

            {/* Timer */}
            <View style={[styles.timerRow, { marginVertical: spacing[3] }]}>
              <View
                style={[
                  styles.timerBox,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceVariant
                      : SCREEN_COLORS.LIGHT.surfaceVariant,
                    borderRadius: radius.md,
                    padding: spacing[2],
                    minWidth: 60,
                  },
                ]}
              >
                <Text
                  variant="title"
                  size="medium"
                  weight="bold"
                  style={{ color: colors.textPrimary }}
                >
                  {minutes}
                  {strings.discount.timer.minutes}
                </Text>
              </View>
              <Text
                variant="title"
                size="medium"
                weight="bold"
                style={[
                  styles.colon,
                  { marginHorizontal: spacing[2], color: colors.textPrimary },
                ]}
              >
                :
              </Text>
              <View
                style={[
                  styles.timerBox,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceVariant
                      : SCREEN_COLORS.LIGHT.surfaceVariant,
                    borderRadius: radius.md,
                    padding: spacing[2],
                    minWidth: 60,
                  },
                ]}
              >
                <Text
                  variant="title"
                  size="medium"
                  weight="bold"
                  style={{ color: colors.textPrimary }}
                >
                  {formatCountdownSegment(seconds)}
                  {strings.discount.timer.seconds}
                </Text>
              </View>
            </View>

            {/* Content - Make "Get 70% Off" bright and prominent */}
            <Text
              variant="headline"
              size="large"
              weight="bold"
              style={[
                styles.title,
                { marginTop: spacing[4], color: colors.textPrimary },
              ]}
            >
              Get{" "}
              <Text
                style={{
                  color: colors.warning || ACCENT_COLORS.WARNING_ORANGE,
                  fontFamily: FONTS.black,
                }}
              >
                {config.percentage}% Off
              </Text>
            </Text>

            <Text
              variant="body"
              size="medium"
              style={[
                styles.subtitle,
                { marginTop: spacing[2], color: colors.textSecondary },
              ]}
            >
              {config.subtitle}
            </Text>

            {/* CTA */}
            <Button
              title={config.ctaText}
              variant="primary"
              size="large"
              onPress={onCTAPress}
              fullWidth
              style={styles.cta}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "android" && { elevation: 999, zIndex: 9999 }),
  },
  safeWrapper: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    maxHeight: "100%",
  },
  backgroundContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: Radius.lg,
    overflow: "hidden",
    position: "relative",
    minHeight: 380,
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
    position: "relative",
    width: "100%",
    zIndex: 1,
  },
  close: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
  },
  closeText: {
    lineHeight: 24,
  },
  illustration: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: spacing[4],
    paddingVertical: 8,
  },
  badgeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  colon: {},
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 20,
  },
  cta: {
    marginTop: 16,
    marginBottom: 0,
  },
});
