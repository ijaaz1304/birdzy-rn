/**
 * iPad / Android tablet onboarding — separate from {@link OnboardingScreenPhone}.
 */

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  ImageSourcePropType,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ViewToken,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  CommonActions,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../../navigation/types";
import { Button, Text } from "../../../atoms";
import { ScreenContainer } from "../../../molecules/ScreenContainer/ScreenContainer";
import { OnboardingPageTablet } from "../components/OnboardingPageTablet";
import { PaginationDots } from "../components/PaginationDots";
import {
  TABLET_BOTTOM_SECTION_GAP,
  TABLET_ONBOARDING_AUX_TEXT,
  TABLET_PAGINATION_DOTS_TRANSLATE_Y,
  useOnboardingTabletLayout,
} from "../onboardingTabletLayout";
import { useOnboardingStore } from "../onboarding.store";
import { resetToPostAuthOnboarding } from "../../post-auth-onboarding";
import { useFeatureConfig } from "../../../config/context";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { useAuthStore } from "../../auth/auth.store";
import { useToast } from "../../../hooks";
import { getRemoteConfigValue } from "../../../services/remoteConfig/remoteConfig.service";
import { COMMON_STRINGS } from "../../../config/strings/common.strings";
import { TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY } from "../../../components/AppLogsTooltip/AppLogsTooltip";
import { Images } from "../../../assets";
import { FONTS } from "../../../common/typography";
import { HIT_SLOP } from "../../../constants/uiConstants";
import {
  ONBOARDING_CTA_DARK,
} from "../onboardingCta.constants";
import type { OnboardingPageData } from "./OnboardingScreenPhone";

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList<OnboardingPageData>
);

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

function normalizeRouteInitialPage(
  param: number | undefined,
  totalPages: number
): number {
  if (totalPages <= 0) return 0;
  if (param === -1) return totalPages - 1;
  if (typeof param === "number" && param >= 0 && param < totalPages) {
    return param;
  }
  return 0;
}

function getOnboardingBottomCtaTitle(
  currentPage: number,
  getStartedPageIndex: number,
  continueText: string,
  getStartedText: string
): string {
  if (currentPage === getStartedPageIndex) return getStartedText;
  return continueText;
}

