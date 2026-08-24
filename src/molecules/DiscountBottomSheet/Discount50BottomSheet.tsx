/**
 * 50% Discount Bottom Sheet Component
 * Specialized bottom sheet for 50% discount promotion
 * 70% screen height with gift box, timer, features, and CTA
 */

import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Text, Button } from "../../atoms";
import { Images } from "../../assets";
import { useTheme, useIsDark } from "../../hooks/useTheme";
import { SUBSCRIPTION_COLORS } from "../../constants/colorConstants";

import { spacing } from "../../design-system/spacing";

const { height: _SCREEN_HEIGHT } = Dimensions.get("window");

interface Discount50BottomSheetProps {
  visible: boolean;
  durationSeconds: number;
  onClose: () => void;
  onCTAPress: () => void;
}

const FEATURES = [
  {
    icon: "subscriptionListIdentification",
    iconDark: "subscriptionListIdentificationDark",
    text: "Identify as many mushrooms as you want.",
  },
  {
    icon: "subscriptionListCollection",
    iconDark: "subscriptionListCollectionDark",
    text: "Create and manage unlimited collections.",
  },
  {
    icon: "subscriptionListDetails",
    iconDark: "subscriptionListDetailsDark",
    text: "Get all the detailed information for each mushroom.",
  },
  {
    icon: "subscriptionListFeed",
    iconDark: "subscriptionListFeedDark",
    text: "Post as often as you like with no daily limit.",
  },
  {
    icon: "subscriptionListMushroomOfDay",
    iconDark: "subscriptionListMushroomOfDayDark",
    text: "Refresh and view more mushrooms daily.",
  },
  {
    icon: "subscriptionListAiChat",
    iconDark: "subscriptionListAiChatDark",
    text: "Ask the AI as many questions as you need.",
  },
] as const;

export const Discount50BottomSheet: React.FC<Discount50BottomSheetProps> = ({
  visible,
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
  // 70% of screen height
  const snapPoints = useMemo(() => ["70%"], []);

  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    if (!visible) {
      sheetRef.current?.close();
      return;
    }

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

  const bgSource = isDark
    ? Images.subscriptionPopup50Dark
    : Images.subscriptionPopup50Light;

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
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <AppImage
            source={bgSource}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: spacing[2], right: spacing[4] }]}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CloseIcon isDark={isDark} />
        </TouchableOpacity>

        {/* Content Container */}
        <View style={[styles.content, { paddingHorizontal: spacing[4] }]}>
          {/* Gift Box */}
          <View style={styles.giftBoxContainer}>
            <AppImage
              source={Images.giftBox}
              style={styles.giftBox}
              resizeMode="contain"
            />
          </View>

          {/* Timer Badge */}
          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor: SUBSCRIPTION_COLORS.TIMER_BADGE_BG,
                borderRadius: radius.md,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1],
                marginTop: spacing[2],
              },
            ]}
          >
            <Text
              variant="body"
              size="small"
              weight="bold"
              style={{
                color: SUBSCRIPTION_COLORS.TIMER_BADGE_TEXT,
                fontSize: 12,
                lineHeight: 16,
              }}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Text>
          </View>

          {/* Title */}
          <Text
            variant="headline"
            size="large"
            weight="bold"
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                marginTop: spacing[3],
              },
            ]}
          >
            Unlock 50% Off — Go Pro+ Today
          </Text>

          {/* Subtitle */}
          <Text
            variant="body"
            size="medium"
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
                marginTop: spacing[2],
              },
            ]}
          >
            Instantly upgrade to enjoy smarter, faster insect app for half the
            price.
          </Text>

          {/* Features List */}
          <View style={[styles.featuresList, { marginTop: spacing[4] }]}>
            {FEATURES.map((feature, index) => (
              <View
                key={index}
                style={[styles.featureItem, { marginBottom: spacing[2] }]}
              >
                <AppImage
                  source={
                    Images[
                      (isDark ? feature.iconDark : feature.icon) as keyof typeof Images
                    ]
                  }
                  style={styles.featureIcon}
                  resizeMode="contain"
                />
                <Text
                  variant="body"
                  size="small"
                  style={[styles.featureText, { color: colors.textSecondary }]}
                >
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA Button */}
          <Button
            title="Get perks & go Pro+"
            variant="primary"
            size="large"
            fullWidth
            style={[
              styles.ctaButton,
              {
                marginTop: spacing[4],
                backgroundColor: colors.primaryCTA,
              },
            ]}
            textStyle={
              isDark
                ? { color: SUBSCRIPTION_COLORS.CTA_TEXT_DARK }
                : { color: SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT }
            }
            onPress={onCTAPress}
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  bg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    opacity: 0.3, // Make background subtle so content is readable
  },
  closeButton: {
    position: "absolute",
    zIndex: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 24,
  },
  giftBoxContainer: {
    alignItems: "center",
  },
  giftBox: {
    width: 100,
    height: 100,
  },
  timerBadge: {
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
    paddingHorizontal: spacing[4],
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 22,
  },
  featuresList: {
    width: "100%",
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    lineHeight: 20,
  },
  ctaButton: {
    width: "100%",
  },
});
