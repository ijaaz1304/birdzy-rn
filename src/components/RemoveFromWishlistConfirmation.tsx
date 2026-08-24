/**
 * RemoveFromWishlistConfirmation – matches Figma / RemoveFromWishlistModal design.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { Modal, View, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from "react-native";
import { Images } from "../assets";
import { APP_COLORS } from "../config/colors";
import { useTheme, useIsDark } from "../hooks/useTheme";
import { SUBSCRIPTION_COLORS } from "../constants/colorConstants";
import { Text, Button } from "../atoms";
import { getPopupChromeStyle, getPopupSecondaryCtaStyle, getPopupSecondaryCtaTextColor } from "../design-system/modalTokens";


export interface RemoveFromWishlistConfirmationProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  mushroomName?: string;
}

export const RemoveFromWishlistConfirmation: React.FC<
  RemoveFromWishlistConfirmationProps
> = ({ visible, onClose, onConfirm, mushroomName: _mushroomName }) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const ctaBg = isDark
    ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
    : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT;
  const trashIcon = isDark ? Images.trashDark : Images.trashLight;

  const handleConfirm = async () => {
    try {
      await Promise.resolve(onConfirm());
    } finally {
      onClose();
    }
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.overlay,
            { backgroundColor: APP_COLORS.overlay },
            { zIndex: 9998, elevation: 9998 },
          ]}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modal, getPopupChromeStyle(theme)]}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <CloseIcon isDark={isDark} style={styles.closeIcon} />
              </TouchableOpacity>

              <View style={styles.iconContainer}>
                <AppImage
                  source={trashIcon}
                  style={styles.trashIcon}
                  resizeMode="contain"
                  preferRNImage
                />
              </View>

              <Text
                variant="headline"
                size="medium"
                weight="bold"
                style={[styles.title, { color: colors.textPrimary }]}
              >
                Do you want to remove from your wishlist?
              </Text>

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
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 320,
    paddingTop: 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    width: 24,
    height: 24,
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
  title: {
    alignSelf: "stretch",
    width: "100%",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
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