export const OnboardingScreenTablet: React.FC = () => {
  const theme = useTheme();
  const isDark = useIsDark();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const {
    width: screenWidth,
    height: screenHeight,
    bottomChromeHeight: layoutBottomChromeHeight,
  } = useOnboardingTabletLayout();
  const [measuredBottomChromeHeight, setMeasuredBottomChromeHeight] = useState(
    layoutBottomChromeHeight
  );
  const { setHasCompletedOnboarding } = useOnboardingStore();
  const onboardingConfig = useFeatureConfig("onboarding");

  useEffect(() => {
    setMeasuredBottomChromeHeight(layoutBottomChromeHeight);
  }, [layoutBottomChromeHeight]);

  const getImageForPage = useCallback(
    (
      imageKey: string,
      dark: boolean
    ): { image?: ImageSourcePropType; svg?: React.ComponentType<any> } => {
      switch (imageKey) {
        case "auth_scans":
          return { image: Images.diagnoseAi };
        case "auth_identity":
          return dark
            ? { image: Images.homeFindShroomsDark }
            : { image: Images.homeFindShrooms };
        case "auth_cards":
          return {
            image: dark ? Images.homeMushroomOfDayDark : Images.homeMushroomOfDay,
          };
        case "auth_mins":
          return {
            image: dark ? Images.homeFindShroomsDark : Images.homeFindShrooms,
          };
        default:
          return { image: Images.homeFindShrooms };
      }
    },
    []
  );

  const onboardingPages = useMemo((): OnboardingPageData[] => {
    return onboardingConfig.pages.map((page: any, index: number) => {
      const imageData = (page as any).imageKey
        ? getImageForPage((page as any).imageKey, isDark)
        : page.image
          ? { image: page.image }
          : {};
      const isLastPage = index === onboardingConfig.pages.length - 1;
      return {
        id: `${index + 1}`,
        title: page.title,
        description: page.subtitle,
        backgroundImage: (isDark
          ? ONBOARDING_BACKGROUNDS_DARK
          : ONBOARDING_BACKGROUNDS_LIGHT)[index],
        illustrationImage: imageData.image || page.image,
        illustrationSvg: (imageData as { svg?: React.ComponentType<any> }).svg,
        illustration: isLastPage ? "authProgress" : undefined,
        stats: page.stats,
        tabs: page.tabs,
      };
    });
  }, [onboardingConfig.pages, isDark, getImageForPage]);

  const totalPages = onboardingPages.length;
  const getStartedPageIndex = totalPages - 2;
  const paginationDotCount = totalPages - 1;
  const initialPageParam = route.params?.initialPage as number | undefined;
  const routeInitialIndex = useMemo(
    () => normalizeRouteInitialPage(initialPageParam, totalPages),
    [initialPageParam, totalPages]
  );

  const [currentPage, setCurrentPage] = useState(routeInitialIndex);
  const listRef = useRef<FlatList<OnboardingPageData>>(null);
  const scrollX = useRef(
    new Animated.Value(routeInitialIndex * screenWidth)
  ).current;
  const bottomSectionOpacity = useRef(
    new Animated.Value(routeInitialIndex >= totalPages - 1 ? 0 : 1)
  ).current;

  const syncScrollOffset = useCallback(
    (offsetX: number) => {
      const idx = Math.min(
        totalPages - 1,
        Math.max(0, Math.round(offsetX / screenWidth))
      );
      setCurrentPage((prev) => (prev === idx ? prev : idx));
    },
    [totalPages, screenWidth]
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const lead = viewableItems
        .filter((entry) => entry.isViewable && entry.index != null)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))[0];
      if (lead?.index == null) return;
      setCurrentPage((prev) => (prev === lead.index ? prev : lead.index!));
    }
  ).current;

  const getItemLayout = useCallback(
    (_: ArrayLike<OnboardingPageData> | null | undefined, index: number) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth]
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncScrollOffset(e.nativeEvent.contentOffset.x);
    },
    [syncScrollOffset]
  );

  const onScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncScrollOffset(e.nativeEvent.contentOffset.x);
    },
    [syncScrollOffset]
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
        useNativeDriver: false,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          syncScrollOffset(e.nativeEvent.contentOffset.x);
        },
      }),
    [scrollX, syncScrollOffset]
  );

  const onScrollToIndexFailed = useCallback(
    (info: { index: number }) => {
      const offset = info.index * screenWidth;
      listRef.current?.scrollToOffset({ offset, animated: false });
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: info.index, animated: false });
      });
    },
    [screenWidth]
  );

  useEffect(() => {
    scrollX.setValue(currentPage * screenWidth);
    listRef.current?.scrollToOffset({
      offset: currentPage * screenWidth,
      animated: false,
    });
  }, [screenWidth]);

  useLayoutEffect(() => {
    const idx = normalizeRouteInitialPage(initialPageParam, totalPages);
    setCurrentPage(idx);
    scrollX.setValue(idx * screenWidth);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: idx * screenWidth,
        animated: false,
      });
    });
  }, [initialPageParam, totalPages, scrollX, screenWidth]);

  useFocusEffect(
    useCallback(() => {
      const idx = normalizeRouteInitialPage(initialPageParam, totalPages);
      setCurrentPage(idx);
      scrollX.setValue(idx * screenWidth);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: idx * screenWidth,
          animated: false,
        });
      });
    }, [initialPageParam, totalPages, scrollX, screenWidth])
  );

  const isAuthProgressPage =
    onboardingPages[currentPage]?.illustration === "authProgress";

  useLayoutEffect(() => {
    Animated.timing(bottomSectionOpacity, {
      toValue: isAuthProgressPage ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [bottomSectionOpacity, isAuthProgressPage]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      const next = currentPage + 1;
      setCurrentPage(next);
      listRef.current?.scrollToOffset({
        offset: next * screenWidth,
        animated: true,
      });
    }
  }, [currentPage, totalPages, screenWidth]);

  const handleSkip = useCallback(() => {
    const lastIdx = totalPages - 1;
    setCurrentPage(lastIdx);
    scrollX.setValue(lastIdx * screenWidth);
    listRef.current?.scrollToOffset({
      offset: lastIdx * screenWidth,
      animated: false,
    });
  }, [totalPages, scrollX, screenWidth]);

  const handleSignUp = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "AuthStack",
        params: { screen: "SignUp" },
      })
    );
    requestAnimationFrame(() => {
      setHasCompletedOnboarding(true);
    });
  }, [navigation, setHasCompletedOnboarding]);

  const handleLogIn = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: "AuthStack",
        params: { screen: "Login" },
      })
    );
    requestAnimationFrame(() => {
      setHasCompletedOnboarding(true);
    });
  }, [navigation, setHasCompletedOnboarding]);

  const handleContinueAsGuest = useCallback(async () => {
    try {
      const authStore = useAuthStore.getState();
      const rawTimeout = getRemoteConfigValue("guestLoginTimeoutMs");
      const guestLoginTimeout = Math.max(Number(rawTimeout) || 30000, 30000);
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
      setHasCompletedOnboarding(true);
      await AsyncStorage.setItem(TOOLTIP_ELIGIBLE_FOR_SIGNUP_KEY, "true");
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
      const isTimeout =
        error instanceof Error && error.message === "GUEST_LOGIN_TIMEOUT";
      const errorMessage = isTimeout
        ? COMMON_STRINGS.messages.connectionTakingTooLong
        : error instanceof Error
          ? error.message
          : COMMON_STRINGS.messages.failedToContinueAsGuest;
      showToast(errorMessage, "error", 5000);
    }
  }, [navigation, setHasCompletedOnboarding, showToast]);

  const renderItem = useCallback(
    ({ item, index }: { item: OnboardingPageData; index: number }) => (
      <View
        style={[styles.pageItem, { width: screenWidth, height: screenHeight }]}
      >
        <OnboardingPageTablet
          data={item}
          width={screenWidth}
          height={screenHeight}
          pageIndex={index}
          bottomChromeHeight={measuredBottomChromeHeight}
          onSignUp={handleSignUp}
          onLogIn={handleLogIn}
          onContinueAsGuest={handleContinueAsGuest}
        />
      </View>
    ),
    [
      handleSignUp,
      handleLogIn,
      handleContinueAsGuest,
      screenWidth,
      screenHeight,
      measuredBottomChromeHeight,
    ]
  );

  const handleBottomSectionLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const measured = Math.ceil(event.nativeEvent.layout.height);
      if (measured > 0) {
        setMeasuredBottomChromeHeight(measured);
      }
    },
    []
  );

  const keyExtractor = useCallback((item: OnboardingPageData) => item.id, []);

  return (
    <ScreenContainer showBackground={false} edges={[]} backgroundColor="transparent">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <View
        style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}
        pointerEvents="box-none"
      >
        <View style={styles.topBarContent}>
          <View style={styles.spacer} />
          {currentPage < getStartedPageIndex && (
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.8}
              hitSlop={HIT_SLOP.CLOSE}
              accessibilityRole="button"
              accessibilityLabel={onboardingConfig.skipText}
            >
              <Text
                style={[
                  styles.skipText,
                  TABLET_ONBOARDING_AUX_TEXT,
                  { color: theme.colors.text },
                ]}
              >
                {onboardingConfig.skipText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.swipeableContainer}>
        <AnimatedFlatList
          ref={listRef}
          data={onboardingPages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          snapToInterval={screenWidth}
          snapToAlignment="center"
          disableIntervalMomentum
          overScrollMode="never"
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onScrollEndDrag={onScrollEndDrag}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={onScrollToIndexFailed}
          removeClippedSubviews={false}
          initialScrollIndex={totalPages > 0 ? routeInitialIndex : 0}
          initialNumToRender={5}
          maxToRenderPerBatch={2}
          windowSize={7}
          decelerationRate="fast"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      <Animated.View
        onLayout={handleBottomSectionLayout}
        pointerEvents={isAuthProgressPage ? "none" : "box-none"}
        style={[
          styles.bottomSection,
          {
            opacity: bottomSectionOpacity,
            paddingBottom: Math.max(insets.bottom, 16),
            gap: TABLET_BOTTOM_SECTION_GAP,
          },
        ]}
      >
        <PaginationDots
          totalPages={paginationDotCount}
          scrollX={scrollX}
          pageWidth={screenWidth}
          containerStyle={styles.paginationDots}
        />
        {currentPage < getStartedPageIndex + 1 ? (
          <View style={styles.buttonContainer}>
            <Button
              title={getOnboardingBottomCtaTitle(
                currentPage,
                getStartedPageIndex,
                onboardingConfig.continueText,
                onboardingConfig.getStartedText
              )}
              variant="primary"
              size="large"
              fullWidth
              onPress={handleNext}
              style={[
                styles.tabletCta,
                isDark
                  ? {
                      backgroundColor: theme.colors.primaryCTA,
                      borderRadius: ONBOARDING_CTA_DARK.borderRadius,
                    }
                  : { backgroundColor: theme.colors.primaryCTA },
              ]}
            />
          </View>
        ) : null}
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
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
    minHeight: 32,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontFamily: FONTS.medium,
  },
  swipeableContainer: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  pageItem: {
    flex: 1,
    overflow: "hidden",
  },
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  paginationDots: {
    transform: [{ translateY: TABLET_PAGINATION_DOTS_TRANSLATE_Y }],
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 390,
  },
  tabletCta: {
    minHeight: 48,
    borderRadius: 24,
  },
});
