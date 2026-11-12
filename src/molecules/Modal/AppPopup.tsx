import { ScrollView, useWindowDimensions } from "react-native";
/**
 * Shared App Popup Component
 * Popups do not use little_bg; only bottom sheets and modals do.
 * X icon top-right, center icon, primary/secondary text, and CTA buttons.
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { OVERLAY_COLORS } from "../../constants/colorConstants";
import { Radius } from "../../design";
import {
  getPopupChromeStyle,
  getPopupPrimaryCtaStyle,
  getPopupPrimaryCtaTextColor,
  getPopupSecondaryCtaStyle,
  getPopupSecondaryCtaTextColor,
} from "../../design-system/modalTokens";

export interface AppPopupProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: any; // Image source for center icon
  primaryButtonText: string;
  onPrimaryPress: () => void;
  /** When true, primary button shows loading spinner (e.g. logout/delete in progress). */
  primaryLoading?: boolean;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
}

export const AppPopup: React.FC<AppPopupProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  primaryButtonText,
  onPrimaryPress,
  primaryLoading = false,
  secondaryButtonText,
  onSecondaryPress,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.popupContainer,
            { maxHeight: Math.max(1, windowHeight - 64) },
            getPopupChromeStyle(theme),
          ]}
        >
          {/* Close Button - Top right (delete / logout / remove confirmations) */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                top: spacing[3],
                right: spacing[3],
                width: 40,
                height: 40,
                padding: 8,
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              },
            ]}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CloseIcon isDark={theme.mode === "dark"} />
          </TouchableOpacity>

          {/* Content */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={[
              styles.content,
              { padding: spacing[5], paddingTop: spacing[6] },
            ]}
          >
            {/* Center Icon */}
            {icon && (
              <View
                style={[styles.iconContainer, { marginBottom: spacing[4] }]}
              >
                <AppImage
                  source={icon}
                  style={styles.icon}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Title - Primary Text (bold heading) */}
            <Text
              variant="title"
              size="medium"
              weight="bold"
              style={[
                styles.title,
                {
                  color: colors.textPrimary,
                  marginBottom: subtitle ? spacing[2] : spacing[6],
                },
              ]}
            >
              {title}
            </Text>

            {/* Subtitle - Secondary Text */}
            {subtitle && (
              <Text
                variant="body"
                size="medium"
                color="textSecondary"
                style={[
                  styles.subtitle,
                  {
                    marginBottom: spacing[6],
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}

            {/* Primary Button - Allow/CTA: theme-aware light and dark */}
            <Button
              title={primaryButtonText}
              variant="primary"
              size="large"
              style={getPopupPrimaryCtaStyle(theme)}
              textStyle={{ color: getPopupPrimaryCtaTextColor(theme) }}
              onPress={onPrimaryPress}
              fullWidth
              disabled={primaryLoading}
              loading={primaryLoading}
            />

            {/* Secondary Button - same CTA style for logout, delete account, delete collection */}
            {secondaryButtonText && onSecondaryPress && (
              <Button
                title={secondaryButtonText}
                variant="secondary"
                size="large"
                onPress={onSecondaryPress}
                fullWidth
                style={{
                  marginTop: spacing[3],
                  ...getPopupSecondaryCtaStyle(theme),
                }}
                textStyle={{
                  color: getPopupSecondaryCtaTextColor(theme),
                }}
              />
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: OVERLAY_COLORS.BACKDROP_LIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupContainer: {
    width: 335,
    maxWidth: "100%",
    position: "relative",
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    zIndex: 10,
    borderRadius: Radius.md,
  },
  content: {
    alignItems: "center",
    zIndex: 2,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 64,
    height: 64,
  },
  title: {
    textAlign: "center",
    paddingHorizontal: 8,
    fontSize: 20,
    lineHeight: 28,
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 22,
    fontSize: 16,
  },
});
