/**
 * Post-auth onboarding permission slides (location + notifications).
 * Same title / hero / body / CTA layout so screen 1 and 2 match.
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { useStrings } from "../../../hooks/useStrings";
import { Text } from "../../../atoms";
import { POST_AUTH_LAYOUT } from "../constants";
import { usePostAuthLayoutMetrics } from "../utils/postAuthLayout";
import { usePostAuthOnboardingIsDark } from "../utils/theme";

/** Figma text-icon-primary (light) for permission slide titles */
const TITLE_COLOR_LIGHT = "#091B21";

/**
 * Figma notifications slide (375×812): content card starts under the 52pt nav
 * with 20pt padding → copy 72pt below the status bar; illustration ends 84pt
 * above the CTA (20 padding + 48 gap + 16 CTA bar top padding).
 */
const FIGMA_FRAME_WIDTH = 375;
const PINNED_CONTENT_TOP = 72;
const PINNED_HERO_BOTTOM_GAP = 68;
const PINNED_HERO_BOTTOM_GAP_COMPACT = 40;
const PINNED_MIN_COPY_TO_HERO_GAP = 24;
/** Figma home-indicator bar under "Maybe later" */
const PINNED_FOOTER_BOTTOM = 32;

type PostAuthLocationAccessSlideProps = {
  onContinue: () => void;
  continueLoading?: boolean;
  textPrimary: string;
  /** Subtitle color (Figma text-icon-secondary). Falls back to textPrimary. */
  textSecondary?: string;
  primaryColor: string;
  onPrimaryColor: string;
  title?: string;
  subtitle?: string;
  image?: ImageSourcePropType;
  continueLabel?: string;
  /** Optional underlined text button under the CTA (e.g. "Maybe later") */
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  /**
   * Figma size of the hero illustration (pt). When set, the hero is pinned to
   * the bottom of the content area at up to this size (Figma notifications layout).
   */
  heroDesignSize?: { width: number; height: number };
};

export const PostAuthLocationAccessSlide: React.FC<
  PostAuthLocationAccessSlideProps
