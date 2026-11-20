/**
 * Location permission popup — centered modal on home (Figma: Before the identification flow).
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text } from "../../atoms";
import { Images } from "../../assets";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import { getLocationFirstAskUiCopy } from "../../services/permissions/permissionUiCopy";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { getPopupChromeStyle } from "../../design-system/modalTokens";
import { getAvailableOverlayHeight } from "../../utils/responsiveLayout";

export interface LocationPermissionPopupProps {
  visible: boolean;
  onClose: () => void;
  onAllowLocation: () => void;
  onCustomLocation: () => void;
  loading?: boolean;
  /** Hide while custom location entry is not shipped (e.g. first-session home prompt). */
  showCustomLocationButton?: boolean;
}

export const LocationPermissionPopup: React.FC<
  LocationPermissionPopupProps
> = ({
  visible,
  onClose,
  onAllowLocation,
  onCustomLocation,
  loading = false,
  showCustomLocationButton = true,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;
  const copy = getLocationFirstAskUiCopy();
  const customLocationButton =
    MODAL_STRINGS.bottomSheets.enableLocation.customLocationButton;
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
            source={
              isDark ? Images.speciesLocationDark : Images.speciesLocation
            }
            style={styles.heroIcon}
            resizeMode="contain"
          />

          <Text
            variant="headline"
            size="large"
            weight="bold"
            numberOfLines={3}
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

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primaryCTA,
                borderRadius: radius.xl,
                marginTop: spacing[4],
              },
            ]}
            onPress={onAllowLocation}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text
                variant="body"
                size="medium"
                weight="semibold"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{ color: colors.onPrimary, textAlign: "center" }}
              >
                {copy.continueLabel}
              </Text>
            )}
          </TouchableOpacity>

          {showCustomLocationButton ? (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  borderRadius: radius.xl,
                  marginTop: spacing[3],
                },
              ]}
              onPress={onCustomLocation}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text
                variant="body"
                size="medium"
                weight="semibold"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={{ textAlign: "center" }}
              >
                {customLocationButton}
              </Text>
            </TouchableOpacity>
          ) : null}
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
    zIndex: 1,
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
  primaryButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 48,
  },
});
