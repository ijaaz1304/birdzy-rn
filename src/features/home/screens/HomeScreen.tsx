import { HomeExploreNearYouSection } from "../../explore/components/HomeExploreNearYouSection";
import { useExploreEntry } from "../../explore/useExploreEntry";
import { useLocationPermissionGranted } from "../../explore/useLocationPermissionGranted";
/**
 * Home Screen - UI Implementation
 */

import { AppImage } from "@/components/AppImage";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { InteractionManager, Platform, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  AppState,
  AppStateStatus,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  useNavigation,
  useFocusEffect,
  useIsFocused,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  RootStackParamList,
  HomeStackParamList,
} from "../../../navigation/types";
import { useTheme, useIsDark } from "../../../hooks/useTheme";
import { AppText, AppOtherAppCard } from "../../../components/shared";
import { CloseIcon } from "../../../components/shared/CloseIcon";
import { Avatar } from "../../../atoms";
import { Images } from "../../../assets";
import DiscountCountdownBanner from "../../../components/customui/DiscountCountdownBanner";
import DiscountBanner from "../../../components/customui/DiscountBanner";
import {
  HomeIdentifyCardsSection,
  HomeWizardBanner,
  HomeBirdCornerSection,
} from "../components";
import { useIdentificationEntry } from "../../camera/IdentificationEntryProvider";
import { useIdentificationEntryStore } from "../../camera/identificationEntry.store";
import { useFeatureConfig } from "../../../config/context";
import { screenStyles, layoutStyles } from "../../../styles/common";
import { BirdOfTheDayModal } from "../../../molecules/Modal/BirdOfTheDayModal";
import { LimitReachedBottomSheet } from "../../../molecules/Modal/LimitReachedBottomSheet";
import { CongratulationsModal } from "../../../molecules/Modal/CongratulationsModal";
import { navigateToSubscriptionMain } from "../../../utils/navigation";
import {
  peekPendingIdentificationMilestone,
  clearPendingIdentificationMilestone,
} from "../../../services/session/identificationMilestonePending.service";
import { useDiscountStore } from "../../../features/discount/discount.store";
import { useDiscountOfferCountdown } from "../../subscription/utils/discountOffer";
import {
  getSessionCount,
  incrementSessionCount,
} from "../../../services/session/session.service";
import {
  getNextSessionModalInQueue,
  markSubscriptionShownForSession,
  shouldShowMushroomOfTheDayPopup,
  markMushroomOfTheDayPopupShown,
  setPendingNotificationAfterSubscription,
  markNotificationShownForSession,
  shouldShowRateUsModal,
  shouldShowLocationModal,
  markLocationShownForSession,
  setPendingRateUsAfterNotification,
  setPendingLocationAfterNotification,
  setPendingRateUsAfterLocation,
} from "../../../services/session/sessionModalOrchestrator.service";
import { useNotificationPopupStore } from "../../notification/notificationPopup.store";
import { useLocationPopupStore } from "../../location/locationPopup.store";
import { useRateUsRequestStore } from "../../rate-us/rateUsRequest.store";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import { sessionLogger } from "../../../services/session/sessionLogger";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../../features/subscription/subscription.store";
import { useStrings } from "../../../hooks/useStrings";
// Weather permissions removed - not needed for rocks/minerals app
import { archetypeService } from "../../../services/archetype/archetype.service";
import { getDisplayName } from "../../../utils/mushroomDisplayUtils";
import { resolveBirdHeroImageUrls } from "../../../utils/mushroomCardUtils";
import { useAuthStore } from "../../auth/auth.store";
import { isIapPipelineBusy } from "../../subscription/hooks/useIapPurchase";
import { hasPendingMarketingDeepLink } from "../../../navigation/deepLinking/deepLinkManager";
import { waitForAuthentication } from "../../../utils/authUtils";
import { HOME_LAYOUT } from "../../../constants/colorConstants";
import { AUTH_WAIT, TIMING } from "../../../constants/appConstants";
import {
  SCREEN_STORAGE_KEYS,
  UI_STATE_KEYS,
} from "../../../constants/storageConstants";
import { usePublishedAppsStore } from "../publishedApps.store";
import { filterPublishedAppsForCrossPromo } from "../publishedAppsFilter";
import { getRandomizedCatalogueListing } from "../../../utils/catalogueUtils";
import { useRunAfterTooltipComplete } from "../../../contexts/TooltipVisibilityContext";
import { isTooltipPending } from "../../../components/AppLogsTooltip/AppLogsTooltip";
import { warmCatalogueList } from "../../catalogue/warmCatalogueList";
import {
  prefetchRemoteImage,
  prefetchRemoteImages,
} from "../../../utils/prefetchImages";
import { FONTS } from "../../../common/typography";

