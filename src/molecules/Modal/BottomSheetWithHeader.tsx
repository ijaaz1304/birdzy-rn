/**
 * Reusable bottom sheet with shared BackgroundHeader.
 * Used by: Rate Us, Write Feedback, Notification Permission, Stay Updated (Version Update).
 * Slide up from bottom + backdrop fade (not overlay). Rounded top corners, close (X) top-right, 44x44.
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import {
  BackgroundHeader,
  type BackgroundHeaderProps,
  type BackgroundResizeMode,
} from "../BackgroundHeader";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { HIT_SLOP } from "../../constants/uiConstants";
import { Images } from "../../assets";

import { APP_COLORS } from "../../config/colors";
import { getBottomSheetChromeStyle } from "../../design-system/modalTokens";

const HEADER_HEIGHT = 140;
/** Close button: 24x24 icon, 8px padding, circle bg (design spec). */
const CLOSE_ICON_SIZE = 24;
const CLOSE_PADDING = 8;
const CLOSE_TOUCH_SIZE = CLOSE_ICON_SIZE + CLOSE_PADDING * 2; // 40
const CLOSE_HIT_SLOP = HIT_SLOP.CLOSE;
const _CLOSE_BG_LIGHT = APP_COLORS.surfaceAuthLight; // Surface Secondary light
const _CLOSE_BG_DARK = APP_COLORS.surfaceDarkAlt; // Surface Secondary dark
const ANIM_DURATION = 280;

const DEFAULT_HEIGHT_PERCENT = 50;

export interface BottomSheetWithHeaderProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet height as percentage of screen (1–100). Default 50. Fixes "only X visible" when not set. */
  heightPercent?: number;
  /** Use popUp 50% background (same as use50PercentBackground). Replaces legacy little_bg. Default false. */
  useLittleBg?: boolean;
  /** Use popUp 50% background (light/dark) for full-sheet. Use for Rate Us, Feedback, Notification. */
  use50PercentBackground?: boolean;
  /** Use popUp 70% background (light/dark) for full-sheet. */
  use70PercentBackground?: boolean;
  /** When true, show background image only in header (no full-sheet bg). Use with use50PercentBackground/use70PercentBackground for e.g. Write Feedback. */
  headerBackgroundOnly?: boolean;
  /** Set true for forms (e.g. Write Feedback) to avoid keyboard overlap. */
  keyboardSafe?: boolean;
  /** Resize mode for full-sheet background. 'contain' fits image inside sheet; 'cover' fills keeping ratio; 'stretch' fills fully (e.g. Write Feedback). */
  backgroundResizeMode?: BackgroundResizeMode;
  /** When true, content is not scrollable (fixed layout). Use for Notification, Rate Us, etc. */
  disableScroll?: boolean;
  /** Optional name for console logging when overlay opens (dev only). */
  debugName?: string;
}

export const BottomSheetWithHeader: React.FC<BottomSheetWithHeaderProps> = ({
  visible,
  onClose,
  children,
  heightPercent = DEFAULT_HEIGHT_PERCENT,
  useLittleBg = false,
  use50PercentBackground = false,
  use70PercentBackground = false,
  headerBackgroundOnly = false,
  keyboardSafe = false,
  backgroundResizeMode,
  disableScroll = false,
  debugName,
}) => {
  const { height: screenHeight, fontScale } = useWindowDimensions();
  const theme = useTheme();
  const colors = theme.colors;
  const radius = theme.radius;
  const spacing = theme.spacing;
  const insets = useSafeAreaInsets();
  const percent = Math.min(100, Math.max(1, heightPercent));
  const sheetHeightPx = (screenHeight * percent) / 100;
  const isDark = useIsDark();
  const headerBg = use70PercentBackground
    ? isDark
      ? Images.popUp70Dark
      : Images.popUp70Light
    : use50PercentBackground || useLittleBg
    ? isDark
      ? Images.popUp50Dark
      : Images.popUp50Light
    : undefined;
  const useFullSheetBg =
    useLittleBg || use50PercentBackground || use70PercentBackground;

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      if (__DEV__) {
        console.log(
          "[Overlay] BottomSheetWithHeader opened",
          debugName ? `: ${debugName}` : ""
        );
      }
    }
  }, [visible, debugName]);

  useEffect(() => {
    if (!visible && showModal) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: screenHeight,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
      return;
    }
    if (visible && showModal) {
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(screenHeight);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, showModal]);

  const sheetContent = (
    <>
      {/* Full-sheet background when using little_bg or 50%/70% (skip when headerBackgroundOnly e.g. Write Feedback) */}
      {useFullSheetBg && headerBg && !headerBackgroundOnly && (
        <View
          style={[StyleSheet.absoluteFill, { overflow: "hidden" }]}
          pointerEvents="none"
        >
          <BackgroundHeader
            height={sheetHeightPx}
            backgroundImage={
              headerBg as BackgroundHeaderProps["backgroundImage"]
            }
            imageResizeMode={backgroundResizeMode ?? "contain"}
          />
        </View>
      )}
      <BackgroundHeader
        height={HEADER_HEIGHT}
        backgroundImage={headerBg as BackgroundHeaderProps["backgroundImage"]}
      />
      <TouchableOpacity
        style={[
          styles.closeBtn,
          {
            top: insets.top + spacing[2],
            left: spacing[6],
            width: CLOSE_TOUCH_SIZE,
            height: CLOSE_TOUCH_SIZE,
            padding: CLOSE_PADDING,
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            borderRadius: 999,
          },
        ]}
        onPress={onClose}
        activeOpacity={0.8}
        hitSlop={CLOSE_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <CloseIcon isDark={isDark} size={CLOSE_ICON_SIZE} />
      </TouchableOpacity>
      {disableScroll && fontScale <= 1.2 && screenHeight >= 700 ? (
        <View
          style={[
            styles.scroll,
            styles.scrollContent,
            {
              paddingHorizontal: spacing[6],
              overflow: "hidden" as const,
            },
          ]}
        >
          {children}
        </View>
      ) : (
        <ScrollView
          style={[styles.scroll]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: spacing[6] },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      )}
    </>
  );

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            // Lighter overlay so current screen stays visible (dimmed) underneath, not dull black
            backgroundColor: OVERLAY_COLORS.BACKDROP_OVERLAY,
            zIndex: 9998,
            elevation: 9998,
            opacity: backdropOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: useFullSheetBg
                ? colors.surface
                : colors.cardBackground,
              height: sheetHeightPx,
              maxHeight: sheetHeightPx,
              zIndex: 9999,
              ...(Platform.OS === "android" && { elevation: 24 }),
              transform: [{ translateY: sheetTranslateY }],
            },
            getBottomSheetChromeStyle(theme),
          ]}
        >
          {keyboardSafe ? (
            <KeyboardAvoidingView
              style={styles.flex}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={0}
            >
              {sheetContent}
            </KeyboardAvoidingView>
          ) : (
            sheetContent
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    overflow: "hidden",
    zIndex: 1,
  },
  flex: {
    flex: 1,
  },
  closeBtn: {
    position: "absolute",
    zIndex: 10,
    display: "flex",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
});
