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
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { getPopupChromeStyle } from "../../design-system/modalTokens";
import { getAvailableOverlayHeight } from "../../utils/responsiveLayout";

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
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardMaxHeight = Math.max(
    1,
    getAvailableOverlayHeight(windowHeight, insets.top, insets.bottom) - 32
  );

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
        <ScrollView
          style={[styles.scroll, { maxHeight: cardMaxHeight }]}
          contentContainerStyle={[styles.card, getPopupChromeStyle(theme)]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
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
            numberOfLines={2}
            ellipsizeMode="tail"
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
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{ color: colors.primaryCTA, textAlign: "center" }}
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
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{ color: colors.textSecondary, textAlign: "center" }}
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
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{ color: colors.textSecondary, textAlign: "center" }}
              >
                {copy.stepByStep}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scroll: {
    width: "100%",
    maxWidth: 335,
    flexGrow: 0,
  },
  card: {
    width: "100%",
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
    alignSelf: "stretch",
  },
  subtitle: {
    textAlign: "center",
    alignSelf: "stretch",
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
