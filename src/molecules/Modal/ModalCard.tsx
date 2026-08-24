/**
 * Shared floating card for modals/popups.
 * Centered card with theme surface, radius 16–24, elevation, optional close (top-right, 44x44).
 */

import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp, Platform } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { HIT_SLOP } from "../../constants/uiConstants";
import { getPopupChromeStyle } from "../../design-system/modalTokens";

const CLOSE_HIT_SLOP = HIT_SLOP.CLOSE;
const CLOSE_MIN_SIZE = 44;

export interface ModalCardProps {
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const ModalCard: React.FC<ModalCardProps> = ({
  children,
  onClose,
  showCloseButton = true,
  style,
  contentStyle,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const _radius = theme.radius;
  const shadows = theme.shadows;

  const baseShadow = shadows?.lg ?? {};
  const cardShadow =
    theme.mode === "dark"
      ? {
          ...baseShadow,
          shadowOpacity: Number(baseShadow.shadowOpacity ?? 0.15) * 0.5,
          elevation: 4,
        }
      : baseShadow;

  return (
    <View
      style={[
        styles.card,
        getPopupChromeStyle(theme),
        {
          padding: spacing[6],
          ...cardShadow,
        },
        style,
      ]}
    >
      {showCloseButton && onClose ? (
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { right: spacing[4], top: spacing[4] }]}
          hitSlop={CLOSE_HIT_SLOP}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <View style={styles.closeBtnInner}>
            <CloseIcon isDark={theme.mode === "dark"} />
          </View>
        </TouchableOpacity>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    ...(Platform.OS === "android" ? { elevation: 8 } : {}),
  },
  closeBtn: {
    position: "absolute",
    zIndex: 10,
    minWidth: CLOSE_MIN_SIZE,
    minHeight: CLOSE_MIN_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnInner: {
    width: CLOSE_MIN_SIZE,
    height: CLOSE_MIN_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingTop: 8,
  },
});
