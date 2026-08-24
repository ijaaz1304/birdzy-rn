/**
 * AI Error Modal
 * AppPopup-style: white card, 24px radius, close X top-right.
 * Shows when mineral identification fails. Two actions: Chat with AI, Re-take photo.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { useStrings } from "../../hooks/useStrings";
import { Images } from "../../assets";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { Radius } from "../../design";
import { getPopupChromeStyle, getPopupSecondaryCtaStyle, getPopupSecondaryCtaTextColor } from "../../design-system/modalTokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface AIErrorModalProps {
  visible: boolean;
  onClose: () => void;
  /** Re-take photo: typically go back to camera. */
  onRetry: () => void;
  /** Chat with AI: typically navigate to Ask AI. */
  onChatWithAI: () => void;
  errorMessage?: string;
}

export const AIErrorModal: React.FC<AIErrorModalProps> = ({
  visible,
  onClose,
  onRetry,
  onChatWithAI,
  errorMessage,
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
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.popupContainer,
            getPopupChromeStyle(theme),
          ]}
        >
          {/* Close button – top right, circular light grey with X */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                top: spacing[3],
                right: spacing[3],
                width: 40,
                height: 40,
                padding: 8,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon isDark={theme.mode === "dark"} />
          </TouchableOpacity>

          <View style={[styles.content, { padding: spacing[5] }]}>
            {/* Center icon: ai_scan_error / ai_scan_error_dark */}
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.error + "20",
                  marginBottom: spacing[4],
                },
              ]}
            >
              <AppImage
                source={isDark ? Images.aiScanErrorDark : Images.aiScanError}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>

            <Text
              variant="headline"
              size="large"
              weight="bold"
              style={[styles.title, { color: colors.textPrimary }]}
            >
              {strings.camera.error.title}
            </Text>

            <Text
              variant="body"
              size="medium"
              style={[
                styles.message,
                { color: colors.textSecondary, marginBottom: spacing[6] },
              ]}
            >
              {errorMessage || strings.camera.error.message}
            </Text>

            {/* Side-by-side: Chat with AI (outline) | Re-take photo (primary) */}
            <View style={styles.actions}>
              <Button
                title={strings.camera.buttons.chatWithAI}
                variant="secondary"
                size="large"
                onPress={onChatWithAI}
                style={{
                  ...styles.actionButton,
                  ...getPopupSecondaryCtaStyle(theme),
                }}
                textStyle={{
                  color: getPopupSecondaryCtaTextColor(theme),
                }}
              />
              <Button
                title={strings.camera.buttons.retakePhoto}
                variant="primary"
                size="large"
                onPress={onRetry}
                style={styles.actionButton}
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: OVERLAY_COLORS.BACKDROP_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupContainer: {
    width: Math.min(335, SCREEN_WIDTH - 40),
    position: "relative",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    zIndex: 10,
    borderRadius: Radius.md,
  },
  content: {
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 48,
    height: 48,
  },
  title: {
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  message: {
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
  },
});
