/**
 * Phone onboarding — unchanged layout; tablet uses {@link OnboardingScreenTablet}.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { View, StyleSheet, FlatList, Animated, Dimensions, ImageSourcePropType, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity, Text, StatusBar, useWindowDimensions } from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  CommonActions,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../../../navigation/types";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { SCREEN_COLORS } from "../../../constants/colorConstants";
import { HIT_SLOP } from "../../../constants/uiConstants";
import { Button } from "../../../atoms";
import {
  ONBOARDING_CTA_DARK,
  ONBOARDING_CTA_LIGHT_RADIUS,
} from "../onboardingCta.constants";
import { ScreenContainer } from "../../../molecules/ScreenContainer/ScreenContainer";
import { OnboardingPage } from "../components/OnboardingPage";
import { PaginationDots } from "../components/PaginationDots";
import { useOnboardingStore } from "../onboarding.store";
import { resetToPostAuthOnboarding } from "../../post-auth-onboarding";
import { useFeatureConfig } from "../../../config/context";
import { Images } from "../../../assets";
import { useAuthStore } from "../../auth/auth.store";
import { useToast } from "../../../hooks";
import { getRemoteConfigValue } from "../../../services/remoteConfig/remoteConfig.service";
import { COMMON_STRINGS } from "../../../config/strings/common.strings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY } from "../../../components/AppLogsTooltip/AppLogsTooltip";

import { FONTS } from "../../../common/typography";

import { spacing } from "../../../design-system/spacing";

const { height: SCREEN_HEIGHT } = Dimensions.get("screen");

const AnimatedOnboardingList = Animated.createAnimatedComponent(
  FlatList<OnboardingPageData>
);

const ONBOARDING_CTA = {
  minHeight: 48,
  paddingVertical: 12,
  paddingHorizontal: spacing[4],
  borderRadius: ONBOARDING_CTA_LIGHT_RADIUS,
};
/* Min height 40 so 20px line-height skip text is not clipped */
const ONBOARDING_SKIP = {
  minHeight: 40,
  paddingVertical: 10,
  paddingHorizontal: 12,
};
const _HORIZONTAL_PADDING = 12;

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

const ONBOARDING_BACKGROUNDS_LIGHT: ImageSourcePropType[] = [
  Images.onboardingBg1,
  Images.onboardingBg2,
  Images.onboardingBg3,
  Images.onboardingBg4,
  Images.onboardingBg5,
];

const ONBOARDING_BACKGROUNDS_DARK: ImageSourcePropType[] = [
  Images.onboardingBg1Dark,
  Images.onboardingBg2Dark,
  Images.onboardingBg3Dark,
  Images.onboardingBg4Dark,
  Images.onboardingBg5Dark,
];

export interface OnboardingPageData {
  id: string;
  title: string;
  description: string;
  backgroundImage?: ImageSourcePropType;
  illustration?: React.ReactNode | string;
  illustrationImage?: ImageSourcePropType;
  illustrationSvg?: React.ComponentType<any>; // For SVG components
  mineralCards?: Array<{
    id: string;
    name: string;
    scientificName: string;
    image?: string;
    tags: string[];
  }>;
  stats?: {
    label: string;
    value: string;
    subtitle?: string;
  };
  tabs?: string[];
  chatInterface?: boolean;
}