> = ({
  onContinue,
  continueLoading = false,
  textPrimary,
  textSecondary,
  primaryColor,
  onPrimaryColor,
  title,
  subtitle,
  image,
  continueLabel,
  secondaryLabel,
  onSecondaryPress,
  heroDesignSize,
}) => {
  const strings = useStrings();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [heroBox, setHeroBox] = React.useState<{ w: number; h: number } | null>(
    null
  );
  const layout = usePostAuthLayoutMetrics();
  const isDark = usePostAuthOnboardingIsDark();
  const copy = strings.camera.galleryLocationAccess;
  const heading = title ?? copy.title;
  const body = subtitle ?? copy.subtitle;
  const cta = continueLabel ?? copy.continue;
  const hero = image ?? Images.locationPost;

  /**
   * Figma "bottom-pinned hero" layout (notifications slide):
   * copy at top, illustration pinned to the bottom of the content area,
   * free space in between. Illustration shrinks on short screens.
   */
  const pinned = heroDesignSize != null;
  const contentTopPadding = pinned
    ? layout.isVeryCompact
      ? 48
      : layout.isCompact
      ? 60
      : PINNED_CONTENT_TOP
    : layout.contentTopPadding;
  const heroBottomGap = pinned
    ? layout.isCompact
      ? PINNED_HERO_BOTTOM_GAP_COMPACT
      : PINNED_HERO_BOTTOM_GAP
    : 0;
  /**
   * Explicit hero size from the measured free space: Figma frame size scaled
   * by screen width (295/375), shrunk to fit the available height, aspect kept.
   * The webp already contains Figma's frame padding (3pt top, 27.25pt right).
   */
  const pinnedHeroSize = React.useMemo(() => {
    if (!heroDesignSize || !heroBox || heroBox.w <= 0 || heroBox.h <= 0) {
      return null;
    }
    const aspect = heroDesignSize.width / heroDesignSize.height;
    const maxWidth = (heroDesignSize.width * windowWidth) / FIGMA_FRAME_WIDTH;
    const width = Math.min(maxWidth, heroBox.w, heroBox.h * aspect);
    return { width, height: width / aspect };
  }, [heroBox, heroDesignSize, windowWidth]);
  /** SafeAreaView already pads insets.bottom; top up to Figma's 32pt home-indicator area */
  const footerPaddingBottom = pinned
    ? Math.max(0, PINNED_FOOTER_BOTTOM - insets.bottom)
    : 4;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.mainContent,
          { paddingTop: contentTopPadding, paddingBottom: heroBottomGap },
        ]}
      >
        <Text
          variant="title"
          size="large"
          allowFontScaling={false}
          style={[
            styles.title,
            { color: isDark ? textPrimary : TITLE_COLOR_LIGHT },
          ]}
        >
          {heading}
        </Text>

        <Text
          allowFontScaling={false}
          style={[styles.body, { color: textSecondary ?? textPrimary }]}
        >
          {body}
        </Text>

        <View
          style={[
            styles.heroWrap,
            pinned && styles.heroWrapPinned,
            { marginTop: pinned ? PINNED_MIN_COPY_TO_HERO_GAP : layout.titleToHeroGap },
          ]}
          onLayout={
            pinned
              ? (e) => {
                  const { width: w, height: h } = e.nativeEvent.layout;
                  setHeroBox((prev) =>
                    prev &&
                    Math.round(prev.w) === Math.round(w) &&
                    Math.round(prev.h) === Math.round(h)
                      ? prev
                      : { w, h }
                  );
                }
              : undefined
          }
        >
          {pinned ? (
            pinnedHeroSize ? (
              <AppImage
                source={hero}
                style={pinnedHeroSize}
                resizeMode="contain"
              />
            ) : null
          ) : (
            <AppImage
              source={hero}
              style={styles.heroImage}
              resizeMode="contain"
            />
          )}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: primaryColor }]}
          onPress={onContinue}
          disabled={continueLoading}
          activeOpacity={0.85}
        >
          {continueLoading ? (
            <ActivityIndicator color={onPrimaryColor} size="small" />
          ) : (
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[styles.primaryLabel, { color: onPrimaryColor }]}
            >
              {cta}
            </Text>
          )}
        </TouchableOpacity>
        {secondaryLabel && onSecondaryPress ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onSecondaryPress}
            disabled={continueLoading}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[
                styles.secondaryLabel,
                { color: isDark ? textPrimary : TITLE_COLOR_LIGHT },
              ]}
            >
              {secondaryLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  mainContent: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  /** Figma Title/28px/Bold — 28px, 700, 36px line-height, center, 335 wide */
  title: {
    textAlign: "center",
    fontFamily: FONTS.bold,
    fontStyle: "normal",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 36,
    includeFontPadding: false,
    width: POST_AUTH_LAYOUT.contentWidth,
    maxWidth: "100%",
    flexShrink: 0,
  },
  heroWrap: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: POST_AUTH_LAYOUT.contentWidth,
    maxWidth: "100%",
    height: "100%",
  },
  /** Pinned layout: hero sits at the bottom of the content area */
  heroWrapPinned: {
    justifyContent: "flex-end",
  },
  /** Figma Button/16px: Satoshi Medium 16/24 */
  primaryLabel: {
    fontFamily: FONTS.medium,
    fontStyle: "normal",
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 24,
    includeFontPadding: false,
    textAlign: "center",
  },
  /** Figma Body/16px/Regular — 16px, 400, 24px line-height, -0.16 tracking, ligatures off, 335 wide */
  body: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: FONTS.regular,
    fontStyle: "normal",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    includeFontPadding: false,
    /** 'liga' off, 'clig' off */
    fontVariant: ["no-common-ligatures"],
    width: POST_AUTH_LAYOUT.contentWidth,
    maxWidth: "100%",
    flexShrink: 0,
  },
  footer: {
    width: "100%",
    paddingHorizontal: POST_AUTH_LAYOUT.horizontalPadding,
    paddingTop: 16,
    paddingBottom: 4,
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  /**
   * Figma: 119×32, padding 8/12, centered, gap 8. Figma's 8pt vertical padding
   * leaves 16pt for a 20pt line (it overflows in Figma); RN clips that, so use
   * 6pt to keep the 32pt height with the full 20pt line + underline visible.
   */
  secondaryButton: {
    minWidth: 119,
    height: 32,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 23.789,
  },
  /** Figma Button/14px: Satoshi Medium 14/20, underlined, #091B21 */
  secondaryLabel: {
    fontFamily: FONTS.medium,
    fontStyle: "normal",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  primaryButton: {
    width: POST_AUTH_LAYOUT.contentWidth,
    maxWidth: "100%",
    height: POST_AUTH_LAYOUT.ctaHeight,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
