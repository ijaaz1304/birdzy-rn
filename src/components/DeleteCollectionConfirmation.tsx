/**
 * DeleteCollectionConfirmation – matches Figma delete-collection popup.
 * Single bold message, trash icon, X top-right, Yes Delete / No Thanks.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { Images } from "../assets";
import { FONTS } from "../common/typography";
import { useTheme, useIsDark } from "../hooks/useTheme";
import { Text, Button } from "../atoms";
import { useStrings } from "../hooks/useStrings";
import {
  getPopupChromeStyle,
  getPopupSecondaryCtaStyle,
  getPopupSecondaryCtaTextColor,
} from "../design-system/modalTokens";

/** Figma Illustration/trash, 64×64 (9399:176896). */
function DeleteCollectionTrashIcon() {
  return (
    <Svg width={64} height={64.0009} viewBox="0 0 64 64.0009" fill="none">
      <Ellipse cx={35.4403} cy={54.2433} rx={14.6473} ry={9.75751} fill="#072C38" />
      <Path
        d="M47.5188 16.7498L40.5582 15.1504L40.722 14.4373C41.2069 12.3266 39.8843 10.2149 37.7738 9.72999L30.6818 8.10052C29.6626 7.86624 28.6106 8.04464 27.7194 8.60274C26.8283 9.16083 26.2086 10.0295 25.9744 11.0488L25.8105 11.7619L18.8499 10.1625C16.7247 9.67402 14.5997 11.0056 14.1117 13.1302L13.4363 16.0695C13.3806 16.3119 13.4234 16.5664 13.5554 16.7771C13.6874 16.9878 13.8976 17.1375 14.14 17.1931L39.2035 22.952H14.9511C14.687 22.952 14.4351 23.0634 14.2575 23.2588C14.0798 23.4542 13.9928 23.7154 14.0178 23.9784L16.7505 52.6592C16.932 54.5642 18.5119 56.0009 20.4255 56.0009H25.691H36.7304H41.9958C43.9094 56.0009 45.4894 54.5643 45.6709 52.6592L48.3023 25.0426L48.6874 25.1311C48.7581 25.1474 48.8287 25.1551 48.8982 25.1551C49.3253 25.1551 49.7114 24.8613 49.811 24.4274L50.4864 21.488C50.7222 20.4621 50.5425 19.4031 49.9808 18.5061C49.4192 17.6093 48.5447 16.9856 47.5188 16.7498ZM43.8044 52.4814C43.7151 53.4189 42.9376 54.1259 41.9959 54.1259H36.7304H25.6911H20.4256C19.4839 54.1259 18.7064 53.4189 18.6172 52.4815L15.9823 24.8271H46.4395L43.8044 52.4814ZM27.8019 11.4686C27.9239 10.9375 28.2481 10.484 28.7147 10.1918C29.1812 9.89958 29.7303 9.80574 30.262 9.92789L37.3539 11.5575C38.4569 11.8109 39.1481 12.9145 38.8947 14.0175L38.7308 14.7306L27.638 12.1818L27.8019 11.4686ZM48.6591 21.0683L48.1936 23.0939L15.4737 15.5758L15.9391 13.5502C16.1957 12.4333 17.3135 11.7337 18.4301 11.99L39.2244 16.7679C39.2245 16.7679 39.2246 16.768 39.2247 16.768C39.2248 16.768 39.2249 16.768 39.2249 16.768L47.099 18.5772C48.2159 18.8339 48.9157 19.9514 48.6591 21.0683ZM37.2631 51.1746L38.4086 27.687C38.4338 27.1698 38.8727 26.7726 39.3907 26.7963C39.9079 26.8216 40.3066 27.2612 40.2814 27.7785L39.1359 51.2659C39.1114 51.7676 38.6969 52.1578 38.2003 52.1578C38.1849 52.1578 38.1694 52.1574 38.1539 52.1566C37.6366 52.1314 37.2379 51.6917 37.2631 51.1746ZM23.2857 51.2659L22.1403 27.7784C22.1151 27.2611 22.5138 26.8216 23.031 26.7962C23.5482 26.7724 23.9879 27.1697 24.0132 27.687L25.1585 51.1745C25.1837 51.6917 24.7849 52.1313 24.2678 52.1566C24.2522 52.1574 24.2368 52.1578 24.2214 52.1578C23.7244 52.1578 23.3101 51.7676 23.2857 51.2659ZM30.2733 51.2203V27.7327C30.2733 27.215 30.6931 26.7952 31.2108 26.7952C31.7285 26.7952 32.1483 27.215 32.1483 27.7327V51.2203C32.1483 51.738 31.7285 52.1578 31.2108 52.1578C30.6931 52.1578 30.2733 51.738 30.2733 51.2203Z"
        fill="#009DA7"
      />
    </Svg>
  );
}

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
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modal,
                isDark ? styles.modalDark : getPopupChromeStyle(theme),
              ]}
            >
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, isDark && styles.closeButtonDark]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
                disabled={isLoading}
              >
                <CloseIcon
                  isDark={isDark}
                  variant={isDark ? "plain" : "sheet"}
                  size={isDark ? 16 : 24}
                  color={isDark ? "#FFFFFF" : undefined}
                />
              </TouchableOpacity>

              <View style={styles.header}>
                {isDark ? (
                  <DeleteCollectionTrashIcon />
                ) : (
                  <AppImage
                    source={Images.trashLight}
                    style={styles.trashIcon}
                    resizeMode="contain"
                    preferRNImage
                  />
                )}
                <Text
                  style={[
                    styles.message,
                    { color: isDark ? "#FFFFFF" : colors.textPrimary },
                  ]}
                >
                  {message}
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                {isDark ? (
                  <>
                    <TouchableOpacity
                      onPress={handleYes}
                      disabled={isLoading}
                      activeOpacity={0.8}
                      style={styles.confirmButtonDark}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#091B21" />
                      ) : (
                        <Text style={styles.confirmLabelDark}>{yesDelete}</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onClose}
                      disabled={isLoading}
                      activeOpacity={0.8}
                      style={styles.cancelButtonDark}
                    >
                      <Text style={styles.cancelLabelDark}>{noThanks}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Button
                      title={yesDelete}
                      variant="primary"
                      size="large"
                      fullWidth
                      onPress={handleYes}
                      disabled={isLoading}
                      loading={isLoading}
                      style={styles.confirmButton}
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
                  </>
                )}
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
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modal: {
    width: 335,
    maxWidth: "100%",
    overflow: "hidden",
    position: "relative",
  },
  modalDark: {
    backgroundColor: "#091B21",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333333",
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
  closeButtonDark: {
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    backgroundColor: "#091421",
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  trashIcon: {
    width: 64,
    height: 64,
  },
  message: {
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: 28,
    width: "100%",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  confirmButton: {
    marginBottom: 0,
  },
  cancelButton: {
    marginBottom: 0,
  },
  confirmButtonDark: {
    width: "100%",
    backgroundColor: "#16B6B4",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLabelDark: {
    color: "#091B21",
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  cancelButtonDark: {
    width: "100%",
    backgroundColor: "#091B21",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#333333",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLabelDark: {
    color: "#FFFFFF",
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default DeleteCollectionConfirmation;
