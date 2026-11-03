/**
 * Individual Onboarding Page Component
 */

import { AppImage } from "@/components/AppImage";
import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import {
  CARD_COLORS,
  SCREEN_COLORS,
  SUBSCRIPTION_COLORS,
} from "../../../constants/colorConstants";
import { Text, Chip } from "../../../atoms";
import { OnboardingPageData } from "../screens/OnboardingScreenPhone";
import { Images } from "../../../assets";
import { ChatInterface } from "./ChatInterface";

import { FONTS } from "../../../common/typography";

import { Radius } from "../../../design";

import { spacing } from "../../../design-system/spacing";

import { APP_COLORS } from "../../../config/colors";
import {
  ONBOARDING_CTA_DARK,
  ONBOARDING_CTA_HEIGHT,
  getOnboardingCtaBottomPadding,
} from "../onboardingCta.constants";
import { PaginationDots } from "./PaginationDots";

const { height: SCREEN_HEIGHT } = Dimensions.get("screen");

/** Onboarding background art is 1500×3252 — anchor to bottom so mushrooms align with design */
const ONBOARDING_BG_ASPECT = 3252 / 1500;
/** Figma frame: background art is 375×813pt */
const ONBOARDING_BG_DESIGN_WIDTH = 375;
const ONBOARDING_BG_DESIGN_HEIGHT = ONBOARDING_BG_DESIGN_WIDTH * ONBOARDING_BG_ASPECT;
/** Figma: title starts at y=516 (~20pt below the illustration), in background coordinates */
const ONBOARDING_DESIGN_TITLE_TOP = 516;
/** Default copy block height (2-line title + 2-line subtitle + dots) before first layout */
const ONBOARDING_TEXT_DEFAULT_HEIGHT = 144;
/** Never let the copy block get closer than this to the Next button */
const ONBOARDING_TEXT_MIN_CTA_GAP = 24;
/** Auth slide ("Keep track of your bird journey") — title/subtitle inset below safe area */
/** Figma: title at y=106, 124pt copy block (72 title + 12 gap + 40 subtitle) → ends at y=230 */
const AUTH_PROGRESS_DESIGN_SUBTITLE_BOTTOM = 230;
const AUTH_PROGRESS_DEFAULT_HEADER_HEIGHT = 124;
const AUTH_PROGRESS_TITLE_MIN_TOP_GAP = 16;
const AUTH_PROGRESS_SUBTITLE_WIDTH_RATIO = 318.517 / 335;
/** Split auth layout (light): Figma 8230:64231 top art 375×293 */
const AUTH_TOP_ART_ASPECT = 1125 / 879;
/** Figma 8251:5879 bird circle 335×346 */
const AUTH_BIRDS_ASPECT = 335 / 346;
/** Figma: title at y=106 = 44pt status bar + 62 */
const AUTH_SPLIT_TITLE_TOP_BELOW_STATUS_BAR = 62;
/** Figma light-mode secondary buttons (Log in / Continue as guest) */
const AUTH_CTA_LIGHT = {
  secondaryBg: "#FFFFFF",
  secondaryText: "#111111",
} as const;

export interface OnboardingPaginationProps {
  totalPages: number;
  scrollX: Animated.Value;
  pageWidth: number;
}

