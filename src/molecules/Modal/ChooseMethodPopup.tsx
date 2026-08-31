/**
 * Choose a Method popup — shown when tapping the Identify tab icon.
 * Figma 8635:94966. Sound is the featured option; photo and step-by-step are outline.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect } from "react";
import {
  BackHandler,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

/** Light purple fill for the featured Identify by Sound option (Figma selected Answer). */
const SOUND_OPTION_BG_LIGHT = "#EBE4EE";

export interface ChooseMethodPopupProps {
  visible: boolean;
  onClose: () => void;
  onSelectSound: () => void;
  onSelectPhoto: () => void;
  onSelectStepByStep: () => void;
}

export const ChooseMethodPopup: React.FC<ChooseMethodPopupProps> = ({
  visible,
  onClose,
  onSelectSound,
  onSelectPhoto,
  onSelectStepByStep,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const copy = MODAL_STRINGS.bottomSheets.chooseMethod;
  const isDark = theme.mode === "dark";

  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP },
        ]}
      >
        <View style={[styles.card, getPopupChromeStyle(theme)]}>
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.xl,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon isDark={isDark} variant="plain" size={14} />
          </TouchableOpacity>

          <AppImage
            source={Images.identifyMethodPopup}
            style={styles.heroIcon}
            resizeMode="contain"
            preferRNImage
          />

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={[styles.title, { color: colors.textPrimary }]}
          >
            {copy.title}
          </Text>

          <Text
            variant="body"
            size="medium"
            color="textSecondary"
            style={[styles.subtitle, { marginTop: spacing[2] }]}
          >
            {copy.subtitle}
          </Text>

          <View style={[styles.options, { marginTop: spacing[4] }]}>
            <TouchableOpacity
              style={[
                styles.option,
                {
                  backgroundColor: isDark
                    ? `${colors.primaryCTA}2B`
                    : SOUND_OPTION_BG_LIGHT,
                  borderColor: colors.primaryCTA,
                  borderRadius: radius.md,
                },
              ]}
              onPress={onSelectSound}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={copy.sound}
            >
              <Text
                variant="body"
                size="medium"
                weight="bold"
                style={{ color: colors.primaryCTA }}
              >
                {copy.sound}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                {
                  backgroundColor: colors.surfacePrimary,
                  borderColor: colors.border0,
                  borderRadius: radius.md,
                },
              ]}
              onPress={onSelectPhoto}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={copy.photo}
            >
              <Text
                variant="body"
                size="medium"
                style={{ color: colors.textSecondary }}
              >
                {copy.photo}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                {
                  backgroundColor: colors.surfacePrimary,
                  borderColor: colors.border0,
                  borderRadius: radius.md,
                },
              ]}
              onPress={onSelectStepByStep}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={copy.stepByStep}
            >
              <Text
                variant="body"
                size="medium"
                style={{ color: colors.textSecondary }}
              >
                {copy.stepByStep}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 335,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  heroIcon: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  title: {
    textAlign: "center",
    lineHeight: 28,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
  },
  options: {
    width: "100%",
    gap: 8,
  },
  option: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    borderWidth: 1,
  },
});
