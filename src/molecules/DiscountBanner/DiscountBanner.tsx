/**
 * Discount Banner Component
 * Image background banner with Open CTA and Close button
 * Supports light & dark mode
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { Text, Button } from "../../atoms";
import { Images, CancelIconLight, CancelIconDark } from "../../assets";

interface DiscountBannerProps {
  onOpen: () => void;
  onClose: () => void;
}

export const DiscountBanner: React.FC<DiscountBannerProps> = ({
  onOpen,
  onClose,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;

  const isDark = useIsDark();

  // Use banner images if available, fallback to banner1 images
  const bgImage = isDark
    ? Images.bannerDark || Images.banner1Dark
    : Images.bannerLight || Images.banner1;

  return (
    <View
      style={[
        styles.container,
        { borderRadius: radius.md, overflow: "hidden" },
      ]}
    >
      {/* Background Image */}
      <AppImage source={bgImage} style={styles.bg} resizeMode="cover" />

      {/* Close Button - Top Right */}
      <TouchableOpacity
        style={[styles.close, { top: spacing[2], right: spacing[2] }]}
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isDark ? (
          <CancelIconDark width={24} height={24} />
        ) : (
          <CancelIconLight width={24} height={24} />
        )}
      </TouchableOpacity>

      {/* Content */}
      <View style={[styles.content, { padding: spacing[4] }]}>
        <View style={styles.textContainer}>
          <Text
            variant="body"
            size="small"
            color="textSecondary"
            style={styles.label}
          >
            MUSHROOM OF THE DAY
          </Text>
          <Text
            variant="title"
            size="medium"
            weight="bold"
            style={{ color: colors.textPrimary, marginTop: spacing[1] }}
          >
            Say hello to today's featured bird!
          </Text>
        </View>

        <Button
          title="Open"
          variant="primary"
          size="small"
          onPress={onOpen}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  close: {
    position: "absolute",
    zIndex: 10,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  button: {
    minWidth: 80,
  },
});
