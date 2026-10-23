import { AppImage } from "@/components/AppImage";
import { CloseIcon } from "@/components/shared/CloseIcon";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ImageSourcePropType,
  Platform,
  Text as RNText,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsDark, useTheme } from "../../hooks/useTheme";
import { MODAL_STRINGS } from "../../config/strings/modals.strings";
import {
  SUBSCRIPTION_COLORS,
  OVERLAY_COLORS,
} from "../../constants/colorConstants";
import { Images } from "../../assets";
import { GlowingWaveSpecimenCard } from "../GlowingWaveSpecimenCard/GlowingWaveSpecimenCard";
import { FONTS } from "../../common/typography";
import {
  computeBirdOfTheDayModalLayout,
  MUSHROOM_OF_DAY_HEADER_LIGHT_ASPECT,
  MUSHROOM_OF_DAY_MODAL_LAYOUT,
} from "./birdOfTheDayModal.config";
import { resolveBirdHeroImageUrls } from "../../utils/mushroomCardUtils";

const GOLD_NAME = "#FFC13B";
const GOLD_GLOW = "#FFDD24";
const LABEL_GREY = "#E7E7E7";

export interface BirdOfTheDayModalProps {
  visible: boolean;
  mushroomId?: string;
  mushroomName: string;
  scientificName?: string;
  price?: string;
  mushroomImage?: string | ImageSourcePropType;
  /** Resolved carousel URLs when `mushroomImage` is missing or stale. */
  mushroomImageUrls?: string[];
  canonicalName?: string;
  onClose: () => void;
  /** Premium: cycle to next mushroom of the day. */
  onRefresh?: () => void;
  /** Free: close modal then show upgrade sheet (parent). */
  onFreeRefreshBlocked?: () => void;
  onViewDetail?: () => void;
  showRefreshButton?: boolean;
  isPremium?: boolean;
  isRefreshing?: boolean;
}

