/**
 * Choose a Method popup — shown when tapping the Identify tab icon.
 * Figma 8635:94966. Sound is the featured option; photo and step-by-step are outline.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect } from "react";
import Svg, { Ellipse, Path } from "react-native-svg";
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

/** Figma 9380:171047 "Scan" (dark): Text & icon-Brand 1 #16B6B4 on Surface-brand-1 Accent #072C38. */
const SCAN_HERO_DARK = { icon: "#16B6B4", ellipse: "#072C38" } as const;

const SCAN_BIRD_PATH =
  "M22.3507 3.37443C22.035 3.25713 20.9853 2.82766 20.7326 2.22607L20.7286 2.21616C20.4501 1.55305 19.7979 0 17.9794 0C15.6535 0 14.9836 2.15246 14.8729 2.58398C14.6844 3.31929 14.2922 4.84889 10.847 7.25398C9.85155 7.94891 7.96232 9.60354 6.25255 11.2788C5.10329 12.4049 3.19732 14.3625 3.34471 14.831C3.35921 14.8771 3.40496 14.9514 3.5489 14.9514H3.54903C3.68799 14.9514 3.90477 14.8841 4.20717 14.7407C4.06067 14.8738 3.86561 15.0501 3.6563 15.2362C1.89958 16.7978 0.0234388 18.5111 0.000246658 19.075C-0.00230895 19.1367 0.0150053 19.1875 0.0516783 19.2259C0.179331 19.3596 0.317334 19.4246 0.47361 19.4246C0.645539 19.4246 0.817978 19.3464 1.00051 19.2636C1.2164 19.1657 1.43963 19.0645 1.70081 19.0645C1.76055 19.0645 1.82074 19.07 1.87984 19.0808L1.89728 19.0824C2.03943 19.0822 2.71111 18.6806 4.32562 17.6947C5.85637 16.7599 7.95286 15.4797 8.29384 15.4797C8.30055 15.4797 8.30368 15.4804 8.30387 15.4804C8.53612 15.5745 10.3424 16.0137 12.397 16.0137C12.5017 16.0137 12.6048 16.0123 12.7068 16.01C13.1647 16.4259 13.7485 16.9442 13.9816 17.0995C14.0926 17.1735 14.188 17.2518 14.2802 17.3276C14.3581 17.3916 14.4378 17.4571 14.5261 17.5191C14.4216 17.5551 14.3087 17.5967 14.189 17.6436C14.0583 17.6948 13.9936 17.8428 14.0448 17.9736C14.0833 18.0718 14.1764 18.1353 14.2818 18.1353C14.3001 18.1353 14.3045 18.1353 14.8115 17.9612C14.9938 17.8987 15.1985 17.8283 15.2495 17.8129C15.3598 17.832 15.4763 17.8417 15.596 17.8417C16.0525 17.8417 16.4335 17.7041 16.5274 17.6673C16.6202 17.6948 17.0013 17.8123 17.2399 17.9493C17.2917 17.9791 17.3369 17.9688 17.3595 17.9327C17.3774 17.904 17.3749 17.8654 17.3518 17.818L17.1844 17.5834C17.2265 17.5859 17.2689 17.5876 17.312 17.5876C17.7685 17.5876 18.1494 17.45 18.2434 17.4131C18.3362 17.4406 18.7174 17.5581 18.9559 17.6951C18.9769 17.7072 18.9949 17.7128 19.0126 17.7128C19.0385 17.7128 19.062 17.7 19.0755 17.6786C19.0934 17.6499 19.0909 17.6112 19.0678 17.5638L18.8854 17.3081C18.88 17.3007 18.7469 17.1255 18.4727 17.0371C18.3769 17.0062 18.2619 16.9898 18.1403 16.9898C17.9585 16.9898 17.8435 17.0156 17.7419 17.0384C17.6621 17.0563 17.5931 17.0717 17.5038 17.0717C17.3943 17.0717 17.2637 17.0478 17.0928 16.9966C16.7234 16.8858 15.8921 16.1267 15.3492 15.6027C15.792 15.4549 16.1856 15.2682 16.526 15.0414C19.008 13.3874 19.124 11.0323 19.1934 9.62507C19.2069 9.3497 19.2187 9.11184 19.2471 8.93276C19.3194 8.47748 19.3889 7.90764 19.4562 7.35665C19.5486 6.59916 19.6359 5.88372 19.7181 5.56274C19.9651 4.59838 20.8113 3.91718 22.2332 3.53799C22.3691 3.50176 22.3974 3.49422 22.3999 3.44164C22.4014 3.41289 22.3838 3.3867 22.3507 3.37443ZM14.5016 15.8262C14.9457 16.2283 15.4778 16.6982 15.6976 16.8447C15.808 16.9183 15.9029 16.9972 15.9945 17.0737C16.0701 17.1365 16.1444 17.1984 16.2252 17.2563C16.1478 17.266 16.0844 17.28 16.026 17.2931C15.946 17.311 15.877 17.3265 15.7876 17.3265C15.6782 17.3265 15.5478 17.3026 15.377 17.2515C15.0275 17.1466 14.2643 16.4615 13.7234 15.9443C13.9944 15.9144 14.2544 15.8755 14.5016 15.8262Z";

