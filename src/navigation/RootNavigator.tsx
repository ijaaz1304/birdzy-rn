import { FreeScanLimitHost } from "../components/shared/FreeScanLimitHost";
import { navigateToSubscriptionMain } from "../utils/navigation";
/**
 * Root Navigator
 */

import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  AppState,
  AppStateStatus,
  DeviceEventEmitter,
  Linking,
  NativeModules,
  Platform,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import {
  DefaultTheme,
  DarkTheme,
  CommonActions,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import notifee, { EventType } from "@notifee/react-native";
import { RootStackParamList } from "./types";
import { SplashScreen } from "../app/SplashScreen";
import { NavigationService } from "../utils/navigation";

/** Minimum time to show splash so transition isn't jarring. */
const SPLASH_MIN_MS = 400;
/** Max wait before showing first screen if auth hydration is slow (provisional route). */
const SPLASH_MAX_MS = 2000;
import { OnboardingScreen } from "../features/onboarding";
import { useOnboardingStore } from "../features/onboarding/onboarding.store";
import { PostAuthOnboardingScreen } from "../features/post-auth-onboarding";
import {
  shouldResumePostAuthOnboarding,
  usePostAuthOnboardingStore,
} from "../features/post-auth-onboarding/post-auth-onboarding.store";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import { SettingsStack } from "./SettingsStack";
import { SubscriptionStack } from "./SubscriptionStack";
// Plant-specific calculators and light meter removed - not needed for rocks/minerals app (historical note)
import { AskAIStack } from "./AskAIStack";
import { BirdPersonalityStack } from "./BirdPersonalityStack";
import { useAuthStore } from "../features/auth/auth.store";
// Reminders removed - not needed for rocks/minerals app
import {
  VersionUpdateModal,
  NotificationPermissionPopup,
} from "../molecules/Modal";
import { useVersionStore } from "../features/version/version.store";
import { useRateUsStore } from "../features/rate-us/rate-us.store";
import { useRateUsRequestStore } from "../features/rate-us/rateUsRequest.store";
import { RateUsModal, FeedbackModal } from "../molecules/Modal";
import {
  markRateUsShown,
  markUserRated,
  shouldShowRateUsModal,
  getPendingRateUsAfterNotification,
  setPendingRateUsAfterNotification,
  getPendingLocationAfterNotification,
  setPendingLocationAfterNotification,
  getPendingRateUsAfterLocation,
  setPendingRateUsAfterLocation,
} from "../services/session/sessionModalOrchestrator.service";
import { openAppStoreForRating } from "../utils/modalHelpers";
import { useAppLogsStore } from "../features/app-logs/app-logs.store";
import { useNotificationPopupStore } from "../features/notification/notificationPopup.store";
import { useLocationPopupStore } from "../features/location/locationPopup.store";
import { SessionLocationPermissionModal } from "../features/location/SessionLocationPermissionModal";
import {
  incrementSessionCount,
  ensureFirstAppOpenAt,
} from "../services/session/session.service";
import { sessionLogger } from "../services/session/sessionLogger";
import {
  runAutoRestoreOncePerInstallIfNeeded,
  runAutoUnsubscribeIfNoPurchases,
  retryPendingPurchases,
} from "../features/subscription/restorePurchases";
import { analyticsService } from "../services/analytics/analytics.service";
import { EVENTS } from "../services/analytics/analytics.events";
import {
  getScreenEventForState,
  getScreenEventForScreenName,
  getLeafFocusedRouteName,
} from "../services/analytics/analytics.screenTracking";
import { logPageNavigation } from "../services/navigation/navigationLogger";
import { sendRatingFeedback } from "../services/rating/ratingFeedback.service";
import { useToast } from "../hooks";
import { BottomSheetProvider } from "../contexts/BottomSheetContext";
import { getDefaultSheetRegistry } from "../contexts/bottomSheetRegistry";
import { parsePasswordResetDeepLink } from "../features/auth/utils/authDeepLinks";
import { getIdentificationCameraEntryParams } from "../features/camera/identificationNavigation";
import {
  applyMarketingDeepLinkEscape,
  deepLinkManager,
  DEEP_LINK_RECEIVED_EVENT,
  hasAppSessionForDeepLink,
  hasPendingMarketingDeepLink,
  ingestInitialMarketingDeepLinkUrl,
  isDeepLinkUrl,
  resolveMarketingDeepLinkBootstrapRoute,
} from "./deepLinking";

const Stack = createNativeStackNavigator<RootStackParamList>();

function getActiveRouteName(state: any): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route?.state) return getActiveRouteName(route.state);
  return route?.name;
}

/** Max wait for auth store hydration; must be > SPLASH_MAX_MS so we always leave splash by SPLASH_MAX_MS, then lock in route. */
const HYDRATION_MAX_MS = 2500;

