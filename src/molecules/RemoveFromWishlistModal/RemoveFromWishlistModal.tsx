/**
 * Remove From Wishlist Confirmation Modal
 * Confirms removal of item from wishlist
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Images } from "../../assets";
import {
  OVERLAY_COLORS,
  UI_COLORS,
  SUBSCRIPTION_COLORS,
} from "../../constants/colorConstants";
import { Text, Button } from "../../atoms";
import { getPopupChromeStyle, getPopupSecondaryCtaStyle, getPopupSecondaryCtaTextColor } from "../../design-system/modalTokens";

export interface RemoveFromWishlistModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plantName?: string;
}

export const RemoveFromWishlistModal: React.FC<
  RemoveFromWishlistModalProps
> = ({ visible, onClose, onConfirm }) => {
  const theme = useTheme();
  const colors = theme.colors;
  const _spacing = theme.spacing;
  const radius = theme.radius;
  const isDark = useIsDark();
  const ctaBg = isDark
    ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
    : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT;

  const trashIcon = isDark ? Images.trashDark : Images.trashLight;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={[styles.container, { zIndex: 9998, elevation: 9998 }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalContent,
            getPopupChromeStyle(theme),
          ]}
        >
          <SafeAreaView edges={["top"]}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon isDark={theme.mode === "dark"} />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <AppImage
                source={trashIcon}
                style={styles.trashIcon}
                resizeMode="contain"
              />
            </View>

            {/* Question Text */}
            <View style={styles.textContainer}>
              <Text
                variant="headline"
                size="medium"
                weight="bold"
                style={[styles.questionText, { color: colors.textPrimary }]}
              >
                Do you want to remove from your wishlist?
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title="Yes, Remove"
                variant="primary"
                size="medium"
                fullWidth
                onPress={handleConfirm}
                style={{
                  ...styles.confirmButton,
                  backgroundColor: ctaBg,
                }}
              />
              <Button
                title="No, Thanks"
                variant="outline"
                size="medium"
                fullWidth
                onPress={onClose}
                style={{
                  ...styles.cancelButton,
                  ...getPopupSecondaryCtaStyle(theme),
                }}
                textStyle={{ color: getPopupSecondaryCtaTextColor(theme) }}
              />
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: OVERLAY_COLORS.BACKDROP_LIGHT,
  },
  modalContent: {
    width: "85%",
    maxWidth: 320,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 44,
    alignItems: "center",
    shadowColor: UI_COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  trashIcon: {
    width: 48,
    height: 48,
    alignSelf: "center",
  },
  textContainer: {
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  questionText: {
    alignSelf: "stretch",
    width: "100%",
    textAlign: "center",
    fontSize: 18,
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  confirmButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
});
