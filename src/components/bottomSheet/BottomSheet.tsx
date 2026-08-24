/**
 * Bottom Sheet Popup Component
 * Slides up from bottom + backdrop fade (not overlay). Image-only background.
 * Supports 50% or 70% height. Light & Dark mode support.
 */

import { AppImageBackground } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useEffect, useRef, useState } from "react";
import { Modal, TouchableOpacity, Dimensions, StyleSheet, TouchableWithoutFeedback, Animated } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Platform } from "react-native";
import { Images } from "../../assets";
import { OVERLAY_COLORS } from "../../constants/colorConstants";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const ANIM_DURATION = 280;

export interface BottomSheetProps {
  visible: boolean;
  heightPercent: 50 | 70;
  onClose: () => void;
  children: React.ReactNode;
  enableBackdropDismiss?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  heightPercent,
  onClose,
  children,
  enableBackdropDismiss = true,
}) => {
  const theme = useTheme();
  const isDark = useIsDark();

  const height = SCREEN_HEIGHT * (heightPercent / 100);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [showModal, setShowModal] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      if (__DEV__) {
        console.log("[Overlay] App BottomSheet opened", `(${heightPercent}%)`);
      }
    }
  }, [visible, heightPercent]);

  useEffect(() => {
    if (!visible && showModal) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
      return;
    }
    if (visible && showModal) {
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(SCREEN_HEIGHT);
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

  const bgSource = isDark ? Images.popUp50Dark : Images.popUp50Light;

  const handleBackdropPress = () => {
    if (enableBackdropDismiss) {
      onClose();
    }
  };

  const radius = theme.radius;
  const spacing = theme.spacing;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={[
            styles.overlay,
            {
              // Lighter overlay so current screen stays visible (dimmed) underneath, not dull black
              backgroundColor: OVERLAY_COLORS.BACKDROP_OVERLAY,
              zIndex: 9998,
              elevation: 9998,
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  height,
                  borderTopLeftRadius: radius["2xl"],
                  borderTopRightRadius: radius["2xl"],
                  ...(Platform.OS === "android" && { elevation: 24 }),
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}
            >
              <AppImageBackground
                source={bgSource}
                style={[styles.bg, { paddingTop: spacing[10] + 8 }]}
                resizeMode="contain"
              >
                <TouchableOpacity
                  style={[
                    styles.close,
                    {
                      top: spacing[4],
                      right: spacing[4],
                      minWidth: 44,
                      minHeight: 44,
                    },
                  ]}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <CloseIcon isDark={isDark} style={styles.closeIcon} />
                </TouchableOpacity>

                {children}
              </AppImageBackground>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    overflow: "hidden",
  },
  bg: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  close: {
    position: "absolute",
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 20,
    height: 20,
  },
});