export const BirdOfTheDayModal = ({
  visible,
  mushroomId,
  mushroomName,
  scientificName,
  price,
  mushroomImage,
  mushroomImageUrls,
  canonicalName,
  onClose,
  onRefresh,
  onFreeRefreshBlocked,
  onViewDetail,
  showRefreshButton = true,
  isPremium = false,
  isRefreshing = false,
}: BirdOfTheDayModalProps) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [measuredFooterHeight, setMeasuredFooterHeight] = useState(0);
  const theme = useTheme();
  const colors = theme.colors;
  const isDark = useIsDark();
  const showRefresh = showRefreshButton;
  const canRefresh = showRefresh && !isRefreshing;
  const hasPrice = price != null && price !== "";

  const layout = useMemo(
    () =>
      computeBirdOfTheDayModalLayout({
        windowWidth,
        windowHeight,
        safeTop: insets.top,
        safeBottom: insets.bottom,
        hasScientificName: Boolean(scientificName?.trim()),
        hasPrice,
        showRefresh,
        measuredFooterHeight,
        platform: Platform.OS,
      }),
    [
      windowWidth,
      windowHeight,
      insets.top,
      insets.bottom,
      scientificName,
      hasPrice,
      showRefresh,
      measuredFooterHeight,
    ]
  );

  const handleFooterLayout = useCallback((height: number) => {
    if (height > 0) {
      setMeasuredFooterHeight((prev) =>
        Math.abs(prev - height) > 1 ? height : prev
      );
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setMeasuredFooterHeight(0);
    }
  }, [visible, scientificName, price, mushroomName, showRefresh]);

  const ctaBg = isDark
    ? SUBSCRIPTION_COLORS.CTA_PRIMARY_DARK
    : SUBSCRIPTION_COLORS.CTA_PRIMARY_LIGHT;
  const ctaTextColor = isDark
    ? SUBSCRIPTION_COLORS.CTA_TEXT_DARK
    : SUBSCRIPTION_COLORS.CTA_TEXT_LIGHT;

  const labelColor = LABEL_GREY;
  const secondaryButtonBg = isDark ? colors.surfaceSecondary : "#FFFFFF";
  const secondaryButtonBorder = isDark ? colors.borderSecondary : "#E7E7E7";
  const secondaryButtonText = isDark ? colors.textPrimary : "#111111";
  const closeBg = isDark ? colors.surfaceSecondary : "#111111";
  const closeBorder = isDark ? colors.borderSecondary : "#6D6D6D";

  const heroUris = useMemo(() => {
    const explicit =
      typeof mushroomImage === "string"
        ? mushroomImage
        : mushroomImage &&
            typeof mushroomImage === "object" &&
            "uri" in mushroomImage &&
            typeof mushroomImage.uri === "string"
          ? mushroomImage.uri
          : undefined;
    const uris = resolveBirdHeroImageUrls(
      canonicalName,
      mushroomImageUrls,
      scientificName,
      explicit
    );
    return uris;
  }, [mushroomImage, mushroomImageUrls, canonicalName, scientificName]);

  const specimenSource = heroUris[0]
    ? { uri: heroUris[0] }
    : Images.mineralSample;

  const lightHeaderHeight = Math.round(
    layout.headerWidth / MUSHROOM_OF_DAY_HEADER_LIGHT_ASPECT
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : undefined}
    >
      <View
        style={[
          styles.backdrop,
          { backgroundColor: OVERLAY_COLORS.MODAL_BACKDROP_DARK },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.closeBtn,
            {
              top: layout.closeTop,
              right: layout.closeRight,
              backgroundColor: closeBg,
              borderColor: closeBorder,
            },
          ]}
          onPress={onClose}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <CloseIcon isDark variant="plain" size={14} />
        </TouchableOpacity>

        <View
          style={[
            styles.contentContainer,
            {
              paddingTop: layout.contentPaddingTop,
              paddingHorizontal: layout.buttonPaddingHorizontal,
            },
          ]}
        >
          <View
            style={[
              styles.headerContainer,
              {
                width: layout.headerWidth,
                height: isDark ? layout.headerHeight : lightHeaderHeight,
              },
            ]}
          >
            <AppImage
              source={isDark ? Images.birdOfDayPopupDark : Images.birdOfDayPopup}
              style={{
                width: layout.headerWidth,
                height: isDark ? layout.headerHeight : lightHeaderHeight,
              }}
              resizeMode="cover"
              preferRNImage
            />
          </View>

          <View
            pointerEvents="box-none"
            style={[
              styles.heroLayer,
              {
                top: layout.heroLayerTop,
                left: layout.contentLeft,
                width: layout.contentWidth,
                height: layout.heroHeight,
              },
            ]}
          >
            <GlowingWaveSpecimenCard
              key={mushroomId ?? mushroomName}
              imageSource={specimenSource}
              imageUris={heroUris}
              animate={visible}
              width={layout.heroWidth}
            />
          </View>

          <View
            pointerEvents="box-none"
            style={[
              styles.footerLayer,
              {
                bottom: layout.footerBottom,
                left: layout.contentLeft,
                width: layout.contentWidth,
                paddingHorizontal: layout.buttonPaddingHorizontal,
              },
            ]}
          >
            <View
              style={styles.footerInner}
              onLayout={(e) => handleFooterLayout(e.nativeEvent.layout.height)}
            >
              <View style={styles.textSection}>
                <View style={styles.nameDividerRow}>
                  <View
                    style={[styles.dividerLine, { backgroundColor: labelColor }]}
                  />
                  <RNText
                    style={[styles.commonName, { color: labelColor }]}
                    numberOfLines={1}
                  >
                    {mushroomName}
                  </RNText>
                  <View
                    style={[styles.dividerLine, { backgroundColor: labelColor }]}
                  />
                </View>

                {scientificName ? (
                  <RNText style={styles.scientificName} numberOfLines={2}>
                    {scientificName}
                  </RNText>
                ) : null}

                {hasPrice ? (
                  <RNText style={[styles.priceText, { color: labelColor }]}>
                    {price}
                  </RNText>
                ) : null}
              </View>

              <View
                style={[
                  styles.actions,
                  showRefresh && styles.actionsRow,
                  { marginTop: layout.textToCtaGap },
                ]}
              >
                {showRefresh ? (
                  <TouchableOpacity
                    style={[
                      styles.viewDetailButton,
                      {
                        backgroundColor: secondaryButtonBg,
                        borderColor: secondaryButtonBorder,
                      },
                      styles.viewDetailButtonInline,
                      isPremium && !canRefresh && styles.refreshButtonDisabled,
                    ]}
                    onPress={() => {
                      if (isPremium) {
                        if (canRefresh) onRefresh?.();
                        return;
                      }
                      onClose();
                      onFreeRefreshBlocked?.();
                    }}
                    activeOpacity={0.85}
                    disabled={isPremium && !canRefresh}
                  >
                    <RNText
                      style={[
                        styles.viewDetailText,
                        { color: secondaryButtonText },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {MODAL_STRINGS.birdOfTheDay.refresh}
                    </RNText>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.viewDetailButton,
                    showRefresh
                      ? [
                          styles.viewDetailButtonInline,
                          styles.viewDetailButtonPrimary,
                          { backgroundColor: ctaBg, borderColor: ctaBg },
                        ]
                      : {
                          backgroundColor: secondaryButtonBg,
                          borderColor: secondaryButtonBorder,
                        },
                  ]}
                  onPress={() => {
                    onViewDetail?.();
                    onClose();
                  }}
                  activeOpacity={0.85}
                >
                  <RNText
                    style={[
                      styles.viewDetailText,
                      {
                        color: showRefresh ? ctaTextColor : secondaryButtonText,
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {MODAL_STRINGS.birdOfTheDay.viewDetail}
                  </RNText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    zIndex: 20,
    width: 32,
    height: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContainer: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  heroLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 2,
  },
  footerLayer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 3,
  },
  footerInner: {
    width: "100%",
    alignItems: "center",
  },
  textSection: {
    width: "100%",
    maxWidth: 235,
    alignItems: "center",
    gap: 5,
  },
  nameDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.6,
  },
  commonName: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    lineHeight: MUSHROOM_OF_DAY_MODAL_LAYOUT.commonNameHeight,
    maxWidth: 120,
  },
  scientificName: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    lineHeight: MUSHROOM_OF_DAY_MODAL_LAYOUT.scientificNameLineHeight,
    color: GOLD_NAME,
    textAlign: "center",
    width: "100%",
  },
  priceText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    lineHeight: MUSHROOM_OF_DAY_MODAL_LAYOUT.priceLineHeight,
    textAlign: "center",
    marginTop: 4,
  },
  actions: {
    width: "100%",
    maxWidth: 335,
    gap: MUSHROOM_OF_DAY_MODAL_LAYOUT.ctaRowGap,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailButton: {
    width: "100%",
    height: MUSHROOM_OF_DAY_MODAL_LAYOUT.ctaMinHeight,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    shadowColor: GOLD_GLOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.26,
    shadowRadius: 12.5,
    elevation: 6,
  },
  viewDetailButtonPrimary: {
    shadowOpacity: 0,
    elevation: 0,
  },
  viewDetailText: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  refreshButtonDisabled: {
    opacity: 0.55,
  },
  viewDetailButtonInline: {
    flex: 1,
    width: undefined,
  },
});

/** @deprecated Use BirdOfTheDayModal */
export const MushroomOfTheDayModal = BirdOfTheDayModal;
/** @deprecated Use BirdOfTheDayModalProps */
export type MushroomOfTheDayModalProps = BirdOfTheDayModalProps;