const SCAN_FRAME_PATH =
  "M26.463 42.2655C30.2267 42.2655 32.1087 42.2655 33.6156 41.6789C36.1417 40.6957 38.1318 38.5675 39.0512 35.866C39.5997 34.2545 39.5997 32.2419 39.5997 28.2168M14.3368 42.2655C10.573 42.2655 8.69106 42.2655 7.18414 41.6789C4.65795 40.6957 2.66798 38.5675 1.74851 35.866C1.20004 34.2545 1.20004 32.2419 1.20004 28.2168M14.3368 1.2C10.573 1.2 8.69106 1.2 7.18414 1.78655C4.65795 2.76983 2.66798 4.89797 1.74851 7.59955C1.20004 9.21109 1.20004 11.2236 1.20004 15.2487M26.463 1.2C30.2267 1.2 32.1087 1.2 33.6156 1.78655C36.1417 2.76983 38.1318 4.89797 39.0512 7.59955C39.5997 9.21109 39.5997 11.2236 39.5997 15.2487";

/**
 * Dark-mode hero (Figma 9380:171047 "Scan", 64×64): ellipse at the bottom centre,
 * 48px scan frame + bird centred 6px above the middle. Same vectors as Figma.
 */
const ScanBirdHeroDark: React.FC = () => (
  <View style={styles.heroIcon}>
    <View style={styles.heroEllipse}>
      <Svg width={29.2947} height={17.3546} viewBox="0 0 29.2947 17.3546">
        <Ellipse
          cx={14.6473}
          cy={8.67731}
          rx={14.6473}
          ry={8.67731}
          fill={SCAN_HERO_DARK.ellipse}
        />
      </Svg>
    </View>
    <View style={styles.heroScan}>
      <View style={styles.heroFrame}>
        <Svg width={40.7997} height={43.4655} viewBox="0 0 40.7997 43.4655" fill="none">
          <Path
            d={SCAN_FRAME_PATH}
            stroke={SCAN_HERO_DARK.icon}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <View style={styles.heroBird}>
        <Svg width={22.4} height={19.4246} viewBox="0 0 22.4 19.4246">
          <Path d={SCAN_BIRD_PATH} fill={SCAN_HERO_DARK.icon} />
        </Svg>
      </View>
    </View>
  </View>
);

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

          {isDark ? (
            <ScanBirdHeroDark />
          ) : (
            <AppImage
              source={Images.identifyMethodPopup}
              style={styles.heroIcon}
              resizeMode="contain"
              preferRNImage
            />
          )}

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
  heroEllipse: {
    position: "absolute",
    bottom: 0,
    left: (64 - 29.2947) / 2,
  },
  // 48px "Plus Icon" box: centred horizontally, 6px above vertical centre.
  heroScan: {
    position: "absolute",
    left: 8,
    top: 2,
    width: 48,
    height: 48,
  },
  // Frame vector: inset 4.45% / 10% of 48, expanded by its 1.2px stroke overhang.
  heroFrame: {
    position: "absolute",
    left: 3.6,
    top: 0.876,
  },
  heroBird: {
    position: "absolute",
    left: (48 - 22.4) / 2,
    top: 12,
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