import { Radius } from "../../../design";

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type HomeStackNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const getHomeDisplayName = (rawName?: string): string => {
  const trimmed = (rawName ?? "").trim();
  if (!trimmed) return "Guest";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return `${words[0]} ${words[1]}`;
  }

  // For long full names, keep only first word to avoid header distortion.
  if (trimmed.length > 18 && words.length > 1) {
    return words[0];
  }

  return trimmed;
};

export const HomeScreen = () => {
  const rootNavigation = useNavigation<RootNavigationProp>();
  const homeStackNavigation = useNavigation<HomeStackNavigationProp>();
  const { startIdentificationEntry, startSoundIdentificationEntry } =
    useIdentificationEntry();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const colors = theme.colors;
  const Space = theme.spacing;
  const strings = useStrings();
  const isDark = useIsDark();
  const isHomeFocused = useIsFocused();
  const isHomeFocusedRef = useRef(isHomeFocused);
  isHomeFocusedRef.current = isHomeFocused;
  const { openExplore, popups: explorePopups } = useExploreEntry();
  const locationPermissionGranted = useLocationPermissionGranted();
  const openExploreFromHome = (tab: "growingNow" | "yearRound") =>
    openExplore(tab);

  // Get app configuration
  const homeConfig = useFeatureConfig("home");
  const { result: publishedAppsResult, managePublishedApps } =
    usePublishedAppsStore();

  // Fetch published (other) apps when home is shown so home section uses dynamic images
  useFocusEffect(
    useCallback(() => {
      managePublishedApps();
    }, [managePublishedApps])
  );

  // Identify bottom tab: run permission popups on Home when requested.
  useFocusEffect(
    useCallback(() => {
      if (useIdentificationEntryStore.getState().pendingFromBottomTab) {
        useIdentificationEntryStore.getState().setPendingFromBottomTab(false);
        startIdentificationEntry();
        return;
      }
    }, [startIdentificationEntry])
  );

  // Explicit return to Home (e.g. identify error) — block FTUE from hijacking to Catalogue.
  useFocusEffect(
    useCallback(() => {
      if (!useIdentificationEntryStore.getState().suppressFtueAutoNavigation) {
        return;
      }
      void AsyncStorage.setItem(UI_STATE_KEYS.FTUE_AUTO_LEFT_HOME, "true");
    }, [])
  );

  // After identification completes, show milestone congratulations on Home only.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const pending = await peekPendingIdentificationMilestone();
        if (!active || pending == null) return;
        InteractionManager.runAfterInteractions(() => {
          if (active) setIdentificationMilestoneCount(pending);
        });
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  // Refresh auth/me (last activity) when user focuses home, throttled to once per hour
  useFocusEffect(
    useCallback(() => {
      if (!useAuthStore.getState().isAuthenticated) return;

      // Keep Home premium UI in sync with latest auth snapshot immediately.
      useSubscriptionStore.getState().syncFromAuthStore();

      // If throttled refresh runs and updates auth user, mirror it again into subscription store.
      void useAuthStore
        .getState()
        .refreshProfileSilentIfThrottled()
        .then(() => {
          useSubscriptionStore.getState().syncFromAuthStore();
        })
        .catch(() => {
          // Silent refresh is best-effort; keep existing state.
        });
    }, [])
  );

  const fromApi = useMemo(() => {
    const publishedAppsFiltered = filterPublishedAppsForCrossPromo(
      Array.isArray(publishedAppsResult) ? publishedAppsResult : []
    );
    const shuffled = getRandomizedCatalogueListing(publishedAppsFiltered);
    return shuffled.map((a, i) => {
      const app = a as any;
      const storeUrl =
        Platform.OS === "android" ? app.playstoreUrl : app.appstoreUrl;
      return {
        key: app.title ?? app.id ?? `app-${i}`,
        title: app.title ?? "App",
        subtitle: app.description ?? "",
        image: app.imageUrl ? { uri: app.imageUrl } : Images.mineralSample,
        storeUrl,
      };
    });
  }, [publishedAppsResult]);
  // Only show API apps that have the platform store link (no static fallbacks without URLs)
  const otherAppsForHome = fromApi;

  const { isDiscountBannerClosedForSession, markDiscountBannerClosed } =
    useDiscountStore();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const { setRequestShow: setRequestShowNotificationPopup } =
    useNotificationPopupStore();
  const { setRequestShow: setRequestShowLocationPopup } =
    useLocationPopupStore();
  const { setRequestShow: setRequestShowRateUs } = useRateUsRequestStore();
  const [showDiscountBanner, setShowDiscountBanner] = useState(true);
  const [showInlineDiscountBanner, setShowInlineDiscountBanner] =
    useState(true);
  const registerRunAfterTooltipComplete = useRunAfterTooltipComplete();
  const discountOffer = useDiscountOfferCountdown();
  const countdown = {
    hours: discountOffer.hours,
    minutes: discountOffer.minutes,
    seconds: discountOffer.seconds,
  };
  const [refreshing, setRefreshing] = useState(false);
  // Weather removed - not needed for rocks/minerals app

  // Rock of the Day state - fetched from API
  const [mushroomOfTheDay, setMushroomOfTheDay] = useState<{
    id: string;
    name: string;
    scientificName: string;
    canonicalName?: string;
    image: string | number | { uri: string };
    imageUrls?: string[];
    description: string;
    price?: string;
  } | null>(null);
  // When API returns multiple specimens, refresh cycles through them
  const mushroomOfTheDaySpecimensRef = useRef<any[]>([]);
  const mushroomOfTheDayIndexRef = useRef(0);

  // Rock of the Day Modal state
  const [showBirdOfTheDayModal, setShowBirdOfTheDayModal] = useState(false);
  const [showMotdLimitSheet, setShowMotdLimitSheet] = useState(false);
  const [loadingMushroomOfTheDay, setLoadingMushroomOfTheDay] = useState(false);
  const [showMushroomOfDayBanner, setShowMushroomOfDayBanner] = useState(true);

  const MUSHROOM_OF_DAY_CLOSED_KEY =
    SCREEN_STORAGE_KEYS.MUSHROOM_OF_DAY_CLOSED_AT;
  const MUSHROOM_OF_DAY_LAST_SEEN_KEY =
    SCREEN_STORAGE_KEYS.MUSHROOM_OF_DAY_LAST_SEEN;
  const MUSHROOM_OF_DAY_STREAK_KEY = SCREEN_STORAGE_KEYS.MUSHROOM_OF_DAY_STREAK;
  const _MUSHROOM_OF_DAY_REFRESH_COUNT_KEY =
    SCREEN_STORAGE_KEYS.MUSHROOM_OF_DAY_REFRESH_COUNT;
  const _MUSHROOM_OF_DAY_FREE_REFRESH_LIMIT = 1;

  const [identificationMilestoneCount, setIdentificationMilestoneCount] =
    useState<number | null>(null);

  // Rock Personality modals converted to screens - state removed

  // Weather removed - not needed for rocks/minerals app

  // Build rock-of-the-day object from a specimen (optional price if API provides it)
  const buildMushroomOfTheDayFromSpecimen = useCallback(
    (specimen: any) => {
      const nameForPath = specimen?.canonicalName ?? specimen?.scientificName;
      const imageUrlsResolved = resolveBirdHeroImageUrls(
        nameForPath,
        specimen?.imageUrls,
        specimen?.scientificName,
        specimen?.defaultImageUrl
      );
      const imageUrl = imageUrlsResolved[0];

      return {
        id: specimen?.archetypeId ?? "default",
        name:
          getDisplayName(specimen) || strings.home.birdOfTheDay.featuredBird,
        scientificName:
          specimen?.scientificName || strings.home.birdOfTheDay.birdSpecimen,
        canonicalName: specimen?.canonicalName,
        image: imageUrl,
        imageUrls: imageUrlsResolved.length > 0 ? imageUrlsResolved : undefined,
        description:
          specimen?.detailedDescription ||
          strings.home.birdOfTheDay.discoverDescription,
        price: (specimen as any)?.price ?? undefined,
      };
    },
    [strings]
  );

  const applyMushroomOfTheDayAtIndex = useCallback(
    (specimens: any[], index: number) => {
      const specimen = specimens[index];
      if (!specimen) return;
      const built = buildMushroomOfTheDayFromSpecimen(specimen);
      setMushroomOfTheDay(built);
      const imageUrl = built.image || specimen?.imageUrls?.[0];
      prefetchRemoteImages([imageUrl], 1);
      void prefetchRemoteImage(imageUrl);
    },
    [buildMushroomOfTheDayFromSpecimen]
  );

  // Fetch Mushroom of the Day: load today's 3 specimens; premium refresh cycles locally.
  const fetchMushroomOfTheDay = useCallback(
    async (cycleToNext = false) => {
      const cached = mushroomOfTheDaySpecimensRef.current;
      if (cycleToNext && cached.length > 0) {
        mushroomOfTheDayIndexRef.current =
          (mushroomOfTheDayIndexRef.current + 1) % cached.length;
        applyMushroomOfTheDayAtIndex(cached, mushroomOfTheDayIndexRef.current);
        return;
      }

      try {
        setLoadingMushroomOfTheDay(true);
        const specimens = await archetypeService.getSpecimensOfTheDay();
        if (specimens && specimens.length > 0) {
          mushroomOfTheDaySpecimensRef.current = specimens;
          if (cycleToNext) {
            mushroomOfTheDayIndexRef.current =
              (mushroomOfTheDayIndexRef.current + 1) % specimens.length;
          } else {
            mushroomOfTheDayIndexRef.current = 0;
          }
          applyMushroomOfTheDayAtIndex(
            specimens,
            mushroomOfTheDayIndexRef.current
          );
        } else {
          mushroomOfTheDaySpecimensRef.current = [];
          mushroomOfTheDayIndexRef.current = 0;
          setMushroomOfTheDay(buildMushroomOfTheDayFromSpecimen(null));
        }
      } catch (error) {
        if (!cycleToNext || mushroomOfTheDaySpecimensRef.current.length === 0) {
          mushroomOfTheDaySpecimensRef.current = [];
          mushroomOfTheDayIndexRef.current = 0;
          setMushroomOfTheDay(buildMushroomOfTheDayFromSpecimen(null));
        }
      } finally {
        setLoadingMushroomOfTheDay(false);
      }
    },
    [applyMushroomOfTheDayAtIndex, buildMushroomOfTheDayFromSpecimen]
  );

  const tryShowMushroomOfTheDayAutoPopup = useCallback(async () => {
    if (!isHomeFocusedRef.current) {
      useAppLogsStore
        .getState()
        .info("[MushroomOfDay] auto popup skipped — Home not focused");
      return;
    }

    if (!(await shouldShowMushroomOfTheDayPopup())) return;

    const today = new Date().toDateString();
    const lastSeen = await AsyncStorage.getItem(MUSHROOM_OF_DAY_LAST_SEEN_KEY);
    if (lastSeen === today) return;

    await markMushroomOfTheDayPopupShown();
    await AsyncStorage.setItem(MUSHROOM_OF_DAY_LAST_SEEN_KEY, today);
    const specimens = mushroomOfTheDaySpecimensRef.current;
    const idx = mushroomOfTheDayIndexRef.current;
    const imageUrl = specimens[idx]?.imageUrls?.[0];
    await prefetchRemoteImage(imageUrl);
    InteractionManager.runAfterInteractions(() => {
      if (!isHomeFocusedRef.current) return;
      setShowBirdOfTheDayModal(true);
    });
    analyticsService.logEvent(EVENTS.bird_of_day_popup_shown);
    analyticsService.logEvent(EVENTS.bird_of_the_day_screen);
    sessionLogger.modalDecision("bird_of_day", "shown");
  }, [MUSHROOM_OF_DAY_LAST_SEEN_KEY]);

  // Weather removed - not needed for rocks/minerals app

  // On home focus: session modals in order — subscription → notification → location → rate us → mushroom of the day.
  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(async () => {
        // First Home visit = session 1: increment here so post-auth session-based popups/navigation run correctly
        await incrementSessionCount();

        const runSessionModals = async () => {
          if (!isHomeFocusedRef.current) return;
          if (hasPendingMarketingDeepLink()) return;
          if (isIapPipelineBusy()) {
            useAppLogsStore
              .getState()
              .info("[SessionModal] skipped on home focus (IAP pipeline busy)");
            return;
          }

          const next = await getNextSessionModalInQueue(isPremium);

          if (!isHomeFocusedRef.current) return;
          if (hasPendingMarketingDeepLink()) return;

          if (next === "subscription") {
            await markSubscriptionShownForSession();
            await setPendingNotificationAfterSubscription(true);
            analyticsService.logEvent(EVENTS.subscription_modal_shown, {
              trigger: "auto_home",
            });
            sessionLogger.modalDecision("subscription", "shown", {
              trigger: "auto",
            });
            rootNavigation.navigate("SubscriptionStack", {
              screen: "SubscriptionMain",
              params: {
                discount50: discountOffer.isActive,
              },
            });
            return;
          }

          if (next === "notification") {
            await setPendingNotificationAfterSubscription(false);
            await markNotificationShownForSession();
            const shouldShowLocation = await shouldShowLocationModal();
            if (shouldShowLocation) {
              await setPendingLocationAfterNotification(true);
            }
            const shouldShowRateUs = await shouldShowRateUsModal();
            if (shouldShowRateUs) await setPendingRateUsAfterNotification(true);
            setRequestShowNotificationPopup(true);
            return;
          }

          if (next === "location") {
            await markLocationShownForSession();
            const shouldShowRateUs = await shouldShowRateUsModal();
            if (shouldShowRateUs) await setPendingRateUsAfterLocation(true);
            setRequestShowLocationPopup(true);
            return;
          }

          await tryShowMushroomOfTheDayAutoPopup();

          if (next === "rate_us") {
            useAppLogsStore
              .getState()
              .info("[RateUs] Requesting modal (home focus, next=rate_us)");
            setRequestShowRateUs(true);
          }
        };

        const tooltipPending = await isTooltipPending();
        if (tooltipPending) {
          registerRunAfterTooltipComplete(runSessionModals);
          return;
        }
        await runSessionModals();
      }, TIMING.DELAY_BEFORE_INTERACTION_MS);

      return () => clearTimeout(timer);
    }, [
      isPremium,
      setRequestShowNotificationPopup,
      setRequestShowLocationPopup,
      setRequestShowRateUs,
      registerRunAfterTooltipComplete,
      discountOffer.isActive,
      tryShowMushroomOfTheDayAutoPopup,
    ])
  );

  // Discount countdown banner: show after delay
  useEffect(() => {
    const {
      getRemoteConfigValue,
    } = require("../../../services/remoteConfig/remoteConfig.service");
    const delayMs = getRemoteConfigValue("discountBannerShowDelayMs") ?? 0;
    const t = setTimeout(async () => {
      setShowDiscountBanner(true);
    }, delayMs);
    return () => clearTimeout(t);
  }, []);

  // Prime catalogue All-tab list + image cache while user browses Home.
  const loadMushrooms = useCallback(async (forceRefresh = false) => {
    await warmCatalogueList({ force: forceRefresh });
  }, []);

  // Fetch Rock of the Day on mount only (not when category changes) to avoid banner splash on tab switch
  useEffect(() => {
    const authStore = useAuthStore.getState();
    const isAuthReady = !!authStore.token || !authStore.isLoading;

    if (isAuthReady) {
      InteractionManager.runAfterInteractions(() => {
        fetchMushroomOfTheDay();
      });
    } else {
      const loadData = async () => {
        const isReady = await waitForAuthentication(
          AUTH_WAIT.MAX_WAIT_TIME_MS,
          AUTH_WAIT.CHECK_INTERVAL_MS
        );
        if (isReady) {
          InteractionManager.runAfterInteractions(() => {
            fetchMushroomOfTheDay();
          });
        }
      };
      loadData();
    }
  }, [fetchMushroomOfTheDay]);

  // Fetch minerals on mount and when category changes
  useEffect(() => {
    loadMushrooms();
  }, [loadMushrooms]);

  // Mushroom of the Day: 24h cooldown within session — hide banner if closed within cooldown this session only
  useEffect(() => {
    const check = async () => {
      try {
        const {
          getRemoteConfigValue,
        } = require("../../../services/remoteConfig/remoteConfig.service");
        const closedAt = await AsyncStorage.getItem(MUSHROOM_OF_DAY_CLOSED_KEY);
        if (!closedAt) return;
        const hours =
          getRemoteConfigValue("mushroomOfTheDayPopupCooldownHours") ?? 24;
        const elapsed =
          (Date.now() - parseInt(closedAt, 10)) / (1000 * 60 * 60);
        if (elapsed < hours) setShowMushroomOfDayBanner(false);
      } catch (_) {}
    };
    check();
  }, []);

  // When app goes to background, clear banner closed timestamp; when app opens (active), show banner again
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (nextState === "background" || nextState === "inactive") {
          AsyncStorage.removeItem(MUSHROOM_OF_DAY_CLOSED_KEY).catch(() => {});
        }
        if (nextState === "active") {
          setShowMushroomOfDayBanner(true);
        }
      }
    );
    return () => subscription.remove();
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchMushroomOfTheDay(), loadMushrooms(true)]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMushroomOfTheDay, loadMushrooms]);

  const { user } = useAuthStore();
  const userName = getHomeDisplayName(user?.name || user?.firstName || "Guest");

  const stickyDiscountBannerVisible = !isPremium && showDiscountBanner;

  const stickyDiscountScrollPadding = stickyDiscountBannerVisible
    ? 8
    : HOME_SCROLL_BOTTOM_PADDING;

  const handleOpenMushroomOfDay = useCallback(async () => {
    if (!mushroomOfTheDay) return;
    analyticsService.logEvent(EVENTS.bird_of_day_button);
    analyticsService.logEvent(EVENTS.bird_of_the_day_preview);
    analyticsService.logEvent(EVENTS.bird_of_the_day_screen);
    try {
      const today = new Date().toDateString();
      const lastSeen = await AsyncStorage.getItem(
        MUSHROOM_OF_DAY_LAST_SEEN_KEY
      );
      const prevStreak = parseInt(
        (await AsyncStorage.getItem(MUSHROOM_OF_DAY_STREAK_KEY)) || "0",
        10
      );
      const yesterday = new Date(Date.now() - 864e5).toDateString();
      const newStreak =
        lastSeen === today
          ? prevStreak
          : lastSeen === yesterday
          ? prevStreak + 1
          : 1;
      await AsyncStorage.setItem(MUSHROOM_OF_DAY_LAST_SEEN_KEY, today);
      await AsyncStorage.setItem(MUSHROOM_OF_DAY_STREAK_KEY, String(newStreak));
      analyticsService.logEvent(EVENTS.bird_of_the_day_seen_streak, {
        streak_count: String(newStreak),
      });
    } catch (_) {}
    const imageUrl =
      typeof mushroomOfTheDay.image === "string"
        ? mushroomOfTheDay.image
        : mushroomOfTheDay.image &&
          typeof mushroomOfTheDay.image === "object" &&
          "uri" in mushroomOfTheDay.image
        ? mushroomOfTheDay.image.uri
        : undefined;
    await prefetchRemoteImage(imageUrl);
    setShowBirdOfTheDayModal(true);
  }, [mushroomOfTheDay]);

  return (
    <SafeAreaView
      style={[
        screenStyles.safeArea,
        { backgroundColor: colors.surfaceSecondary },
      ]}
      edges={["top"]}
    >
      <View style={styles.homeBody}>
        <ScrollView
          style={styles.homeScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: stickyDiscountScrollPadding,
            width: "100%",
            alignItems: "stretch",
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header */}
          <View
            style={[
              screenStyles.header,
              {
                paddingHorizontal: HORIZONTAL_MARGIN,
                paddingTop: Space[4],
                paddingBottom: Space[2],
              },
            ]}
          >
            <View style={[screenStyles.headerLeft, { gap: Space[2] }]}>
              <TouchableOpacity
                onPress={() => {
                  rootNavigation.navigate("SettingsStack", {
                    screen: "SettingsMain",
                  });
                }}
                activeOpacity={0.7}
                style={isPremium ? styles.avatarWithCoverTouchable : undefined}
              >
                {isPremium ? (
                  <View style={styles.avatarCoverContainer}>
                    <Avatar
                      source={
                        user?.avatar ? { uri: user.avatar } : Images.avatarHome
                      }
                      name={userName}
                      size={32}
                      style={styles.avatarInsideCover}
                    />
                    <AppImage
                      source={Images.avatarCover}
                      style={styles.avatarCoverBg}
                      resizeMode="contain"
                      pointerEvents="none"
                    />
                  </View>
                ) : (
                  <Avatar
                    source={
                      user?.avatar ? { uri: user.avatar } : Images.avatarHome
                    }
                    name={userName}
                    size={32}
                  />
                )}
              </TouchableOpacity>
              <AppText variant="title18">
                {homeConfig.header.greeting(userName)}
              </AppText>
            </View>
            <View style={[screenStyles.headerRight, styles.headerRightActions]}>
              {isPremium ? (
                <View style={styles.youAreProWrap} pointerEvents="none">
                  <AppImage
                    source={Images.youArePro}
                    style={styles.youAreProImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    analyticsService.logEvent(EVENTS.go_pro_button);
                    rootNavigation.navigate("SubscriptionStack", {
                      screen: "SubscriptionMain",
                      params: {
                        discount50: discountOffer.isActive,
                      },
                    });
                  }}
                  activeOpacity={0.8}
                  style={styles.goProIconButton}
                >
                  <AppImage
                    source={Images.goPro}
                    style={styles.goProImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  rootNavigation.navigate("MainTabs", {
                    screen: "Catalogue",
                    params: {
                      screen: "SearchFilter",
                    },
                  });
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.searchIconContainer]}
              >
                <AppImage
                  source={
                    isDark ? Images.searchHomeDark : Images.iconGlobalSearch
                  }
                  style={styles.searchIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sectionBlock, styles.identifyBannerSection]}>
            <HomeIdentifyCardsSection
              onSoundPress={() => {
                startSoundIdentificationEntry();
              }}
              onPhotoPress={() => {
                analyticsService.logEvent(EVENTS.identify_banner);
                startIdentificationEntry();
              }}
            />
          </View>

          <View style={styles.sectionBlock}>
            <HomeWizardBanner
              onPress={() => {
                homeStackNavigation.navigate("StepByStep", {
                  startFresh: true,
                });
              }}
            />
          </View>

          {!isPremium && showInlineDiscountBanner && (
            <View style={[styles.sectionBlock, styles.discountBannerSection]}>
              {discountOffer.isActive ? (
                <DiscountBanner
                  hours={countdown.hours}
                  minutes={countdown.minutes}
                  seconds={countdown.seconds}
                  isDiscountActive
                  onClose={() => setShowInlineDiscountBanner(false)}
                  onSubscribe={() => {
                    analyticsService.logEvent(EVENTS.subs_discount_banner);
                    rootNavigation.navigate("SubscriptionStack", {
                      screen: "SubscriptionMain",
                      params: {
                        openPlanModal: true,
                        discount50: true,
                      },
                    });
                  }}
                />
              ) : (
                <View style={styles.fullSubsWrap}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      analyticsService.logEvent(EVENTS.subs_discount_banner);
                      rootNavigation.navigate("SubscriptionStack", {
                        screen: "SubscriptionMain",
                        params: {
                          openPlanModal: true,
                          discount50: false,
                        },
                      });
                    }}
                  >
                    <AppImage
                      source={Images.fullSubsBanner}
                      style={styles.fullSubsBanner}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fullSubsClose}
                    onPress={() => setShowInlineDiscountBanner(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CloseIcon isDark={isDark} style={styles.fullSubsCloseIcon} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.sectionBlock}>
            <HomeExploreNearYouSection
              onExploreMap={() => void openExploreFromHome("growingNow")}
              onGrowingNow={() => void openExploreFromHome("growingNow")}
              onYearRound={() => void openExploreFromHome("yearRound")}
              locationGranted={locationPermissionGranted !== false}
            />
          </View>

          <View style={styles.sectionBlock}>
            <HomeBirdCornerSection
              onBirdOfTheDay={() => {
                if (mushroomOfTheDay) {
                  void handleOpenMushroomOfDay();
                }
              }}
              onAskAi={() => {
                analyticsService.logEvent(EVENTS.ask_ai_banner_clicked, {
                  source: "home_corner",
                });
                rootNavigation.navigate("AskAIStack", { screen: "AskAIMain" });
              }}
              onBirdSoundLibrary={() => {
                homeStackNavigation.navigate("AudioGallery");
              }}
            />
          </View>

          <View style={styles.sectionBlock}>
            <View style={[layoutStyles.rowBetween, { marginBottom: Space[4] }]}>
              <AppText
                variant="body16"
                color={colors.textPrimary}
                style={{ fontFamily: FONTS.bold }}
              >
                {homeConfig.sections.otherApps.title}
              </AppText>
              <TouchableOpacity
                onPress={() => {
                  analyticsService.logEvent(EVENTS.our_other_app_view_all);
                  homeStackNavigation.navigate("OtherApps");
                }}
                activeOpacity={0.7}
              >
                <AppText
                  variant="caption12"
                  color={colors.textPrimary}
                  style={{ fontFamily: FONTS.medium }}
                >
                  {homeConfig.sections.otherApps.viewAllText}
                </AppText>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.otherAppsScrollContent}
            >
              {otherAppsForHome.map((app) => (
                <AppOtherAppCard
                  key={app.key}
                  variant="horizontal"
                  title={app.title}
                  subtitle={app.subtitle}
                  image={app.image}
                  onPress={() => {
                    analyticsService.logEvent(EVENTS.get_app, {
                      app_name: String(app.title ?? app.key),
                    });
                    if (app.storeUrl) {
                      Linking.openURL(app.storeUrl);
                    } else {
                      homeStackNavigation.navigate("OtherApps");
                    }
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {!isPremium && showDiscountBanner ? (
          <View style={styles.stickyDiscountBanner}>
            <DiscountCountdownBanner
              hours={countdown.hours}
              minutes={countdown.minutes}
              seconds={countdown.seconds}
              isDiscountActive
              onClose={async () => {
                const sessionCount = await getSessionCount();
                markDiscountBannerClosed(sessionCount);
                setShowDiscountBanner(false);
              }}
              onPress={() => {
                analyticsService.logEvent(EVENTS.subs_discount_banner);
                rootNavigation.navigate("SubscriptionStack", {
                  screen: "SubscriptionMain",
                  params: {
                    discount50: discountOffer.isActive,
                  },
                });
              }}
            />
          </View>
        ) : null}
      </View>

      {/* Mushroom of the Day Modal: View details + Refresh (premium cycles; free shows upgrade). */}
      <BirdOfTheDayModal
        visible={showBirdOfTheDayModal && !!mushroomOfTheDay}
        mushroomId={mushroomOfTheDay?.id}
        mushroomName={mushroomOfTheDay?.name || ""}
        scientificName={mushroomOfTheDay?.scientificName}
        price={mushroomOfTheDay?.price}
        mushroomImage={mushroomOfTheDay?.image}
        mushroomImageUrls={mushroomOfTheDay?.imageUrls}
        canonicalName={mushroomOfTheDay?.canonicalName}
        showRefreshButton={true}
        isPremium={isPremium}
        isRefreshing={loadingMushroomOfTheDay}
        onClose={() => {
          analyticsService.logEvent(EVENTS.bird_of_day_popup_dismissed);
          setShowBirdOfTheDayModal(false);
        }}
        onRefresh={async () => {
          if (!isPremium) return;
          analyticsService.logEvent(EVENTS.bird_of_the_day_refresh_preview);
          analyticsService.logEvent(EVENTS.refresh_button_bird_of_day);
          await fetchMushroomOfTheDay(true);
        }}
        onFreeRefreshBlocked={() => {
          setShowMotdLimitSheet(true);
        }}
        onViewDetail={() => {
          analyticsService.logEvent(
            EVENTS.bird_of_the_day_refresh_more_details
          );
          if (mushroomOfTheDay) {
            const specimens = mushroomOfTheDaySpecimensRef.current || [];
            const birdOfTheDayIds = specimens
              .map(
                (s: { archetypeId?: string; _id?: string }) =>
                  s.archetypeId ?? s._id
              )
              .filter(Boolean) as string[];
            rootNavigation.navigate("MainTabs", {
              screen: "Catalogue",
              params: {
                screen: "BirdDetails",
                params: {
                  mushroomId: mushroomOfTheDay.id,
                  source: "birdOfTheDay",
                  ...(birdOfTheDayIds.length > 0 && {
                    birdOfTheDayIds,
                  }),
                },
              },
            });
          }
        }}
      />

      <LimitReachedBottomSheet
        visible={showMotdLimitSheet}
        limitType="birdOfDay"
        onClose={() => setShowMotdLimitSheet(false)}
        onUpgrade={() => {
          setShowMotdLimitSheet(false);
          navigateToSubscriptionMain();
        }}
      />

      <CongratulationsModal
        visible={identificationMilestoneCount != null}
        count={identificationMilestoneCount ?? 1}
        onClose={async () => {
          setIdentificationMilestoneCount(null);
          await clearPendingIdentificationMilestone();
        }}
        onBackToHome={async () => {
          setIdentificationMilestoneCount(null);
          await clearPendingIdentificationMilestone();
        }}
      />

      {/* Rock Personality modals converted to screens - navigation handled directly */}
      {explorePopups}
    </SafeAreaView>
  );
};

const HORIZONTAL_MARGIN = 20;
const SECTION_GAP = 24;
/** Breathing room below last home section (tab bar already occupies bottom inset). */
const HOME_SCROLL_BOTTOM_PADDING = 2;

const styles = StyleSheet.create({
  homeBody: {
    flex: 1,
  },
  homeScroll: {
    flex: 1,
  },
  headerRightActions: {
    gap: 4,
  },
  goProIconButton: {
    width: HOME_LAYOUT.GO_PRO_IMAGE_WIDTH,
    height: HOME_LAYOUT.GO_PRO_IMAGE_HEIGHT,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  goProImage: {
    width: HOME_LAYOUT.GO_PRO_IMAGE_WIDTH,
    height: HOME_LAYOUT.GO_PRO_IMAGE_HEIGHT,
  },
  youAreProWrap: {
    width: HOME_LAYOUT.YOU_ARE_PRO_IMAGE_WIDTH,
    height: HOME_LAYOUT.YOU_ARE_PRO_IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  youAreProImage: {
    width: HOME_LAYOUT.YOU_ARE_PRO_IMAGE_WIDTH,
    height: HOME_LAYOUT.YOU_ARE_PRO_IMAGE_HEIGHT,
  },
  fullSubsWrap: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 20,
    overflow: "visible",
  },
  fullSubsBanner: {
    width: "100%",
    // Clear the bundled image's intrinsic height so aspectRatio controls sizing.
    height: undefined,
    alignSelf: "stretch",
    aspectRatio:
      HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_WIDTH /
      HOME_LAYOUT.DISCOUNT_BANNER_DESIGN_HEIGHT,
    borderRadius: 20,
  },
  fullSubsClose: {
    position: "absolute",
    top: -12,
    right: -8,
    zIndex: 2,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fullSubsCloseIcon: {
    width: 24,
    height: 24,
  },
  avatarWithCoverTouchable: {
    alignSelf: "flex-start",
  },
  avatarCoverContainer: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCoverBg: {
    ...StyleSheet.absoluteFillObject,
    width: 52,
    height: 52,
    top: 3,
  },
  avatarInsideCover: {
    position: "absolute",
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: {
    width: 32,
    height: 32,
  },
  sectionBlock: {
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: HORIZONTAL_MARGIN,
    marginTop: SECTION_GAP,
  },
  identifyBannerSection: {
    marginTop: 8,
  },
  discountBannerSection: {
    width: "100%",
    alignSelf: "stretch",
    overflow: "visible",
    paddingHorizontal: HORIZONTAL_MARGIN,
    paddingTop: 8,
    marginTop: SECTION_GAP,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 16,
  },
  stickyDiscountBanner: {
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: HORIZONTAL_MARGIN,
    paddingBottom: 6,
    paddingTop: 14,
    zIndex: 30,
    elevation: 30,
    overflow: "visible",
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBadgeText: {
    fontFamily: FONTS.bold,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    minHeight: 40,
  },
  bannerWrapper: {
    width: "100%",
    height: 200,
    borderRadius: Radius.md,
    overflow: "hidden",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  aiBannerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  otherAppsScrollContent: {
    gap: 12,
    paddingRight: 4,
  },
});
