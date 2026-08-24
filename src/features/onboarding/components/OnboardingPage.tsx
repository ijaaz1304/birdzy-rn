/**
 * Individual Onboarding Page Component
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import {
  CARD_COLORS,
  SCREEN_COLORS,
  SUBSCRIPTION_COLORS,
} from "../../../constants/colorConstants";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { Text, Chip } from "../../../atoms";
import { OnboardingPageData } from "../screens/OnboardingScreenPhone";
import { Images } from "../../../assets";
import { ChatInterface } from "./ChatInterface";

import { FONTS } from "../../../common/typography";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import { APP_COLORS } from "../../../config/colors";
import { ONBOARDING_CTA_DARK } from "../onboardingCta.constants";

const { height: SCREEN_HEIGHT } = Dimensions.get("screen");

/** Onboarding background art is 1500×3252 — anchor to bottom so mushrooms align with design */
const ONBOARDING_BG_ASPECT = 3252 / 1500;
/** Shift all onboarding title/description blocks up by 6% of screen height */
const ONBOARDING_TEXT_SHIFT_UP = SCREEN_HEIGHT * 0.06;

export interface OnboardingPageProps {
  data: OnboardingPageData;
  width: number;
  pageIndex?: number;
  onSignUp?: () => void;
  onLogIn?: () => void;
  onContinueAsGuest?: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = React.memo(
  ({ data, width, pageIndex = 0, onSignUp, onLogIn, onContinueAsGuest }) => {
    const theme = useTheme();
    const isDark = useIsDark();
    const insets = useSafeAreaInsets();
    const layoutWidth = width;
    const layoutLeft = 0;
    const bgHeight = Math.max(SCREEN_HEIGHT, layoutWidth * ONBOARDING_BG_ASPECT);
    const contentMaxWidth = width - 40;
    const pageBackgroundStyle = {
      position: "absolute" as const,
      left: layoutLeft,
      bottom: 0,
      width: layoutWidth,
      height: bgHeight,
      zIndex: 0,
    };
    const showAuthButtons = data.illustration === "authProgress";
    const hasBackgroundImage = !!data.backgroundImage;
    /** Dark page 2 art includes stats/tabs — hide duplicate overlay at top */
    const hideTopStatsInDark = isDark && pageIndex === 1;
    const onboardingTextMaxWidth = contentMaxWidth;
    /** Auth header uses a single 20px inset (authTextSection); avoid double-padding textSection */
    const authProgressTextMaxWidth = contentMaxWidth;
    const authProgressSubtextMaxWidth = authProgressTextMaxWidth * 0.9;
    const authHeaderTopPadding = insets.top + 20;
    const showStatsHeader =
      !hideTopStatsInDark &&
      (!!data.stats || (data.tabs != null && data.tabs.length > 0));
    const showStatsOverlay = hasBackgroundImage && showStatsHeader;

    const renderStatsHeader = () => {
      if (!showStatsHeader) {
        return null;
      }

      return (
        <View
          style={[
            styles.statsHeader,
            showStatsOverlay && [
              styles.statsHeaderOverlay,
              { paddingTop: insets.top + 38 },
            ],
          ]}
        >
          {data.stats && (
            <View style={[styles.statsSection, styles.statsSectionCenter]}>
              <Text
                variant="body"
                size="small"
                style={[
                  styles.statsLabel,
                  hasBackgroundImage
                    ? styles.statsLabelOnLight
                    : styles.statsTextLight,
                ]}
              >
                {data.stats.label}
              </Text>
              <View style={styles.statsValueContainer}>
                <Text
                  variant="headline"
                  size="medium"
                  weight="bold"
                  style={
                    hasBackgroundImage
                      ? styles.statsValueOnLight
                      : styles.statsTextLight
                  }
                >
                  {data.stats.value}
                </Text>
                {data.stats.subtitle && (
                  <Text
                    variant="body"
                    size="small"
                    style={[
                      hasBackgroundImage
                        ? styles.statsValueSuffix
                        : styles.statsSubtitle,
                      !hasBackgroundImage && styles.statsTextLight,
                    ]}
                  >
                    {data.stats.subtitle}
                  </Text>
                )}
              </View>
            </View>
          )}
          {data.tabs && data.tabs.length > 0 && (
            <View style={[styles.tabsContainer, styles.tabsContainerCenter]}>
              {data.tabs.map((tab, index) => {
                const selected = index === 0;
                return (
                  <Chip
                    key={index}
                    label={tab}
                    size="small"
                    variant="filled"
                    color="default"
                    selected={selected}
                    labelColor={
                      selected
                        ? theme.colors.onPrimary
                        : APP_COLORS.brandPrimaryDark
                    }
                    style={
                      selected
                        ? {
                            ...styles.tab,
                            ...styles.chipOnboarding,
                            backgroundColor: theme.colors.primaryCTA,
                            borderColor: theme.colors.primaryCTA,
                          }
                        : {
                            ...styles.tab,
                            ...styles.chipOnboarding,
                            backgroundColor:
                              APP_COLORS.blurOverlayLightFallback,
                            borderColor: APP_COLORS.modalTextOnPrimary,
                            borderWidth: 1,
                          }
                    }
                  />
                );
              })}
            </View>
          )}
        </View>
      );
    };
    const renderPageBackground = () => {
      if (!hasBackgroundImage) return null;
      return (
        <AppImage
          source={data.backgroundImage!}
          style={pageBackgroundStyle}
          resizeMode="cover"
          preferRNImage
          fadeDuration={0}
        />
      );
    };
    const contentPaddingBottom = 96 + Math.max(insets.bottom, 32);
    const illustrationHeight =
      pageIndex === 0
        ? 560
        : pageIndex === 1
        ? 340
        : pageIndex === 2
        ? 520
        : pageIndex === 3
        ? 880
        : showAuthButtons
        ? 260
        : 560;

    /** Fixed layout: no vertical scroll on any onboarding page so layout stays fixed */
    const ContentWrapper = View;
    const contentWrapperProps = {
      style: [
        styles.content,
        styles.contentNoScroll,
        { paddingBottom: contentPaddingBottom },
      ],
    };

    const ContentTopWrapper = View;
    const contentTopProps = {
      style: showAuthButtons ? styles.contentTopAuth : styles.contentTop,
    };

    const renderOnboardingText = () => (
      <View
        style={[
          styles.textSection,
          styles.onboardingTextShiftUp,
          styles.textSectionOnboardingInset,
          styles.textSectionLeft,
          styles.textSectionFirstPage,
        ]}
      >
        <Text
          variant="title"
          size="medium"
          weight="bold"
          style={[
            styles.title,
            styles.titleOnboarding,
            styles.titleLeftAlign,
            { maxWidth: onboardingTextMaxWidth },
          ]}
        >
          {data.title}
        </Text>
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          style={[
            styles.description,
            styles.descriptionOnboarding,
            styles.descriptionLeftAlign,
            { maxWidth: onboardingTextMaxWidth },
          ]}
        >
          {data.description}
        </Text>
      </View>
    );

    // Auth page: 3-section layout — text top, image below, CTA at bottom (no absolute positioning)
    if (showAuthButtons) {
      const ctaPaddingBottom = Math.max(insets.bottom, 32) + 24;
      const authImageSource = data.illustrationImage ?? Images.diagnoseAi;
      return (
        <View
          style={[styles.container, styles.containerAuth, { width }]}
          collapsable={false}
        >
          {hasBackgroundImage && (
            <AppImage
              source={data.backgroundImage!}
              style={pageBackgroundStyle}
              resizeMode="cover"
              preferRNImage
              fadeDuration={0}
            />
          )}
          <View
            style={[
              styles.authTextSection,
              {
                paddingTop: authHeaderTopPadding,
              },
            ]}
          >
            <View style={[styles.textSectionAuth, styles.textSectionCenter]}>
              <Text
                variant="title"
                size="large"
                weight="bold"
                style={[
                  styles.titleAuthProgress,
                  {
                    maxWidth: authProgressTextMaxWidth,
                    color: theme.colors.text,
                  },
                ]}
              >
                {data.title}
              </Text>
              <Text
                variant="body"
                size="medium"
                style={[
                  styles.descriptionAuthProgress,
                  { maxWidth: authProgressSubtextMaxWidth },
                ]}
              >
                {data.description}
              </Text>
            </View>
          </View>
          {/* 2. Image section - below text (hidden when full background is used) */}
          {!hasBackgroundImage && (
            <View style={styles.authImageSection}>
              <View style={styles.authImageWrapper}>
                <AppImage
                  source={authImageSource}
                  style={styles.authIllustrationImage}
                  resizeMode="contain"
                  fadeDuration={0}
                  defaultSource={Images.homeFindShrooms}
                />
              </View>
            </View>
          )}
          {/* 3. Spacer - flex 1 pushes CTA to bottom */}
          <View style={styles.authSpacer} />
          {/* 4. CTA section - bottom, safe area */}
          <View
            style={[
              styles.authCtaSection,
              {
                paddingBottom: ctaPaddingBottom,
              },
            ]}
          >
            <TouchableOpacity
              onPress={onSignUp}
              style={[
                styles.signUpButton,
                styles.authButtonCta,
                isDark
                  ? {
                      backgroundColor: theme.colors.primaryCTA,
                      borderRadius: ONBOARDING_CTA_DARK.borderRadius,
                    }
                  : { backgroundColor: theme.colors.primaryCTA },
              ]}
              activeOpacity={0.7}
            >
              <Text
                variant="label"
                size="medium"
                weight="semibold"
                style={{ color: theme.colors.onPrimary }}
              >
                Sign up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onLogIn}
              style={[
                styles.logInButton,
                styles.authButtonCta,
                theme.mode === "dark"
                  ? {
                      backgroundColor: theme.colors.surfacePrimary,
                      borderWidth: 1,
                      borderColor: theme.colors.border0,
                      borderRadius: 24,
                    }
                  : {
                      backgroundColor:
                        SUBSCRIPTION_COLORS.COMPARISON_LIGHT.BASE_BG,
                      borderWidth: 1,
                      borderColor: CARD_COLORS.LIGHT.border,
                    },
              ]}
              activeOpacity={0.7}
            >
              <Text
                variant="label"
                size="medium"
                weight="semibold"
                style={{
                  color:
                    theme.mode === "dark"
                      ? SCREEN_COLORS.DARK.text
                      : theme.colors.text,
                }}
              >
                Log in
              </Text>
            </TouchableOpacity>
            {onContinueAsGuest && (
              <TouchableOpacity
                onPress={onContinueAsGuest}
                style={styles.guestLink}
                activeOpacity={0.7}
                hitSlop={HIT_SLOP.CLOSE}
              >
                <Text
                  variant="body"
                  size="medium"
                  weight="medium"
                  style={{
                    color: isDark
                      ? theme.colors.textPrimary
                      : SCREEN_COLORS.LIGHT.text,
                  }}
                >
                  Continue as guest
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.container,
          { width, height: SCREEN_HEIGHT, backgroundColor: "transparent" },
        ]}
      >
        {renderPageBackground()}
        {showStatsOverlay && renderStatsHeader()}
        {/* Content: image first, then title+sub below; no scroll when titleBelowImageNoScroll */}
        <ContentWrapper {...contentWrapperProps}>
          <ContentTopWrapper {...contentTopProps}>
            {!showStatsOverlay && renderStatsHeader()}

            {/* Illustration: page 4 (index 3) = bigger image for both dark and light */}
            {!hasBackgroundImage && (
              <View
                style={[
                  styles.illustrationSection,
                  { height: illustrationHeight },
                  pageIndex === 1 && styles.illustrationSectionPage2MoveUp,
                  pageIndex === 3 && styles.illustrationSectionPage3,
                  showAuthButtons && { marginBottom: 40 },
                ]}
              >
                {data.illustrationSvg ? (
                  // SVG Illustration (e.g., auth_identify in light mode)
                  <View
                    style={[
                      styles.svgContainer,
                      { height: illustrationHeight, width: contentMaxWidth },
                    ]}
                  >
                    <data.illustrationSvg
                      width="100%"
                      height="100%"
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </View>
                ) : data.illustrationImage ? (
                  // Image Illustration for onboarding pages; page 4 (index 3) = main image + avatar_set on right
                  pageIndex === 3 ? (
                    <View
                      style={[
                        styles.illustrationRowPage4,
                        { height: illustrationHeight, maxWidth: contentMaxWidth },
                      ]}
                    >
                      <View
                        style={[
                          styles.imageContainerPage4Main,
                          { height: illustrationHeight, width: contentMaxWidth },
                        ]}
                      >
                        <AppImage
                          source={data.illustrationImage}
                          style={styles.illustrationImage}
                          resizeMode="contain"
                          fadeDuration={0}
                          defaultSource={Images.homeFindShrooms}
                        />
                      </View>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.imageContainer,
                        { height: illustrationHeight, width: contentMaxWidth },
                      ]}
                    >
                      <AppImage
                        source={data.illustrationImage}
                        style={styles.illustrationImage}
                        resizeMode="contain"
                        fadeDuration={0}
                        defaultSource={Images.homeFindShrooms}
                      />
                    </View>
                  )
                ) : data.chatInterface ? (
                  // Chat Interface for "Use our AI chat" page
                  <ChatInterface />
                ) : data.mineralCards && data.mineralCards.length > 0 ? (
                  <>
                    {/* Mineral Cards Illustration - Use SVG in light mode, dark PNG in dark mode */}
                    {/* Note: SVG/Image names kept as PlantCards* for asset compatibility */}
                    {theme.mode === "dark" ? (
                      <View
                        style={[
                          styles.imageContainer,
                          { height: illustrationHeight, width: contentMaxWidth },
                        ]}
                      >
                        <AppImage
                          source={
                            Images.homeFindShroomsDark || Images.homeFindShrooms
                          }
                          style={styles.illustrationImage}
                          resizeMode="contain"
                          fadeDuration={0}
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.imageContainer,
                          { height: illustrationHeight, width: contentMaxWidth },
                        ]}
                      >
                        <AppImage
                          source={
                            Images.mineralCardsLight ||
                            Images.mineralCardsDark ||
                            Images.homeFindShrooms
                          }
                          style={styles.illustrationImage}
                          resizeMode="contain"
                          fadeDuration={0}
                        />
                      </View>
                    )}
                  </>
                ) : data.stats ? (
                  // Species Illustration - Use SVG in light mode, dark PNG in dark mode
                  theme.mode === "dark" ? (
                    <View
                      style={[
                        styles.imageContainer,
                        { height: illustrationHeight, width: contentMaxWidth },
                      ]}
                    >
                      <AppImage
                        source={Images.mineralsDark || Images.speciesDark}
                        style={styles.illustrationImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.imageContainer,
                        { height: illustrationHeight, width: contentMaxWidth },
                      ]}
                    >
                      <AppImage
                        source={
                          Images.mineralsLight ||
                          Images.mineralsDark ||
                          Images.speciesDark
                        }
                        style={styles.illustrationImage}
                        resizeMode="contain"
                      />
                    </View>
                  )
                ) : data.illustration === "authProgress" ? (
                  // Auth Progress Image for "Keep track of your progress" page
                  <View
                    style={[
                      styles.imageContainer,
                      {
                        height: illustrationHeight,
                        maxHeight: 600,
                        width: contentMaxWidth,
                      },
                    ]}
                  >
                    <AppImage
                      source={Images.diagnoseAi}
                      style={[styles.illustrationImage, { maxHeight: 580 }]}
                      resizeMode="contain"
                      fadeDuration={0}
                    />
                  </View>
                ) : data.illustration === "plantDiagnose" ? (
                  // Identify illustration (PNG used to avoid large SVG; same as auth_identity)
                  <View
                    style={[
                      styles.imageContainer,
                      { height: illustrationHeight, width: contentMaxWidth },
                    ]}
                  >
                    <AppImage
                      source={Images.diagnoseAi}
                      style={styles.illustrationImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : data.illustration === "plantScan" ? (
                  // Scan SVG Illustration for onboarding page
                  <View
                    style={[
                      styles.svgContainer,
                      { height: illustrationHeight, width: contentMaxWidth },
                    ]}
                  >
                    <AppImage
                      source={Images.diagnoseAi}
                      style={styles.illustrationImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : data.illustration ? (
                  typeof data.illustration === "string" ? null : (
                    data.illustration
                  )
                ) : (
                  <View style={[styles.illustrationPlaceholder]}>
                    <Text variant="body" size="medium" color="textTertiary">
                      Illustration
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ContentTopWrapper>

          {/* Title + subtitle */}
          {data.illustration !== "authProgress" && renderOnboardingText()}
        </ContentWrapper>
      </View>
    );
  }
);

OnboardingPage.displayName = "OnboardingPage";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  onboardingTextShiftUp: {
    transform: [{ translateY: -ONBOARDING_TEXT_SHIFT_UP }],
  },
  /** Auth page: 3-section column so CTA stays at bottom without overlap */
  containerAuth: {
    backgroundColor: "transparent",
  },
  authTextSection: {
    width: "100%",
    paddingHorizontal: 20,
    alignItems: "center",
    zIndex: 1,
  },
  /** Auth page title/subtitle — no extra horizontal padding (parent already insets 20px) */
  textSectionAuth: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: 8,
  },
  authImageSection: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  authImageWrapper: {
    width: "100%",
    aspectRatio: 1.35,
    maxHeight: 320,
  },
  authIllustrationImage: {
    width: "100%",
    height: "100%",
  },
  authSpacer: {
    flex: 1,
    minHeight: 0,
  },
  authCtaSection: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  contentNoScroll: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  /** Fixed title+sub header so they don't move on scroll; fixed size */
  fixedTextHeader: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 12,
    minHeight: 100,
  },
  /** Auth page: scroll content fills height so spacer pushes buttons to bottom; overflow scrolls */
  authPageScrollContent: {
    flexGrow: 1,
  },
  contentTop: {
    flex: 1,
    minHeight: 0,
  },
  /** Auth page: column fills scroll content so spacer keeps buttons in view */
  contentTopAuth: {
    flex: 1,
    minHeight: 0,
  },
  /** Legacy; kept for non-auth non-left pages if any */
  contentTopNoFlex: {
    minHeight: 0,
  },
  contentTopScroll: {
    flexGrow: 1,
  },
  illustrationSection: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 24,
  },
  /** Second onboarding page: slight nudge so image doesn’t overlap text */
  illustrationSectionPage2MoveUp: {
    marginTop: 0,
  },
  /** Page 4 (index 3): move illustration up 40px and allow bigger height */
  illustrationSectionPage3: {
    marginTop: -8,
  },
  /** Page 4: first image centered; second image (avatar_set) on the right with fixed width/height */
  illustrationRowPage4: {
    marginTop: -60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 20,
    gap: 0,
  },
  imageContainerPage4Main: {
    justifyContent: "center",
    alignItems: "center",
  },
  svgContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  mineralCardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: spacing[4],
    paddingHorizontal: 20,
  },
  mineralCard: {
    width: 160,
    minHeight: 200,
  },
  mineralCardOffset: {
    marginTop: 40,
  },
  mineralImagePlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  mineralImageText: {
    fontSize: 32,
  },
  mineralCardContent: {
    gap: 4,
  },
  scientificName: {
    fontStyle: "italic",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 8,
  },
  tag: {
    marginRight: 4,
  },
  statsHeader: {
    alignItems: "center",
    width: "100%",
    gap: 19,
  },
  statsHeaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: 20,
  },
  statsSection: {
    alignItems: "flex-start",
    marginBottom: 0,
  },
  statsSectionCenter: {
    alignItems: "center",
  },
  statsLabel: {
    marginBottom: 4,
  },
  statsLabelOnLight: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FONTS.regular,
    color: "#888888",
    textAlign: "center",
  },
  statsValueOnLight: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.bold,
    color: "#111111",
  },
  statsValueSuffix: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONTS.bold,
    color: "#111111",
    opacity: 0.4,
  },
  statsValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  statsSubtitle: {
    opacity: 0.6,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 0,
    width: "100%",
  },
  chipOnboarding: {
    minHeight: 22,
    height: 22,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  tabsContainerCenter: {
    justifyContent: "center",
  },
  tab: {
    marginRight: 4,
  },
  chipBase: {
    height: 32,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
  },
  textSectionCenter: {
    alignItems: "center",
    alignSelf: "center",
  },
  textSectionLeft: {
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  textSectionFirstPage: {
    marginBottom: 12,
  },
  /** Consistent horizontal inset — content already has 20px padding */
  textSectionOnboardingInset: {
    paddingHorizontal: 0,
  },
  textSection: {
    alignItems: "flex-start",
    paddingHorizontal: 20,
    gap: 8,
  },
  title: {
    textAlign: "left",
    marginBottom: 0,
  },
  titleLeftAlign: {
    textAlign: "left",
    alignSelf: "flex-start",
  },
  descriptionLeftAlign: {
    textAlign: "left",
    alignSelf: "flex-start",
  },
  /** Light mode onboarding spec: Title/24px/Semibold — 24px, 700, 32px line-height, Satoshi */
  titleOnboarding: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    lineHeight: 32,
  },
  description: {
    textAlign: "left",
    marginBottom: 0,
  },
  /** Light mode onboarding spec: Body/14px/Regular — 14px, 400, 20px line-height, Satoshi */
  descriptionOnboarding: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  /** Last onboarding screen: Title/28px/Bold, center — omit lineHeight so Text applies safe spacing */
  titleAuthProgress: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: "700",
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
  },
  /** Last onboarding screen: Body/14px/Regular, center, secondary #5D5D5D */
  descriptionAuthProgress: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontWeight: "400",
    lineHeight: 20,
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
    color: SCREEN_COLORS.LIGHT.textSecondary,
  },
  /** Stats (number of species) and label in light + dark: white text */
  statsTextLight: {
    color: APP_COLORS.modalTextOnPrimary,
  },
  authButtonCta: {
    height: 44,
    paddingVertical: 10,
    paddingHorizontal: spacing[4],
    borderRadius: 23.789,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 335,
    alignSelf: "center",
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 12,
  },
  orLine: {
    width: 40,
    height: 1,
  },
  orText: {
    marginHorizontal: 4,
  },
  signUpButton: {
    marginBottom: 4,
    paddingVertical: spacing[4],
    paddingHorizontal: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logInButton: {
    marginBottom: 4,
    paddingVertical: spacing[4],
    paddingHorizontal: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  guestLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  guestButton: {
    marginTop: 4,
    paddingVertical: spacing[4],
    paddingHorizontal: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});