export interface RootNavigatorProps {
  /** Fires after NavigationContainer is ready and pending route has been applied (first frame safe to hide bootstrap splash). */
  onNavigationReady?: () => void;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({
  onNavigationReady,
}) => {
  const theme = useTheme();
  const [activeScreen, setActiveScreen] = useState("Splash");
  const navigationTheme = useMemo(() => {
    const base = theme.mode === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: theme.colors.surfacePrimary },
    };
  }, [theme]);
  useEffect(() => {
    if (Platform.OS !== "android") return;
    // Camera/crop previews and launch artwork remain dark in either app theme.
    const darkSurface = ["Splash", "CameraMain", "IdentifyImageCrop"].includes(
      activeScreen
    );
    NativeModules.SystemNavigationBar?.setDarkIcons(
      theme.mode !== "dark" && !darkSurface
    );
  }, [activeScreen, theme.mode]);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const postAuthHasHydrated = usePostAuthOnboardingStore((s) => s._hasHydrated);
  const navigationRef = useRef<any>(null);
  const lastScreenEventKeyRef = useRef<string>("");
  const lastScreenEnterTimeRef = useRef<number>(0);

  // Version update modal state
  const { versionInfo, checkVersion } = useVersionStore();
  const [showVersionUpdateModal, setShowVersionUpdateModal] = useState(false);

  // Rate us modal state
  const { setHasRated, setHasDeclined } = useRateUsStore();
  const [showRateUsModal, setShowRateUsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [lowRatingFromRateUs, setLowRatingFromRateUs] = useState<
    number | undefined
  >();
  const { showToast } = useToast();
  const [showNotificationPermission, setShowNotificationPermission] =
    useState(false);
  const [showSessionLocationPermission, setShowSessionLocationPermission] =
    useState(false);
  const {
    requestShow: requestShowNotificationPopup,
    setRequestShow: setRequestShowNotificationPopup,
  } = useNotificationPopupStore();
  const {
    requestShow: requestShowLocationPopup,
    setRequestShow: setRequestShowLocationPopup,
  } = useLocationPopupStore();
  const {
    requestShow: requestShowRateUs,
    setRequestShow: setRequestShowRateUs,
  } = useRateUsRequestStore();

  const continueAfterNotificationPopup = useCallback(() => {
    void getPendingLocationAfterNotification().then((pendingLocation) => {
      if (pendingLocation) {
        setPendingLocationAfterNotification(false);
        setShowSessionLocationPermission(true);
        return;
      }
      void getPendingRateUsAfterNotification().then(async (pendingRateUs) => {
        if (!pendingRateUs) return;
        await setPendingRateUsAfterNotification(false);
        if (!(await shouldShowRateUsModal())) return;
        useAppLogsStore
          .getState()
          .info("[RateUs] Requesting modal (after notification dismissed)");
        setRequestShowRateUs(true);
      });
    });
  }, [setRequestShowRateUs]);

  const continueAfterLocationPopup = useCallback(() => {
    void getPendingRateUsAfterLocation().then(async (pending) => {
      if (!pending) return;
      await setPendingRateUsAfterLocation(false);
      if (!(await shouldShowRateUsModal())) return;
      useAppLogsStore
        .getState()
        .info("[RateUs] Requesting modal (after location dismissed)");
      setRequestShowRateUs(true);
    });
  }, [setRequestShowRateUs]);

  const handleFeedbackSubmit = async (data: {
    name?: string;
    email?: string;
    feedback: string;
    rating?: number;
  }) => {
    try {
      await sendRatingFeedback({
        domain: "Birds",
        name: data.name || undefined,
        email: data.email || undefined,
        message: data.feedback,
        rating: data.rating ?? lowRatingFromRateUs,
        source: "rate_us",
      });
      analyticsService.logEvent(EVENTS.feedback_submitted);
      showToast("Thank you for your feedback!", "success");
      await markUserRated();
      setShowFeedbackModal(false);
      setLowRatingFromRateUs(undefined);
    } catch (e) {
      showToast("Failed to send. Please try again.", "error");
    }
  };

  const hasRestoredPurchasesRef = useRef(false);
  /**
   * Bootstrap routing has two phases:
   * - Provisional: shown only if storage read is taking too long (timeout).
   * - Final: applied once we know auth state from persisted storage.
   *
   * This prevents a slow AsyncStorage read from permanently forcing the wrong route.
   */
  const hasAppliedProvisionalRouteRef = useRef(false);
  const hasAppliedFinalRouteRef = useRef(false);
  const splashStartTimeRef = useRef(Date.now());
  /** When we decide the route but nav isn't ready yet, apply in onReady or via retry. */
  const pendingRouteRef = useRef<{
    route: "Onboarding" | "MainTabs" | "PostAuthOnboarding" | "AuthStack";
    final: boolean;
  } | null>(null);

  const tryApplyPendingRoute = useRef(() => {
    const pending = pendingRouteRef.current;
    if (!pending) return;
    if (hasPendingMarketingDeepLink()) return;
    const nav = NavigationService.getNavigationRef();
    if (nav?.isReady()) {
      NavigationService.reset(pending.route);
      pendingRouteRef.current = null;
      if (__DEV__) {
        console.log(
          "[AUTH_BOOTSTRAP] applied pending route (retry) ->",
          pending.route
        );
      }
    }
  });

  const pendingAuthDeepLinkUrlRef = useRef<string | null>(null);
  const [initialUrlChecked, setInitialUrlChecked] = useState(false);
  const marketingDeepLinkBootstrapInFlightRef = useRef(false);

  const markDeepLinkBootstrapComplete = useCallback(() => {
    hasAppliedFinalRouteRef.current = true;
    hasAppliedProvisionalRouteRef.current = true;
    pendingRouteRef.current = null;
    if (hasAppSessionForDeepLink()) {
      incrementSessionCount().then((count) => {
        analyticsService.logEvent(EVENTS.session_incremented, {
          session_count: count,
        });
        sessionLogger.sessionIncremented(count);
      });
    }
  }, []);

  const runMarketingDeepLinkEscape = useCallback(async (): Promise<boolean> => {
    if (!hasPendingMarketingDeepLink()) return false;
    if (marketingDeepLinkBootstrapInFlightRef.current) return false;

    marketingDeepLinkBootstrapInFlightRef.current = true;
    try {
      const ref = navigationRef.current;
      const result = await applyMarketingDeepLinkEscape({
        getActiveRoute: () =>
          getActiveRouteName(ref?.getRootState?.() ?? undefined),
        isNavigatorReady: () => Boolean(ref?.isReady()),
        navigate: (screen, params) => {
          ref?.navigate(screen as never, params as never);
        },
        navigationRef: ref,
        onDeepLinkApplied: markDeepLinkBootstrapComplete,
      });

      if (result === "applied") return true;
      if (result === "guest_login_failed" || result === "no_pending") {
        return false;
      }

      // Navigator not ready yet — stay on Splash, block Onboarding.
      hasAppliedProvisionalRouteRef.current = true;
      pendingRouteRef.current = null;
      return true;
    } finally {
      marketingDeepLinkBootstrapInFlightRef.current = false;
    }
  }, [markDeepLinkBootstrapComplete]);

  /** Keep Splash visible for SPLASH_MIN_MS, then skip onboarding and enter MainTabs. */
  const scheduleMarketingDeepLinkEscape = useCallback(() => {
    const active = getActiveRouteName(
      navigationRef.current?.getRootState?.() ?? undefined
    );
    const onSplash = active === "Splash" || active == null;
    const remaining = Math.max(
      0,
      SPLASH_MIN_MS - (Date.now() - splashStartTimeRef.current)
    );
    const delay = onSplash ? remaining : 0;
    if (delay <= 0) {
      void runMarketingDeepLinkEscape();
      return;
    }
    setTimeout(() => {
      void runMarketingDeepLinkEscape();
    }, delay);
  }, [runMarketingDeepLinkEscape]);

  const flushPendingAuthDeepLink = useCallback(() => {
    const url = pendingAuthDeepLinkUrlRef.current;
    const nav = navigationRef.current;
    if (!url || !nav?.dispatch) return;
    const parsed = parsePasswordResetDeepLink(url);
    if (!parsed) return;
    pendingAuthDeepLinkUrlRef.current = null;
    try {
      // Verify-email OTP screen disabled — open CreateNewPassword when email + code are in the link.
      if (parsed.email && parsed.code) {
        nav.dispatch(
          CommonActions.navigate({
            name: "AuthStack",
            params: {
              screen: "CreateNewPassword",
              params: { email: parsed.email, code: parsed.code },
            },
          })
        );
        return;
      }
      // navigation.dispatch(
      //   CommonActions.navigate({
      //     name: "AuthStack",
      //     params: {
      //       screen: "VerifyEmail",
      //       params: {
      //         email: parsed.email || undefined,
      //         isPasswordReset: true,
      //         ...(parsed.code ? { initialOtp: parsed.code } : {}),
      //       },
      //     },
      //   })
      // );
      nav.dispatch(
        CommonActions.navigate({
          name: "AuthStack",
          params: { screen: "Login" },
        })
      );
    } catch (e) {
      if (__DEV__) {
        console.warn("[AUTH_DEEP_LINK] navigate failed", e);
      }
    }
  }, []);

  const applyRouteRef = useRef(
    (
      route: "Onboarding" | "MainTabs" | "PostAuthOnboarding" | "AuthStack",
      final: boolean
    ) => {
      if (hasAppliedFinalRouteRef.current) return;
      if (hasPendingMarketingDeepLink()) return;
      if (!final && hasAppliedProvisionalRouteRef.current) return;
      if (final) {
        hasAppliedFinalRouteRef.current = true;
      } else {
        hasAppliedProvisionalRouteRef.current = true;
      }
      const nav = NavigationService.getNavigationRef();
      if (nav?.isReady()) {
        NavigationService.reset(route);
        pendingRouteRef.current = null;
      } else {
        pendingRouteRef.current = { route, final };
        // Nav may not be ready yet; onReady might have already fired. Retry so we never stay on Splash.
        const retryDelays = [50, 150, 350, 600];
        retryDelays.forEach((delay, _i) => {
          setTimeout(() => {
            if (pendingRouteRef.current) tryApplyPendingRoute.current();
          }, delay);
        });
      }
    }
  );

  // Start discount timer on first app open (24h on / 24h off cycle)
  useEffect(() => {
    ensureFirstAppOpenAt();
  }, []);

  // Deep links: marketing routes (HTTPS / birdzy://path) + password-reset auth links
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (parsePasswordResetDeepLink(url)) {
        pendingAuthDeepLinkUrlRef.current = url;
        flushPendingAuthDeepLink();
        return;
      }
      if (!isDeepLinkUrl(url)) return;
      deepLinkManager.handle(url);
      scheduleMarketingDeepLinkEscape();
    };

    // Ingest cold-start / deferred link ASAP so splash timeouts don't force Onboarding.
    void ingestInitialMarketingDeepLinkUrl()
      .then((hasPending) => {
        setInitialUrlChecked(true);
        if (hasPending) scheduleMarketingDeepLinkEscape();
      })
      .catch(() => {
        setInitialUrlChecked(true);
      });

    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    Linking.getInitialURL().then(handleUrl);

    const deepLinkSub = DeviceEventEmitter.addListener(
      DEEP_LINK_RECEIVED_EVENT,
      () => {
        scheduleMarketingDeepLinkEscape();
      }
    );

    return () => {
      sub.remove();
      deepLinkSub.remove();
    };
  }, [
    flushPendingAuthDeepLink,
    runMarketingDeepLinkEscape,
    scheduleMarketingDeepLinkEscape,
  ]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!hasPendingMarketingDeepLink()) return;
    scheduleMarketingDeepLinkEscape();
  }, [hasHydrated, isAuthenticated, scheduleMarketingDeepLinkEscape]);

  // Timeout only: after SPLASH_MAX_MS apply provisional Onboarding so user isn't stuck on splash.
  // Wait until getInitialURL resolves so a cold-start link is not beaten by this timeout.
  useEffect(() => {
    if (!initialUrlChecked) return;

    const t = setTimeout(() => {
      if (hasAppliedFinalRouteRef.current) return;
      if (hasPendingMarketingDeepLink()) return;
      if (marketingDeepLinkBootstrapInFlightRef.current) return;
      if (__DEV__) {
        console.log("[AUTH_BOOTSTRAP] route -> Onboarding (timeout)");
      }
      applyRouteRef.current("Onboarding", false);
    }, SPLASH_MAX_MS);
    return () => clearTimeout(t);
  }, [initialUrlChecked]);

  // Hydration fallback: if store never hydrates, after HYDRATION_MAX_MS apply Onboarding (final)
  useEffect(() => {
    if (!initialUrlChecked) return;

    const t = setTimeout(() => {
      if (hasAppliedFinalRouteRef.current) return;
      if (hasPendingMarketingDeepLink()) return;
      if (marketingDeepLinkBootstrapInFlightRef.current) return;
      if (__DEV__) {
        console.log(
          "[AUTH_BOOTSTRAP] route -> Onboarding (hydration fallback)"
        );
      }
      applyRouteRef.current("Onboarding", true);
    }, HYDRATION_MAX_MS);
    return () => clearTimeout(t);
  }, [initialUrlChecked]);

  // Apply final route only after auth + post-auth onboarding stores have rehydrated
  useEffect(() => {
    if (
      !hasHydrated ||
      !postAuthHasHydrated ||
      hasAppliedFinalRouteRef.current
    ) {
      return;
    }

    const BOOT_LOG = "[AUTH_BOOTSTRAP]";
    const log = (...args: any[]) => {
      if (__DEV__) console.log(BOOT_LOG, ...args);
    };

    const elapsed = Date.now() - splashStartTimeRef.current;
    const minSplashMs = SPLASH_MIN_MS;
    const waitMs = Math.max(0, minSplashMs - elapsed);

    const apply = () => {
      if (hasAppliedFinalRouteRef.current) return;
      const { token, isAuthenticated: isAuth } = useAuthStore.getState();
      const hasAuth = typeof token === "string" && token.length > 0 && isAuth;

      const finishBootstrap = (
        nextRoute:
          | "Onboarding"
          | "MainTabs"
          | "PostAuthOnboarding"
          | "AuthStack"
      ) => {
        log("route ->", nextRoute, "(from store after hydration)");
        applyRouteRef.current(nextRoute, true);
        if (hasAuth || nextRoute === "MainTabs") {
          incrementSessionCount().then((count) => {
            analyticsService.logEvent(EVENTS.session_incremented, {
              session_count: count,
            });
            sessionLogger.sessionIncremented(count);
          });
        }
      };

      if (hasPendingMarketingDeepLink()) {
        void (async () => {
          await ingestInitialMarketingDeepLinkUrl();
          const escaped = await runMarketingDeepLinkEscape();
          if (hasAppliedFinalRouteRef.current) return;
          if (escaped) return;

          const nextRoute = await resolveMarketingDeepLinkBootstrapRoute();
          log("route ->", nextRoute, "(marketing deep link fallback)");
          finishBootstrap(nextRoute);
        })();
        return;
      }

      // Logged-out cold start always shows marketing onboarding (not Login).
      // Tapping Login/Skip persists hasCompletedOnboarding; if we honor that flag
      // here, force-quit or delete-account + reopen skips the intro.
      if (!hasAuth) {
        useOnboardingStore.getState().reset();
      }

      const nextRoute:
        | "Onboarding"
        | "MainTabs"
        | "PostAuthOnboarding"
        | "AuthStack" = !hasAuth
        ? "Onboarding"
        : shouldResumePostAuthOnboarding()
        ? "PostAuthOnboarding"
        : "MainTabs";
      finishBootstrap(nextRoute);
    };

    if (waitMs > 0) {
      const t = setTimeout(apply, waitMs);
      return () => clearTimeout(t);
    }
    apply();
    return undefined;
  }, [hasHydrated, postAuthHasHydrated, runMarketingDeepLinkEscape]);

  // Pending backend recovery only (stored payloads — no receipt refresh). Optional one-time restore is gated in restorePurchases.ts.
  useEffect(() => {
    if (!isAuthenticated || hasRestoredPurchasesRef.current) return;
    hasRestoredPurchasesRef.current = true;
    retryPendingPurchases().catch((err) => {
      useAppLogsStore
        .getState()
        .warn("[Subscription] retryPendingPurchases on root launch failed", {
          error: err instanceof Error ? err.message : String(err),
        });
    });
    runAutoRestoreOncePerInstallIfNeeded().catch((err) => {
      useAppLogsStore
        .getState()
        .warn("[Subscription] runAutoRestoreOncePerInstallIfNeeded failed", {
          error: err instanceof Error ? err.message : String(err),
        });
    });
    runAutoUnsubscribeIfNoPurchases().catch((err) => {
      useAppLogsStore
        .getState()
        .warn("[Subscription] runAutoUnsubscribeIfNoPurchases failed", {
          error: err instanceof Error ? err.message : String(err),
        });
    });
  }, [isAuthenticated]);

  // On app foreground: refresh token first, then auth/me (avoids 401 on auth/me when token expired)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          const { isAuthenticated, refreshAuthToken } = useAuthStore.getState();
          if (!isAuthenticated) return;
          // Refresh token first so auth/me and other requests use a fresh token
          refreshAuthToken()
            .then(() => {
              useAuthStore.getState().refreshProfileSilentIfThrottled();
            })
            .catch(() => {
              // Refresh failed (e.g. 401) — logout already done in auth store / interceptor
            });
        }
      }
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Handle notification press events (local notifications via Notifee)
    const unsubscribeForeground = notifee.onForegroundEvent(
      ({ type, detail }) => {
        if (type === EventType.PRESS) {
          handleNotificationPress(detail.notification);
        }
      }
    );

    // Handle background/killed state notification press (local notifications)
    notifee.getInitialNotification().then((initialNotification) => {
      if (initialNotification) {
        handleNotificationPress(initialNotification.notification);
      }
    });

    // Setup FCM push notification handlers (background/killed tap → same navigation as Notifee)
    try {
      const {
        setupBackgroundNotificationHandler,
        setupInitialNotificationHandler,
        setNotificationPressHandler,
      } = require("../services/notifications/pushNotification.service");
      setNotificationPressHandler((data: Record<string, any>) =>
        handleNotificationPress({ data })
      );
      setupBackgroundNotificationHandler();
      setupInitialNotificationHandler();
    } catch (error) {
      // Messaging package may not be installed yet
      if (__DEV__) {
        console.warn("FCM push notification handlers not available:", error);
      }
    }

    // Reminders removed - not needed for rocks/minerals app

    // Check for version updates
    const checkModals = async () => {
      // Check version on app start
      await checkVersion();
    };

    checkModals();

    return () => {
      unsubscribeForeground();
      try {
        const {
          setNotificationPressHandler,
        } = require("../services/notifications/pushNotification.service");
        setNotificationPressHandler(null);
      } catch (_) {}
    };
  }, [checkVersion]);

  // Show version update modal when update is available
  useEffect(() => {
    if (versionInfo?.isUpdateAvailable || versionInfo?.isUpdateRequired) {
      setShowVersionUpdateModal(true);
      analyticsService.logEvent(EVENTS.version_update_modal_shown, {
        is_required: versionInfo?.isUpdateRequired ?? false,
      });
      sessionLogger.modalDecision("version_update", "shown", {
        isRequired: versionInfo?.isUpdateRequired,
      });
    }
  }, [versionInfo]);

  // Show notification permission only after authentication (when HomeScreen requests it). Never before splash or on onboarding/login.
  useEffect(() => {
    if (requestShowNotificationPopup && isAuthenticated) {
      setShowNotificationPermission(true);
      setRequestShowNotificationPopup(false);
    }
  }, [
    requestShowNotificationPopup,
    setRequestShowNotificationPopup,
    isAuthenticated,
  ]);

  // Show location permission when HomeScreen requests it (session flow, after subscription/notification).
  useEffect(() => {
    if (requestShowLocationPopup && isAuthenticated) {
      setShowSessionLocationPermission(true);
      setRequestShowLocationPopup(false);
    }
  }, [requestShowLocationPopup, setRequestShowLocationPopup, isAuthenticated]);

  // Show rate us modal when HomeScreen requests it (2nd session, then every 5 sessions on home focus)
  useEffect(() => {
    if (!requestShowRateUs) return;

    let cancelled = false;
    void shouldShowRateUsModal().then((shouldShow) => {
      if (cancelled) return;
      setRequestShowRateUs(false);
      if (!shouldShow) {
        useAppLogsStore
          .getState()
          .info("[RateUs] Request ignored (session not eligible)");
        return;
      }
      useAppLogsStore
        .getState()
        .info("[RateUs] Modal shown (requested from home)");
      sessionLogger.modalDecision("rate_us", "shown");
      setShowRateUsModal(true);
      markRateUsShown();
      analyticsService.logEvent(EVENTS.rate_us_popup, { action: "shown" });
    });

    return () => {
      cancelled = true;
    };
  }, [requestShowRateUs, setRequestShowRateUs]);

  /**
   * Handle notification press
   * Handles both local notifications (Notifee) and push notifications (FCM)
   */
  const handleNotificationPress = (notification: any) => {
    if (!notification?.data) return;

    try {
      // Handle FCM push notification data structure
      const data = notification.data;
      const notificationType = data.type;

      // Try to get screen from data, or determine from notification type
      let screen = data.screen;
      let params = data.params;

      // If params is a string, parse it
      if (typeof params === "string") {
        try {
          params = JSON.parse(params);
        } catch (e) {
          // If parsing fails, use as-is
        }
      }

      // Navigate based on notification type if screen not specified
      if (!screen && notificationType) {
        switch (notificationType) {
          case "post_liked":
          case "post_commented":
          case "comment_liked":
            screen = "MainTabs";
            params = {
              screen: "Feed",
            };
            break;
          /** Firestore feed notifications (Notifee on Collection focus + future push parity) */
          case "like":
          case "comment":
          case "follow":
          case "subscribe": {
            const postId = data.postId || data.post_id;
            screen = "MainTabs";
            if (
              notificationType === "follow" ||
              notificationType === "subscribe"
            ) {
              params = {
                screen: "Feed",
                params: { screen: "FeedMain" },
              };
            } else if (postId) {
              params = {
                screen: "Feed",
                params: {
                  screen: "PostDetails",
                  params: { postId: String(postId) },
                },
              };
            } else {
              params = {
                screen: "Feed",
                params: { screen: "FeedMain" },
              };
            }
            break;
          }
          case "new_feature":
          case "promotion":
            screen = "MainTabs";
            params = {
              screen: "Home",
            };
            break;
          case "subscription":
            screen = "MainTabs";
            params = {
              screen: "Settings",
            };
            break;
          case "inactivity-reminder":
          case "identification_inactivity":
          case "generic_inactivity":
            // Identification inactivity (2-day/5-day local or push): open Camera/Identify
            screen = "MainTabs";
            params = {
              screen: "Camera",
              params: getIdentificationCameraEntryParams(),
            };
            break;
          case "wishlist_available":
            // Wishlisted mineral available: open wishlist or mineral details if mushroomId provided
            screen = "MainTabs";
            params = data.mushroomId
              ? {
                  screen: "Collection",
                  params: {
                    screen: "BirdDetails",
                    params: {
                      mushroomId: data.mushroomId,
                    },
                  },
                }
              : {
                  screen: "Collection",
                };
            break;
          case "identification_limit_refreshed":
            // Identification limit refreshed: open Camera/Identify
            screen = "MainTabs";
            params = {
              screen: "Camera",
              params: getIdentificationCameraEntryParams(),
            };
            break;
          case "mineral_of_the_day":
          case "mushroom_of_the_day":
          case "rock_of_the_day":
            // Mushroom of the day: open Home (banner/modal). Legacy push types kept for compatibility.
            screen = "MainTabs";
            params = {
              screen: "Home",
            };
            break;
          default:
            // Fallback: open Home
            screen = "MainTabs";
            params = {
              screen: "Home",
            };
        }
      }

      // Navigate to the specified screen (try wired page, if fail open Home)
      if (navigationRef.current && screen) {
        try {
          navigationRef.current.navigate(screen, params);
        } catch (navError) {
          console.warn(
            "Notification navigation failed, opening Home:",
            navError
          );
          // Fallback: open to Home
          navigationRef.current.navigate("MainTabs", {
            screen: "Home",
          });
        }
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
      // Fallback: navigate to Home
      if (navigationRef.current) {
        navigationRef.current.navigate("MainTabs", {
          screen: "Home",
        });
      }
    }
  };

  const sheetRegistry = useMemo(() => getDefaultSheetRegistry(), []);

  const handleNavReady = React.useCallback(() => {
    tryApplyPendingRoute.current();
    flushPendingAuthDeepLink();
    scheduleMarketingDeepLinkEscape();
    // Let the first navigation frame paint before removing the App-level splash overlay (avoids white / branding flash).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onNavigationReady?.();
      });
    });
  }, [
    onNavigationReady,
    flushPendingAuthDeepLink,
    scheduleMarketingDeepLinkEscape,
  ]);

  return (
    <NavigationContainer
      theme={navigationTheme}
      ref={(ref) => {
        navigationRef.current = ref;
        NavigationService.setNavigationRef(ref);
      }}
      onReady={() => {
        handleNavReady();
        setActiveScreen(
          navigationRef.current?.getCurrentRoute()?.name ?? "Splash"
        );
      }}
      onStateChange={(state) => {
        scheduleMarketingDeepLinkEscape();
        if (__DEV__) (console as any).time("RootNavigator.onStateChange");
        const leafName = getLeafFocusedRouteName(state ?? undefined);
        if (!leafName) return;
        setActiveScreen(leafName);
        logPageNavigation(leafName);
        const payload = getScreenEventForState(state ?? undefined);
        const now = Date.now();
        const prevKey = lastScreenEventKeyRef.current;
        if (prevKey && prevKey !== leafName) {
          const prevPayload = getScreenEventForScreenName(prevKey);
          if (prevPayload) {
            const durationSeconds = Math.round(
              (now - lastScreenEnterTimeRef.current) / 1000
            );
            if (durationSeconds > 0) {
              analyticsService.logEvent(EVENTS.time_spent_screen, {
                screen_name: prevPayload.event,
                duration_seconds: String(durationSeconds),
              });
            }
          }
        }
        lastScreenEventKeyRef.current = leafName;
        lastScreenEnterTimeRef.current = now;
        if (payload && leafName !== prevKey) {
          analyticsService.logEvent(payload.event, payload.params);
        }
        if (__DEV__) (console as any).timeEnd("RootNavigator.onStateChange");
      }}
    >
      <BottomSheetProvider registry={sheetRegistry}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 150, // Faster navigation (150ms for instant feel)
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{
              animation: "none", // No animation for splash - instant transition
            }}
          />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{
              animation: "fade",
              animationDuration: 200, // Slightly longer for onboarding for smooth transition
            }}
          />
          <Stack.Screen
            name="PostAuthOnboarding"
            component={PostAuthOnboardingScreen}
            options={{
              animation: "fade",
              animationDuration: 200,
            }}
          />
          <Stack.Screen name="AuthStack" component={AuthStack} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          {/* Modal/Overlay Stacks */}
          <Stack.Screen
            name="SettingsStack"
            component={SettingsStack}
            options={{
              presentation: "card",
              animation: "slide_from_right",
              animationDuration: 300,
            }}
          />
          <Stack.Screen
            name="SubscriptionStack"
            component={SubscriptionStack}
            options={{
              animation: "slide_from_right",
              animationDuration: 300,
            }}
          />
          {/* Utility/Tool Modal Stacks */}
          {/* Plant-specific calculators and light meter removed - not needed for rocks/minerals app */}
          <Stack.Screen
            name="AskAIStack"
            component={AskAIStack}
            options={{
              presentation: "card",
              animation: "slide_from_right",
              animationDuration: 300,
            }}
          />
          <Stack.Screen
            name="BirdPersonalityStack"
            component={BirdPersonalityStack}
            options={{
              presentation: "card",
              animation: "slide_from_right",
              animationDuration: 300,
            }}
          />
        </Stack.Navigator>

        {/* Global Modals */}
        {/* Version Update Modal */}
        {versionInfo && (
          <VersionUpdateModal
            visible={showVersionUpdateModal}
            version={versionInfo.latestVersion}
            isRequired={versionInfo.isUpdateRequired}
            updateNotes={versionInfo.updateNotes || []}
            onUpdate={() => {
              // TODO: Open app store for update
              setShowVersionUpdateModal(false);
            }}
            onClose={() => {
              if (!versionInfo.isUpdateRequired) {
                setShowVersionUpdateModal(false);
              }
            }}
          />
        )}

        {/* Rate Us Modal */}
        <RateUsModal
          visible={showRateUsModal}
          onClose={() => {
            useAppLogsStore
              .getState()
              .info("[RateUs] Modal dismissed (not now)");
            analyticsService.logEvent(EVENTS.user_closes);
            analyticsService.logEvent(EVENTS.rate_us_not_now);
            sessionLogger.modalDecision("rate_us", "dismissed", {
              action: "not_now",
            });
            setShowRateUsModal(false);
            setHasDeclined(true);
          }}
          onLowRating={(rating: number) => {
            useAppLogsStore
              .getState()
              .info("[RateUs] Low rating (1–3), opening feedback", {
                rating,
                source: "home",
              });
            analyticsService.logEvent(EVENTS.rate_1_3, {
              rating: String(rating),
            });
            analyticsService.logEvent(EVENTS.rate_us_feedback, {
              trigger: "low_rating",
            });
            setShowRateUsModal(false);
            setLowRatingFromRateUs(rating);
            setShowFeedbackModal(true);
            analyticsService.logEvent(EVENTS.feedback_popup_opened);
          }}
          onHighRating={async (rating: number) => {
            useAppLogsStore
              .getState()
              .info(
                "[RateUs] High rating (4–5), opening native in-app review",
                {
                  rating,
                  source: "home",
                }
              );
            analyticsService.logEvent(EVENTS.rate_4_5, {
              rating: String(rating),
            });
            analyticsService.logEvent(EVENTS.rate_us_rate_now, { rating });
            sessionLogger.modalDecision("rate_us", "dismissed", {
              action: "rated",
              rating,
            });
            setHasRated(true);
            setShowRateUsModal(false);
            void sendRatingFeedback({
              domain: "Birds",
              message: "",
              rating,
              source: "rate_us",
            }).catch((err) => {
              useAppLogsStore
                .getState()
                .warn("[RateUs] Failed to send high rating to API", {
                  rating,
                  error: err?.message ?? String(err),
                });
            });
            await openAppStoreForRating();
          }}
        />

        {/* Feedback Modal (shown after low rating from Rate Us) */}
        <FeedbackModal
          visible={showFeedbackModal}
          onClose={() => {
            analyticsService.logEvent(EVENTS.feedback_closed);
            setShowFeedbackModal(false);
            setLowRatingFromRateUs(undefined);
          }}
          rating={lowRatingFromRateUs}
          onSubmit={handleFeedbackSubmit}
        />

        {/* Notification Permission – after subscription on home; then location → rate us */}
        <NotificationPermissionPopup
          visible={showNotificationPermission}
          onClose={() => {
            analyticsService.logEvent(EVENTS.permission_closed);
            analyticsService.logEvent(EVENTS.notification_permission_dismissed);
            analyticsService.logEvent(EVENTS.notification_modal_dismissed);
            analyticsService.logEvent(EVENTS.native_permission_closed);
            setShowNotificationPermission(false);
            continueAfterNotificationPopup();
          }}
          onGranted={() => {
            setShowNotificationPermission(false);
            continueAfterNotificationPopup();
          }}
        />

        <SessionLocationPermissionModal
          visible={showSessionLocationPermission}
          onClose={() => {
            setShowSessionLocationPermission(false);
            continueAfterLocationPopup();
          }}
        />
      </BottomSheetProvider>
      <FreeScanLimitHost onUpgrade={navigateToSubscriptionMain} />
    </NavigationContainer>
  );
};