export interface OnboardingPageProps {
  data: OnboardingPageData;
  width: number;
  pageIndex?: number;
  pagination?: OnboardingPaginationProps;
  onSignUp?: () => void;
  onLogIn?: () => void;
  onContinueAsGuest?: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = React.memo(
  ({
    data,
    width,
    pageIndex = 0,
    pagination,
    onSignUp,
    onLogIn,
    onContinueAsGuest,
  }) => {
    const theme = useTheme();
    const isDark = useIsDark();
    const insets = useSafeAreaInsets();
    const [textHeight, setTextHeight] = React.useState(
      ONBOARDING_TEXT_DEFAULT_HEIGHT
    );
    const [authHeaderHeight, setAuthHeaderHeight] = React.useState(
      AUTH_PROGRESS_DEFAULT_HEADER_HEIGHT
    );
    const layoutWidth = width;
    const layoutLeft = 0;
    const bgHeight = Math.max(SCREEN_HEIGHT, layoutWidth * ONBOARDING_BG_ASPECT);
    /** How much the 375×813 design background is scaled on this screen */
    const bgScale = bgHeight / ONBOARDING_BG_DESIGN_HEIGHT;
    const contentMaxWidth = width - 40;
    const showAuthButtons = data.illustration === "authProgress";
    const hasBackgroundImage = !!data.backgroundImage;
    /** Dark page 2 art includes stats/tabs — hide duplicate overlay at top */
    const hideTopStatsInDark = isDark && pageIndex === 1;
    const onboardingTextMaxWidth = contentMaxWidth;
    /** Auth header uses a single 20px inset (authTextSection); avoid double-padding textSection */
    const authProgressTextMaxWidth = contentMaxWidth;
    /** Figma: subtitle is 318.5pt inside the 335pt title column */
    const authProgressSubtextMaxWidth =
      authProgressTextMaxWidth * AUTH_PROGRESS_SUBTITLE_WIDTH_RATIO;
    /**
     * Auth slide: keep the subtitle's bottom edge where Figma has it relative to
     * the scaled, bottom-anchored background art (y=230 on 375×812, 20pt above
     * the birds), so the gap scales with the art. Never closer than 16pt to the
     * status bar.
     */
    const authHeaderTopPadding = Math.max(
      insets.top + AUTH_PROGRESS_TITLE_MIN_TOP_GAP,
      SCREEN_HEIGHT -
        (ONBOARDING_BG_DESIGN_HEIGHT - AUTH_PROGRESS_DESIGN_SUBTITLE_BOTTOM) *
          bgScale -
        authHeaderHeight
    );
    const showStatsHeader =
      !hideTopStatsInDark &&
      (!!data.stats || (data.tabs != null && data.tabs.length > 0));
    const showStatsOverlay = hasBackgroundImage && showStatsHeader;

    const pageBackgroundStyle = {
      position: "absolute" as const,
      left: layoutLeft,
      bottom: 0,
      width: layoutWidth,
      height: bgHeight,
      zIndex: 0,
    };

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
    /** Space reserved at the bottom for the Next button (rendered by the screen) */
    const contentPaddingBottom =
      getOnboardingCtaBottomPadding(insets.bottom) +
      ONBOARDING_CTA_HEIGHT +
      ONBOARDING_TEXT_MIN_CTA_GAP;
    /**
     * Responsive copy position: the background is bottom-anchored and scaled by
     * bgHeight / design height, so map the Figma title y into the same space.
     * The image→title gap then scales with the art on every screen size;
     * clamp so the copy never runs into the Next button on short screens.
     */
    const anchoredTextTop =
      SCREEN_HEIGHT -
      (ONBOARDING_BG_DESIGN_HEIGHT - ONBOARDING_DESIGN_TITLE_TOP) * bgScale;
    const maxTextTop = SCREEN_HEIGHT - contentPaddingBottom - textHeight;
    const textTop = Math.min(anchoredTextTop, maxTextTop);
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
          styles.textSectionOnboardingInset,
          styles.onboardingCopyStack,
          { width: onboardingTextMaxWidth },
        ]}
      >
        <Text
          variant="title"
          size="medium"
          weight="bold"
          allowFontScaling={false}
          style={[
            styles.title,
            styles.titleOnboarding,
            styles.titleLeftAlign,
            styles.onboardingCopyLine,
            !isDark && { color: "#091B21" },
          ]}
        >
          {data.title}
        </Text>
        <Text
          variant="body"
          size="medium"
          color="textSecondary"
          allowFontScaling={false}
          style={[
            styles.description,
            styles.descriptionOnboarding,
            styles.descriptionLeftAlign,
            styles.onboardingCopyLine,
            !isDark && { color: "#5D5D5D" },
          ]}
        >
          {data.description}
        </Text>
        {pagination != null && (
          <PaginationDots
            totalPages={pagination.totalPages}
            scrollX={pagination.scrollX}
            pageWidth={pagination.pageWidth}
            containerStyle={styles.paginationDotsBelowText}
          />
        )}
      </View>
    );

    // Auth page: 3-section layout — text top, image below, CTA at bottom (no absolute positioning)
    if (showAuthButtons) {
      /** Figma: guest button ends 40pt above the screen bottom (home indicator area + 8) */
      const ctaPaddingBottom = getOnboardingCtaBottomPadding(insets.bottom);
      const authImageSource = data.illustrationImage ?? Images.diagnoseAi;
      /**
       * Light mode uses the split Figma layers so the bird circle can shrink to
       * fit the space between the copy and the buttons on any screen height.
       * Dark mode has no split assets yet — it keeps the full-screen background.
       */
      const useSplitAuthLayout = !isDark;
      const authBirdsMaxWidth = contentMaxWidth;
      return (
        <View
          style={[
            styles.container,
            styles.containerAuth,
            useSplitAuthLayout && styles.containerAuthSplit,
            { width },
          ]}
          collapsable={false}
        >
          {useSplitAuthLayout ? (
            <AppImage
              source={Images.onboardingAuthTop}
              style={[
                styles.authTopArt,
                { width, height: width / AUTH_TOP_ART_ASPECT },
              ]}
              resizeMode="cover"
              preferRNImage
              fadeDuration={0}
            />
          ) : (
            hasBackgroundImage && (
              <AppImage
                source={data.backgroundImage!}
                style={pageBackgroundStyle}
                resizeMode="cover"
                preferRNImage
                fadeDuration={0}
              />
            )
          )}
          <View
            style={[
              styles.authTextSection,
              {
                paddingTop: useSplitAuthLayout
                  ? insets.top + AUTH_SPLIT_TITLE_TOP_BELOW_STATUS_BAR
                  : authHeaderTopPadding,
              },
            ]}
          >
            <View
              style={[styles.textSectionAuth, styles.textSectionCenter]}
              onLayout={(e) => {
                const h = Math.round(e.nativeEvent.layout.height);
                if (h > 0 && h !== authHeaderHeight) setAuthHeaderHeight(h);
              }}
            >
              <Text
                variant="title"
                size="large"
                weight="bold"
                allowFontScaling={false}
                style={[
                  styles.titleAuthProgress,
                  {
                    maxWidth: authProgressTextMaxWidth,
                    color: isDark ? theme.colors.text : "#091B21",
                  },
                ]}
              >
                {data.title}
              </Text>
              <Text
                variant="body"
                size="medium"
                allowFontScaling={false}
                style={[
                  styles.descriptionAuthProgress,
                  {
                    maxWidth: authProgressSubtextMaxWidth,
                    color: isDark ? theme.colors.textSecondary : "#5D5D5D",
                  },
                ]}
              >
                {data.description}
              </Text>
            </View>
          </View>
          {/* 2. Bird circle — fills the space left between copy and buttons, keeps aspect */}
          {useSplitAuthLayout && (
            <View style={styles.authBirdsSection}>
              <AppImage
                source={Images.onboardingAuthBirds}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: authBirdsMaxWidth,
                  maxHeight: authBirdsMaxWidth / AUTH_BIRDS_ASPECT,
                }}
                resizeMode="contain"
                preferRNImage
                fadeDuration={0}
              />
            </View>
          )}
          {/* Image section - below text (only when there is no background art) */}
          {!useSplitAuthLayout && !hasBackgroundImage && (
            <View style={styles.authImageSection}>
              <View style={styles.authImageWrapper}>
                <AppImage
                  source={authImageSource}
                  style={styles.authIllustrationImage}
                  resizeMode="contain"
                  fadeDuration={0}
                  defaultSource={Images.homeFindSpecies}
                />
              </View>
            </View>
          )}
          {/* 3. Spacer - flex 1 pushes CTA to bottom (split layout: bird section flexes instead) */}
          {!useSplitAuthLayout && <View style={styles.authSpacer} />}
          {/* 4. CTA section - bottom, safe area */}
          <View
            style={[
              styles.authCtaSection,
              useSplitAuthLayout && styles.authCtaSectionSplit,
              {
                paddingBottom: ctaPaddingBottom,
              },
            ]}
          >
            {/* Figma: Sign up — brand fill, no border, 44pt, Button/16px Medium white */}
            <TouchableOpacity
              onPress={onSignUp}
              style={[
                styles.authButtonCta,
                { backgroundColor: theme.colors.primaryCTA },
                isDark && {
                  borderRadius: ONBOARDING_CTA_DARK.borderRadius,
                  borderWidth: 1,
                  borderColor: theme.colors.border0,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                variant="label"
                size="medium"
                allowFontScaling={false}
                style={[
                  styles.authButtonLabel,
                  { color: theme.colors.onPrimary },
                ]}
              >
                Sign up
              </Text>
            </TouchableOpacity>
            {/* Figma: Log in — white fill, 1px #E7E7E7 border, radius 24, #111 text */}
            <TouchableOpacity
              onPress={onLogIn}
              style={[
                styles.authButtonCta,
                styles.authButtonOutline,
                isDark
                  ? {
                      backgroundColor: theme.colors.surfacePrimary,
                      borderColor: theme.colors.border0,
                    }
                  : {
                      backgroundColor: AUTH_CTA_LIGHT.secondaryBg,
                      borderColor: SUBSCRIPTION_COLORS.SECONDARY_CTA_BORDER_LIGHT,
                    },
              ]}
              activeOpacity={0.7}
            >
              <Text
                variant="label"
                size="medium"
                allowFontScaling={false}
                style={[
                  styles.authButtonLabel,
                  {
                    color: isDark
                      ? SCREEN_COLORS.DARK.text
                      : AUTH_CTA_LIGHT.secondaryText,
                  },
                ]}
              >
                Log in
              </Text>
            </TouchableOpacity>
            {/* Figma: Continue as guest — text button, 44pt tall, #111 */}
            {onContinueAsGuest && (
              <TouchableOpacity
                onPress={onContinueAsGuest}
                style={styles.authButtonCta}
                activeOpacity={0.7}
              >
                <Text
                  variant="label"
                  size="medium"
                  allowFontScaling={false}
                  style={[
                    styles.authButtonLabel,
                    {
                      color: isDark
                        ? theme.colors.textPrimary
                        : AUTH_CTA_LIGHT.secondaryText,
                    },
                  ]}
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
                          defaultSource={Images.homeFindSpecies}
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
                        defaultSource={Images.homeFindSpecies}
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
                            Images.homeFindSpeciesDark || Images.homeFindSpecies
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
                            Images.homeFindSpecies
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

        </ContentWrapper>

        {/* Title + subtitle + dots — positioned relative to the scaled background art */}
        <View
          style={[styles.onboardingTextAnchor, { top: textTop }]}
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 0 && h !== textHeight) setTextHeight(h);
          }}
        >
          {renderOnboardingText()}
        </View>
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
  onboardingTextAnchor: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  /** Auth page: 3-section column so CTA stays at bottom without overlap */
  containerAuth: {
    backgroundColor: "transparent",
  },
  containerAuthSplit: {
    backgroundColor: "#FFFFFF",
  },
  authTopArt: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  /** Figma: 20pt below subtitle, 28pt above Sign up; flexes to the space left */
  authBirdsSection: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 28,
  },
  authCtaSectionSplit: {
    paddingTop: 0,
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
    /** Figma: 12px between title and subtitle */
    gap: 12,
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
    /** Figma: 8pt between Sign up / Log in / Continue as guest */
    gap: 8,
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
  /** Figma content stack: 335px column, centered children, 16px gap */
  onboardingCopyStack: {
    alignSelf: "center",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 0,
  },
  onboardingCopyLine: {
    alignSelf: "stretch",
    width: "100%",
  },
  paginationDotsBelowText: {
    marginTop: 0,
    alignSelf: "center",
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
  /** Light mode onboarding spec: Title/24px/Semibold — 24px, 700, 32px line-height, Satoshi, #091B21 */
  titleOnboarding: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontStyle: "normal",
    fontWeight: "700",
    lineHeight: 32,
    includeFontPadding: false,
  },
  description: {
    textAlign: "left",
    marginBottom: 0,
  },
  /** Light mode onboarding spec: Body/14px/Regular — 14px, 400, 20px line-height, Satoshi, #5D5D5D */
  descriptionOnboarding: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: 20,
    includeFontPadding: false,
  },
  /** Last onboarding screen: Figma Title/28px/Bold — 28px, 700, 36px line-height, center */
  titleAuthProgress: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontStyle: "normal",
    fontWeight: "700",
    lineHeight: 36,
    includeFontPadding: false,
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
  },
  /** Last onboarding screen: Figma Body/14px/Regular — 14px, 400, 20px line-height, center, ligatures off */
  descriptionAuthProgress: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: 20,
    includeFontPadding: false,
    /** 'liga' off, 'clig' off */
    fontVariant: ["no-common-ligatures"],
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
    color: SCREEN_COLORS.LIGHT.textSecondary,
  },
  /** Stats (number of species) and label in light + dark: white text */
  statsTextLight: {
    color: APP_COLORS.modalTextOnPrimary,
  },
  /** Figma Button/16px: Satoshi Medium 16px, 24px line-height */
  authButtonLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    fontStyle: "normal",
    fontWeight: "500",
    lineHeight: 24,
    includeFontPadding: false,
    textAlign: "center",
  },
  authButtonOutline: {
    borderWidth: 1,
    borderRadius: 24,
  },
  authButtonCta: {
    height: 44,
    paddingVertical: 10,
    paddingHorizontal: spacing[4],
    borderRadius: 23.789,
    alignItems: "center",
    justifyContent: "center",
    /** Full width inside the 20pt section inset (335pt on a 375pt screen) */
    width: "100%",
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
