/**
 * TrackzioMinerals App
 * Main entry point for the application
 */

// Start auth store rehydration as early as possible (so AsyncStorage read begins before RootNavigator mounts)
import './src/features/auth/auth.store';
import { hydrateAppLogsFromStorage, syncAppLogsWithRemoteConfig } from './src/features/app-logs/app-logs.store';

void hydrateAppLogsFromStorage().catch(() => {
  /* preference applied when feature gate allows */
});
import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  InteractionManager,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from './src/app';
import { ToastProvider } from './src/contexts/ToastContext';
import { AppConfigProvider, getDefaultAppConfig } from './src/config';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreenContent } from './src/app/SplashScreen';
import { AlertModal } from './src/components/AlertModal';
import { initializeFirebase } from './src/lib/firebase';
import { initializeNotificationService } from './src/services/notifications';
import { usePushNotifications } from './src/hooks/usePushNotifications';
// Plant reminder notifications removed - not needed for rocks/minerals app
import {
  analyticsService,
  EVENTS,
} from './src/services/analytics/analytics.service';
import { performanceService } from './src/services/performance/performance.service';
import { socialLoginService, logGoogleSignInStartupDiagnostics, logSocialAuthStartupDiagnostics } from './src/services/auth/socialLogin.service';
import { GOOGLE_WEB_CLIENT_ID } from './src/constants/env';
import { useAppLogsStore } from './src/features/app-logs/app-logs.store';
import { initDiscountOfferFirstOpen } from './src/features/subscription/utils/discountOffer';
import { APP_COLORS } from './src/config/colors';
import { initAttribution } from './src/services/attribution';
import { initializeFacebookSdkIfConfigured } from './src/services/facebook/facebookSdk';
import { warmBundledImageCache } from './src/imagePipeline';

// Get app config - can be changed based on environment or build config
// For now, using default (plants). In production, this could come from:
// - Environment variable
// - Build configuration
// - Remote config
// - User selection
const appConfig = getDefaultAppConfig();

