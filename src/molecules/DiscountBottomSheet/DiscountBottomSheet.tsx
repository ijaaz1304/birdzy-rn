/**
 * Discount Bottom Sheet Component
 * Slides from bottom using @gorhom/bottom-sheet
 * Image-only background, supports 50% and 70% discounts
 * Light & Dark mode support
 *
 * NOTE: Requires @gorhom/bottom-sheet to be installed:
 * npm install @gorhom/bottom-sheet
 * npm install react-native-reanimated react-native-gesture-handler (if not already installed)
 */

import { AppImage } from "@/components/AppImage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Text, Button } from "../../atoms";
import { Images, CancelIconLight, CancelIconDark } from "../../assets";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import {
  OVERLAY_COLORS,
  SUBSCRIPTION_COLORS,
} from "../../constants/colorConstants";

interface DiscountBottomSheetProps {
  visible: boolean;
  percentage: 50 | 70;
  durationSeconds: number;
  onClose: () => void;
  onCTAPress: () => void;
}

export const DiscountBottomSheet: React.FC<DiscountBottomSheetProps> = ({
  visible,
  percentage,
  durationSeconds,
  onClose,
  onCTAPress,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const spacing = theme.spacing;
  const radius = theme.radius;

  const isDark = useIsDark();

  const sheetRef = useRef<BottomSheet>(null);
  // 70% height for better content display
  const snapPoints = useMemo(() => ["70%"], []);

  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    if (!visible) {
      sheetRef.current?.close();
      return;
    }

    if (__DEV__) {
      console.log("[Overlay] DiscountBottomSheet opened", `(${percentage}%)`);
    }
    // Small delay to ensure proper rendering
    setTimeout(() => {
      sheetRef.current?.expand();
    }, 100);
    setSecondsLeft(durationSeconds);

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, durationSeconds, onClose]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const bgSource = isDark ? Images.popUp50Dark : Images.popUp50Light;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.6}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: isDark
          ? SUBSCRIPTION_COLORS.BOTTOM_SHEET_BG_DARK
          : SUBSCRIPTION_COLORS.BOTTOM_SHEET_BG_LIGHT,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark
          ? SUBSCRIPTION_COLORS.BOTTOM_SHEET_HANDLE_DARK
          : SUBSCRIPTION_COLORS.BOTTOM_SHEET_HANDLE_LIGHT,
        width: 40,
      }}
      backdropComponent={renderBackdrop}
      enableContentPanningGesture={true}
    >
      <View style={[styles.container, { borderRadius: radius.xl }]}>
        <View style={[StyleSheet.absoluteFill, styles.bg]} pointerEvents="none">
          <AppImage
            source={bgSource}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
        </View>

        {/* Close Button - Top Right */}
        <TouchableOpacity
          style={[styles.close, { top: spacing[4], right: spacing[4] }]}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isDark ? (
            <CancelIconDark width={24} height={24} />
          ) : (
            <CancelIconLight width={24} height={24} />
          )}
        </TouchableOpacity>

        {/* Timer Badge - Top Left */}
        <View
          style={[
            styles.timer,
            {
              top: spacing[4],
              left: spacing[4],
              backgroundColor: OVERLAY_COLORS.BOTTOM_SHEET_BACKDROP,
              borderRadius: radius.md,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
            },
          ]}
        >
          <Text
            variant="body"
            size="medium"
            weight="semibold"
            style={{ color: theme.colors.onPrimary }}
          >
            ⏱ {minutes}:{seconds.toString().padStart(2, "0")}
          </Text>
        </View>

        {/* Content */}
        <View
          style={[
            styles.content,
            { marginTop: 80, paddingHorizontal: spacing[6], zIndex: 2 },
          ]}
        >
          {/* Gift Box (if 50% discount) */}
          {percentage === 50 && (
            <View style={{ alignItems: "center", marginBottom: spacing[4] }}>
              <AppImage
                source={Images.giftBox}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </View>
          )}

          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={{
              color: colors.textPrimary,
              textAlign: "center",
              zIndex: 3,
            }}
          >
            Unlock {percentage}% Off — Go Pro+ Today
          </Text>

          <Text
            variant="body"
            size="medium"
            style={{
              marginTop: spacing[2],
              textAlign: "center",
              color: colors.textSecondary,
              zIndex: 3,
            }}
          >
            Instantly upgrade to enjoy a smarter, faster birding app for half
            the price.
          </Text>

          <Button
            title="Get perks & go Pro+"
            variant="primary"
            size="large"
            fullWidth
            onPress={onCTAPress}
            style={{
              marginTop: spacing[6],
              backgroundColor: colors.primaryCTA,
              zIndex: 3,
            }}
            textStyle={
              isDark
                ? { color: SUBSCRIPTION_COLORS.CTA_TEXT_DARK }
                : { color: SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT }
            }
          />

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: spacing[3],
              alignItems: "center",
              zIndex: 3,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: isDark
                ? SUBSCRIPTION_COLORS.SECONDARY_CTA_BORDER_DARK
                : SUBSCRIPTION_COLORS.SECONDARY_CTA_BORDER_LIGHT,
            }}
          >
            <Text
              variant="body"
              size="medium"
              style={{
                color: isDark
                  ? SUBSCRIPTION_COLORS.LATER_TEXT_DARK
                  : SUBSCRIPTION_COLORS.LATER_TEXT_LIGHT,
                textDecorationLine: "underline",
              }}
            >
              Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  close: {
    position: "absolute",
    zIndex: 10,
  },
  timer: {
    position: "absolute",
    zIndex: 10,
  },
  content: {
    alignItems: "center",
    zIndex: 2,
  },
});
