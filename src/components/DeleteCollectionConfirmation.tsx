/**
 * DeleteCollectionConfirmation – matches Figma delete-collection popup.
 * Single bold message, trash icon, X top-right, Yes Delete / No Thanks.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { Modal, View, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from "react-native";
import { APP_COLORS } from "../config/colors";
import { Images } from "../assets";
import { useTheme, useIsDark } from "../hooks/useTheme";
import { SUBSCRIPTION_COLORS } from "../constants/colorConstants";
import { Text, Button } from "../atoms";
import { useStrings } from "../hooks/useStrings";
import { getPopupChromeStyle, getPopupSecondaryCtaStyle, getPopupSecondaryCtaTextColor } from "../design-system/modalTokens";

export interface DeleteCollectionConfirmationProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const DeleteCollectionConfirmation: React.FC<
  DeleteCollectionConfirmationProps
> = ({ visible, onClose, onConfirm, isLoading = false }) => {
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const strings = useStrings();
  const { message, yesDelete, noThanks } = strings.collection.deleteCollection;
  const trashIcon = isDark ? Images.trashDark : Images.trashLight;
  const ctaBg = isDark
    ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
    : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT;

  const handleYes = async () => {
    await onConfirm();
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
                variant="title"
                size="large"
                weight="bold"
                style={[styles.message, { color: colors.textPrimary }]}
              >
                {message}
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title={yesDelete}
                  variant="primary"
                  size="large"
                  fullWidth
                  onPress={handleYes}
                  disabled={isLoading}
                  loading={isLoading}
                  style={[styles.confirmButton, { backgroundColor: ctaBg }]}
                />
                <Button
                  title={noThanks}
                  variant="outline"
                  size="large"
                  fullWidth
                  onPress={onClose}
                  disabled={isLoading}
                  style={[
                    styles.cancelButton,
                    getPopupSecondaryCtaStyle(theme),
                  ]}
                  textStyle={{
                    color: getPopupSecondaryCtaTextColor(theme),
                  }}
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
    maxWidth: 335,
    overflow: "hidden",
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
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
    marginTop: 4,
    marginBottom: 20,
    width: 72,
    height: 72,
  },
  trashIcon: {
    width: 48,
    height: 48,
  },
  message: {
    textAlign: "center",
    lineHeight: 28,
    fontSize: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  confirmButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
});

export default DeleteCollectionConfirmation;