function App(): React.JSX.Element {
  // Initialize discount offer (first-app-open timestamp) before rendering navigation
  // so pack selection (half vs full) and timer are correct with no race.
  const [discountReady, setDiscountReady] = useState(false);
  /**
   * Theme experiment must resolve before themed UI / navigation mounts
   * to avoid Variant B Dark→Light flicker on cold start.
   */
  const [themeReady, setThemeReady] = useState(false);
  /** Hide JS splash only after NavigationContainer has painted (avoids flash between bootstrap and first screen). */
  const [navigationReady, setNavigationReady] = useState(false);
  useEffect(() => {
    initDiscountOfferFirstOpen().then(() => setDiscountReady(true));
    warmBundledImageCache();
  }, []);

  // Resolve theme_default before any themed screen paints
  useEffect(() => {
    let cancelled = false;

    const bootstrapTheme = async () => {
      try {
        await initializeFirebase();
        const {
          initializeRemoteConfig,
        } = require('./src/services/remoteConfig');
        await initializeRemoteConfig({ awaitFirstFetchIfNoCache: false });
        const {
          initializeThemeExperiment,
        } = require('./src/features/theme/themeExperiment.service');
        await initializeThemeExperiment({ refreshIfStale: false });
        void syncAppLogsWithRemoteConfig();
      } catch (error) {
        if (__DEV__) {
          console.warn('Theme bootstrap failed; continuing with defaults:', error);
        }
        void syncAppLogsWithRemoteConfig();
      } finally {
        if (!cancelled) {
          setThemeReady(true);
        }
      }
    };

    bootstrapTheme();
    return () => {
      cancelled = true;
    };
  }, []);

  // Android Play install referrer → cache + Firebase (non-blocking)
  useEffect(() => {
    initializeFacebookSdkIfConfigured();

    if (Platform.OS === 'android') {
      initAttribution();
    }
  }, []);
  useEffect(() => {
    if (!discountReady || !themeReady) {
      setNavigationReady(false);
    }
  }, [discountReady, themeReady]);

  // Initialize push notifications (device registration)
  usePushNotifications();

  const appStateRef = useRef<string>(AppState.currentState);
  const sessionStartTimeRef = useRef<number>(
    AppState.currentState === 'active' ? Date.now() : 0,
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active') {
        if (prevState !== 'active') {
          sessionStartTimeRef.current = Date.now();
          analyticsService.logEvent(EVENTS.app_session_start);
        }
      } else if (nextState === 'background' || nextState === 'inactive') {
        if (prevState === 'active' && sessionStartTimeRef.current > 0) {
          const durationSeconds = Math.round(
            (Date.now() - sessionStartTimeRef.current) / 1000,
          );
          analyticsService.logEvent(EVENTS.session_end, {
            session_duration_seconds: String(durationSeconds),
          });
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Use InteractionManager to defer heavy initialization until after initial render
    // This improves app startup performance, especially on Android
    const interaction = InteractionManager.runAfterInteractions(() => {
      // Initialize notification service (doesn't depend on Firebase)
      initializeNotificationService().catch(error => {
        if (__DEV__) {
          console.error('Failed to initialize notification service:', error);
        }
      });

      // Load subscription packs from SUBSCRIPTION_VALUE (planId = productId)
      const {
        loadSubscriptionPlans,
      } = require('./src/data/subscription/subscriptionPlansLoader');
      loadSubscriptionPlans().catch(() => {
        // Fallback plans used; no need to surface
      });

      // Discount offer is initialized at app start (before navigation) so no duplicate init here.

      // Plant reminder notifications removed - not needed for rocks/minerals app

      // Initialize Firebase first, then other services
      // All services now check Firebase readiness internally - no delays needed
      initializeFirebase()
        .then(() => {
          // Initialize Remote Config in background (non-blocking – app uses defaults until ready)
          const {
            initializeRemoteConfig,
          } = require('./src/services/remoteConfig');
          initializeRemoteConfig({ awaitFirstFetchIfNoCache: false })
            .then(() => {
              void syncAppLogsWithRemoteConfig();
            })
            .catch((error: unknown) => {
            if (__DEV__) {
              console.warn('Failed to initialize Remote Config:', error);
            }
            void syncAppLogsWithRemoteConfig();
          });

          // Initialize analytics service (checks Firebase readiness internally)
          Promise.resolve().then(() => {
            analyticsService.initialize();
          });

          // Initialize performance monitoring (checks Firebase readiness internally)
          Promise.resolve().then(() => {
            performanceService.initialize().catch(error => {
              if (__DEV__) {
                console.error(
                  'Failed to initialize performance monitoring:',
                  error,
                );
              }
            });
          });

          // Complete app launch trace after initialization
          // Use requestAnimationFrame for next frame instead of setTimeout
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              performanceService.completeAppLaunchTrace().catch(() => {
                // Silently fail
              });
            });
          });
        })
        .catch(error => {
          if (__DEV__) {
            console.error('Failed to initialize Firebase:', error);
          }
        });

      // Initialize session service
      const { initializeSessionService } = require('./src/services/session');
      initializeSessionService();

      // Initialize Google Sign-In with Web Client ID (required before any sign-in)
      const hasGoogleWebClientId = !!GOOGLE_WEB_CLIENT_ID?.trim();
      if (hasGoogleWebClientId) {
        socialLoginService.configure(GOOGLE_WEB_CLIENT_ID!);
        logGoogleSignInStartupDiagnostics();
      } else {
        useAppLogsStore.getState().error(
          '[AUTH] Google: GOOGLE_WEB_CLIENT_ID missing at app startup',
          {
            buildMode: __DEV__ ? 'debug' : 'release',
            fix: 'Run npm run env:prod before release build.',
          },
        );
        if (__DEV__) {
          console.warn(
            '[AUTH] Google: GOOGLE_WEB_CLIENT_ID is not set. Add it to .env for Google Sign-In.',
          );
        }
      }
      logSocialAuthStartupDiagnostics();

      // Initialize background tasks for cache refresh
      const {
        initializeBackgroundTasks,
      } = require('./src/services/background');
      initializeBackgroundTasks();
    });

    // Refresh remote config when app comes to foreground (respects 1hr TTL inside refreshRemoteConfig)
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        const { refreshRemoteConfig } = require('./src/services/remoteConfig');
        refreshRemoteConfig().then(() => {
          const {
            applyThemeExperimentFromRemoteConfig,
          } = require('./src/features/theme/themeExperiment.service');
          applyThemeExperimentFromRemoteConfig();
        });
      }
    });

    return () => {
      subscription?.remove();
      interaction.cancel();
      // Stop background tasks on unmount
      const { stopBackgroundTasks } = require('./src/services/background');
      stopBackgroundTasks();
    };
  }, []);

  const appBootstrapReady = discountReady && themeReady;
  const showSplash = !appBootstrapReady || !navigationReady;

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: APP_COLORS.splashBackground }}
    >
      <SafeAreaProvider
        style={{ flex: 1, backgroundColor: APP_COLORS.splashBackground }}
      >
        <BottomSheetModalProvider>
          <AppConfigProvider config={appConfig}>
            <ThemeProvider>
              <ToastProvider>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: APP_COLORS.splashBackground,
                  }}
                >
                  {appBootstrapReady ? (
                    <>
                      <RootNavigator
                        onNavigationReady={() => setNavigationReady(true)}
                      />
                      <AlertModal />
                    </>
                  ) : null}
                  {showSplash && (
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        {
                          zIndex: 99999,
                          elevation: 99999,
                        },
                      ]}
                      pointerEvents="auto"
                    >
                      <SplashScreenContent />
                    </View>
                  )}
                </View>
              </ToastProvider>
            </ThemeProvider>
          </AppConfigProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