export const OnboardingScreenPhone: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const route = useRoute<any>();
  const theme = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { setHasCompletedOnboarding } =
    useOnboardingStore();
  const onboardingConfig = useFeatureConfig("onboarding");

  const { width: windowWidth } = useWindowDimensions();
  const pageWidth = windowWidth;

  // Convert config pages to OnboardingPageData format - Only 5 pages
  const getImageForPage = React.useCallback(
    (
      imageKey: string,
      isDark: boolean
    ): { image?: ImageSourcePropType; svg?: React.ComponentType<any> } => {
      switch (imageKey) {
        case "auth_scans":
          return { image: Images.diagnoseAi };
        case "auth_identity":
          return isDark
            ? { image: Images.homeFindShroomsDark }
            : { image: Images.homeFindShrooms };
        case "auth_cards":
          return {
            image: isDark ? Images.homeMushroomOfDayDark : Images.homeMushroomOfDay,
          };
        case "auth_mins":
          return {
            image: isDark ? Images.homeFindShroomsDark : Images.homeFindShrooms,
          };
        default:
          return { image: Images.homeFindShrooms };
      }
    },
    []
  );

  const ONBOARDING_PAGES: OnboardingPageData[] = React.useMemo(() => {
    return onboardingConfig.pages.map((page: any, index) => {
      // Handle both imageKey (from config) and direct image property
      const imageData = (page as any).imageKey
        ? getImageForPage((page as any).imageKey, isDark)
        : page.image
        ? { image: page.image }
        : {};
      const isLastPage = index === onboardingConfig.pages.length - 1; // 5th page (index 4)
      return {
        id: `${index + 1}`,
        title: page.title,
        description: page.subtitle,
        backgroundImage: (isDark
          ? ONBOARDING_BACKGROUNDS_DARK
          : ONBOARDING_BACKGROUNDS_LIGHT)[index],
        illustrationImage: imageData.image || page.image,
        illustrationSvg: (imageData as { svg?: React.ComponentType<any> }).svg,
        illustration: isLastPage ? "authProgress" : undefined, // Mark last page for auth buttons
        stats: page.stats,
        tabs: page.tabs,
      };
    });
  }, [onboardingConfig.pages, isDark, getImageForPage]);
  const flatListRef = useRef<FlatList<OnboardingPageData>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentPage, setCurrentPage] = useState(0);

  // Initial page from route params (e.g. from SignUp X "go to last page of onboarding")
  const totalPages = ONBOARDING_PAGES.length;
  const getStartedPageIndex = totalPages - 2;
  const paginatedPageCount = totalPages - 1;
  const initialPageParam = route.params?.initialPage as number | undefined;

  const applyInitialPage = useCallback(() => {
    const targetPage =
      typeof initialPageParam === "number"
        ? initialPageParam === -1
          ? totalPages - 1
          : initialPageParam >= 0 && initialPageParam < totalPages
          ? initialPageParam
          : 0
        : 0;
    setCurrentPage(targetPage);
    scrollX.setValue(targetPage * pageWidth);
    if (targetPage > 0 && flatListRef.current) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToOffset({
          offset: targetPage * pageWidth,
          animated: false,
        });
      });
    }
  }, [initialPageParam, totalPages, scrollX, pageWidth]);

  // On mount: apply initial page (e.g. last page when coming from SignUp X)
  useEffect(() => {
    applyInitialPage();
  }, [applyInitialPage]);

  // When screen gains focus (e.g. back from SignUp), re-apply initial page so last page shows.
  // Defer to next frame so navigation transition isn't blocked by setState + scrollToOffset.
  useFocusEffect(
    useCallback(() => {
      if (typeof initialPageParam !== "number") return;
      if (__DEV__) (console as any).time("OnboardingScreen.focusEffect");
      requestAnimationFrame(() => {
        applyInitialPage();
        if (__DEV__) (console as any).timeEnd("OnboardingScreen.focusEffect");
      });
    }, [initialPageParam, applyInitialPage])
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pageIndex = Math.round(
        event.nativeEvent.contentOffset.x / pageWidth
      );
      if (pageIndex >= 0 && pageIndex < totalPages) {
        setCurrentPage(pageIndex);
      }
    },
    [totalPages, pageWidth]
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleFinish = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "AuthStack" }],
      })
    );
    setHasCompletedOnboarding(true);
  }, [navigation, setHasCompletedOnboarding]);

  const handleNext = () => {
    if (currentPage < ONBOARDING_PAGES.length - 1) {
      const nextIndex = currentPage + 1;
      setCurrentPage(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = useCallback(() => {
    // Go to last onboarding page (Sign up / Log in / Continue as guest)
    const lastIndex = ONBOARDING_PAGES.length - 1;
    setCurrentPage(lastIndex);
    flatListRef.current?.scrollToIndex({
      index: lastIndex,
      animated: true,
    });
  }, []);

  const handleSignUp = useCallback(() => {
    // Push AuthStack so X on SignUp can use goBack() for instant back (no full reset)
    navigation.dispatch(
      CommonActions.navigate({
        name: "AuthStack",
        params: {
          screen: "SignUp",
        },
      })
    );
    requestAnimationFrame(() => {
      setHasCompletedOnboarding(true);
    });
  }, [navigation, setHasCompletedOnboarding]);

  const handleLogIn = useCallback(() => {
    // Push AuthStack so X on Login can use goBack() for instant back (no full reset)
    navigation.dispatch(
      CommonActions.navigate({
        name: "AuthStack",
        params: {
          screen: "Login",
        },
      })
    );
    requestAnimationFrame(() => {
      setHasCompletedOnboarding(true);
    });
  }, [navigation, setHasCompletedOnboarding]);

  const handleContinueAsGuest = useCallback(async () => {
    try {
      // Call guest login API first (blocking) to ensure token is available
      const authStore = useAuthStore.getState();
      const rawTimeout = getRemoteConfigValue("guestLoginTimeoutMs");
      // Match API timeout (30s) so slow networks/emulator have time to complete
      const guestLoginTimeout = Math.max(Number(rawTimeout) || 30000, 30000);

      // Use Promise.race to timeout guest login if it takes too long
      const guestLoginPromise = authStore.guestLogin(
        authStore.guestId || undefined
      );
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("GUEST_LOGIN_TIMEOUT")),
          guestLoginTimeout
        )
      );

      await Promise.race([guestLoginPromise, timeoutPromise]);

      // Only update store and navigate if guest login succeeds
      setHasCompletedOnboarding(true);

      // Enable app logs tooltip after continue as guest (same as post sign-up)
      await AsyncStorage.setItem(TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY, "true");

      // Ensure token is in store (guestLogin sets it synchronously)
      const { token: savedToken } = useAuthStore.getState();
      if (!savedToken) {
        throw new Error("Token not saved after guest login");
      }

      const navigationDelay = Math.max(
        getRemoteConfigValue("guestLoginNavigationDelayMs") ?? 400,
        300
      );
      setTimeout(() => {
        resetToPostAuthOnboarding(navigation);
      }, navigationDelay);
    } catch (error) {
      // If guest login fails, do NOT navigate - show error to user
      const isTimeout =
        error instanceof Error && error.message === "GUEST_LOGIN_TIMEOUT";
      const errorMessage = isTimeout
        ? COMMON_STRINGS.messages.connectionTakingTooLong
        : error instanceof Error
        ? error.message
        : COMMON_STRINGS.messages.failedToContinueAsGuest;
      console.error("Guest login failed, not navigating:", error);

      // Show error toast to user
      showToast(errorMessage, "error", 5000);

      // Do not navigate - user stays on onboarding screen and can retry
    }
  }, [navigation, setHasCompletedOnboarding, showToast]);

  const renderPage = ({
    item,
    index,
  }: {
    item: OnboardingPageData;
    index: number;
  }) => (
    <View style={{ width: pageWidth, height: SCREEN_HEIGHT }}>
      <OnboardingPage
        data={item}
        width={pageWidth}
        pageIndex={index}
        onSignUp={handleSignUp}
        onLogIn={handleLogIn}
        onContinueAsGuest={handleContinueAsGuest}
      />
    </View>
  );

  return (
    <ScreenContainer
      showBackground={false}
      edges={[]}
      backgroundColor="transparent"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      {/* Top Navigation Bar - Fixed at top */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: "transparent", paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.topBarContent}>
          <View style={styles.spacer} />
          {/* Skip — top right; hidden on Get started and final auth pages */}
          {currentPage < getStartedPageIndex && (
            <TouchableOpacity
              onPress={handleSkip}
              style={[styles.skipButton, ONBOARDING_SKIP]}
              activeOpacity={0.8}
              hitSlop={HIT_SLOP.CLOSE}
            >
              <Text
                style={[
                  styles.skipText,
                  {
                    color: isDark ? SCREEN_COLORS.DARK.text : theme.colors.text,
                  },
                ]}
              >
                {onboardingConfig.skipText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Swipeable Pages - Takes full available space */}
      <View style={styles.swipeableContainer}>
        <AnimatedOnboardingList
          ref={flatListRef}
          data={ONBOARDING_PAGES}
          renderItem={renderPage}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          initialNumToRender={5}
          maxToRenderPerBatch={1}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          getItemLayout={(_, index) => ({
            length: pageWidth,
            offset: pageWidth * index,
            index,
          })}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          onScrollToIndexFailed={(info) => {
            // Fallback: scroll to offset if scrollToIndex fails
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
              flatListRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: true,
              });
            });
          }}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
        />
      </View>

      {/* Bottom Section - Fixed at bottom; padding 24 horizontal (12 each side) for button full width minus 24 */}
      <View
        style={[
          styles.bottomSection,
          {
            paddingBottom: Math.max(insets.bottom, 24) + 8,
            opacity:
              ONBOARDING_PAGES[currentPage]?.illustration === "authProgress"
                ? 0
                : 1,
            pointerEvents:
              ONBOARDING_PAGES[currentPage]?.illustration === "authProgress"
                ? "none"
                : "auto",
          },
        ]}
      >
        <PaginationDots
          totalPages={paginatedPageCount}
          scrollX={scrollX}
          pageWidth={pageWidth}
        />
        {currentPage < getStartedPageIndex + 1 && (
          <View style={styles.buttonContainer}>
            <Button
              title={
                currentPage === getStartedPageIndex
                  ? onboardingConfig.getStartedText
                  : onboardingConfig.continueText
              }
              variant="primary"
              size="large"
              fullWidth
              onPress={handleNext}
              style={[
                ONBOARDING_CTA,
                isDark
                  ? {
                      backgroundColor: theme.colors.primaryCTA,
                      borderRadius: ONBOARDING_CTA_DARK.borderRadius,
                    }
                  : { backgroundColor: theme.colors.primaryCTA },
              ]}
            />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing[4],
    paddingBottom: 12,
    zIndex: 10,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spacer: {
    flex: 1,
  },
  skipButton: {
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  /* Button/14px: Satoshi 14px, 500, line-height 20px, primary text #111 */
  skipText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  swipeableContainer: {
    flex: 1,
    width: "100%",
    height: SCREEN_HEIGHT,
  },
  flatList: {
    flex: 1,
    height: SCREEN_HEIGHT,
  },
  flatListContent: {
    alignItems: "stretch",
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 32,
    gap: 24,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  buttonContainer: {
    width: "100%",
  },
});
