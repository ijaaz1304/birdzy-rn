/**
 * Single analytics service (root level only).
 * ALL Firebase Analytics calls live only in this file.
 * Exports a single logEvent(eventName, params?) and builds common context inside.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseAnalytics, firebaseCrashlytics } from "../../lib/firebase";
import { useAuthStore } from "../../features/auth/auth.store";
import { useAppLogsStore } from "../../features/app-logs/app-logs.store";
import { EVENTS } from "./analytics.events";
import { logMetaEvent } from "./metaLogger";
import { getDeviceRegionCode } from "../../features/subscription/utils/iapPriceDisplay";

const FIRST_OPEN_KEY = "@analytics_first_open_done";
const FIRST_OPEN_DATE_KEY = "@analytics_first_open_date";
const APP_OPEN_DAY_SENT_KEY = "@analytics_app_open_day_sent";

export { EVENTS } from "./analytics.events";
export type { AnalyticsEventName } from "./analytics.events";

function normalizeCountry(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const v = value.trim();
  if (!v) return "unknown";
  const low = v.toLowerCase();
  if (low === "undefined" || low === "null" || low === "unknown") {
    return "unknown";
  }
  return v;
}

function getDeviceCountryFallback(): string {
  try {
    // DeviceInfo.getDeviceCountry() removed in react-native-device-info v15.
    return getDeviceRegionCode() ?? "unknown";
  } catch {
    return "unknown";
  }
}

function getCommonContext(): Record<string, string> {
  const now = new Date();
  const user = useAuthStore.getState().user;
  const countryFromUser = normalizeCountry(user?.country);
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toISOString(),
    user_id: user?.id ?? "anonymous",
    country:
      countryFromUser !== "unknown"
        ? countryFromUser
        : getDeviceCountryFallback(),
    platform: Platform.OS,
  };
}

class AnalyticsService {
  private isEnabled = true;
  private getMetaPlanType(params?: Record<string, any>): string {
    const raw = String(
      params?.plan_type ?? params?.plan_id ?? params?.product_id ?? ""
    ).toLowerCase();
    if (raw.includes("lifetime")) return "lifetime";
    if (raw.includes("year")) return "yearly";
    if (raw.includes("month")) return "monthly";
    return "monthly";
  }
  private logMetaEventFromAnalytics(
    eventName: string,
    params?: Record<string, any>
  ): void {
    if (eventName === EVENTS.first_open) {
      logMetaEvent("first_open");
      return;
    }

    if (
      eventName === EVENTS.unified_auth_success &&
      String(params?.auth_action ?? "").toLowerCase() === "signup"
    ) {
      logMetaEvent("signup_success");
      return;
    }

    if (
      eventName === EVENTS.guest_signup_success ||
      (eventName === EVENTS.login &&
        String(params?.type_of_login ?? "").toLowerCase() === "guest")
    ) {
      logMetaEvent("guest_login");
      return;
    }

    if (eventName === EVENTS.identify_image_captured) {
      logMetaEvent("photo_captured");
      return;
    }

    if (
      eventName === EVENTS.trial_purchase ||
      eventName === EVENTS.trial_started
    ) {
      logMetaEvent("trial_availed");
      return;
    }

    if (eventName === EVENTS.paid_purchase) {
      const valueNum = Number(params?.value);
      logMetaEvent("subscription_purchase", {
        value: Number.isFinite(valueNum) ? valueNum : 0,
        currency: String(params?.currency || "INR"),
        plan_type: this.getMetaPlanType(params),
      });
    }
  }
  private sanitizeUserProperties(
    properties: Record<string, any>
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    Object.entries(properties).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) sanitized[key] = trimmed;
        return;
      }
      sanitized[key] = String(value);
    });
    return sanitized;
  }

  async initialize() {
    try {
      const { user } = useAuthStore.getState();
      if (user) {
        this.setUserId(user.id);
        this.setUserProperties({
          email: user.email,
          is_subscribed: user.isSubscribed,
          subscription_provider: user.subscriptionProvider,
          is_guest: user.isGuest,
        });
      }
      try {
        this.logEvent(EVENTS.app_open);
        if (Platform.OS === "android") {
          this.logEvent(EVENTS.app_open_android);
        }
        const firstOpenDone = await AsyncStorage.getItem(FIRST_OPEN_KEY);
        if (!firstOpenDone) {
          this.logEvent(EVENTS.first_open);
          this.logEvent(EVENTS.app_first_open);
          await AsyncStorage.setItem(FIRST_OPEN_KEY, "1");
          await AsyncStorage.setItem(
            FIRST_OPEN_DATE_KEY,
            new Date().toISOString().slice(0, 10)
          );
        } else {
          const firstDateStr = await AsyncStorage.getItem(FIRST_OPEN_DATE_KEY);
          const sentStr = await AsyncStorage.getItem(APP_OPEN_DAY_SENT_KEY);
          if (firstDateStr) {
            const firstDate = new Date(firstDateStr);
            const now = new Date();
            const daysSince = Math.floor(
              (now.getTime() - firstDate.getTime()) / 86400000
            );
            const sent = sentStr
              ? (() => {
                  try {
                    return JSON.parse(sentStr);
                  } catch {
                    return {};
                  }
                })()
              : {};
            if (daysSince >= 1 && !sent.day1) {
              this.logEvent(EVENTS.app_open_day_1);
              await AsyncStorage.setItem(
                APP_OPEN_DAY_SENT_KEY,
                JSON.stringify({ ...sent, day1: true })
              );
            }
            if (daysSince >= 7 && !sent.day7) {
              this.logEvent(EVENTS.app_open_day_7);
              await AsyncStorage.setItem(
                APP_OPEN_DAY_SENT_KEY,
                JSON.stringify({ ...sent, day7: true })
              );
            }
            if (daysSince >= 30 && !sent.day30) {
              this.logEvent(EVENTS.app_open_day_30);
              await AsyncStorage.setItem(
                APP_OPEN_DAY_SENT_KEY,
                JSON.stringify({ ...sent, day30: true })
              );
            }
          }
        }
      } catch {
        // Firebase may not be ready yet
      }
    } catch (error) {
      if (__DEV__) {
        useAppLogsStore.getState().error("Analytics initialization error", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  setUserId(userId: string | null) {
    try {
      firebaseAnalytics.setUserId(userId);
      firebaseCrashlytics.setUserId(userId || "");
    } catch (error) {
      useAppLogsStore.getState().error("Error setting user ID", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  setUserProperties(properties: Record<string, any>) {
    try {
      const sanitizedProperties = this.sanitizeUserProperties(properties);
      firebaseAnalytics.setUserProperties(sanitizedProperties);
      Object.entries(sanitizedProperties).forEach(([key, value]) => {
        firebaseCrashlytics.setAttribute(key, String(value));
      });
    } catch (error) {
      useAppLogsStore.getState().error("Error setting user properties", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Log event. Fire-and-forget (no await). Merges common context with params.
   */
  logEvent(eventName: string, params?: Record<string, any>) {
    const isPaidPurchaseRevenue =
      eventName === EVENTS.paid_purchase ||
      eventName === EVENTS.paid_purchase_ga4;
    const isAuthSignupEvent =
      eventName === EVENTS.unified_auth_success ||
      eventName === EVENTS.signup_success;

    if (!this.isEnabled) {
      if (isPaidPurchaseRevenue) {
        useAppLogsStore
          .getState()
          .warn(
            "[IAP PaidPurchase] SKIP: analyticsService disabled (setEnabled false)",
            { eventName }
          );
      } else if (isAuthSignupEvent) {
        useAppLogsStore
          .getState()
          .warn(
            "[AUTH Signup] SKIP: analyticsService disabled (setEnabled false)",
            { eventName }
          );
      }
      return;
    }

    try {
      const common = getCommonContext();
      const eventParams = { ...common, ...params };
      if (isPaidPurchaseRevenue) {
        useAppLogsStore
          .getState()
          .info(
            "[IAP PaidPurchase] 07_firebase analyticsService → native logEvent",
            {
              eventName,
              transaction_id: eventParams?.transaction_id,
              value: eventParams?.value,
              currency: eventParams?.currency,
              note: "If this line is missing, steps 01–06 never reached paid_purchase dispatch.",
            }
          );
        useAppLogsStore.getState().info("[Firebase] Sending event", {
          eventName,
          eventParams,
        });
      } else if (isAuthSignupEvent) {
        useAppLogsStore.getState().info("[AUTH Signup] Firebase dispatch", {
          eventName,
          auth_action: eventParams?.auth_action,
          method: eventParams?.method,
          auth_entry_point: eventParams?.auth_entry_point,
          id: eventParams?.id,
        });
        useAppLogsStore.getState().info("[Firebase] Sending event", {
          eventName,
          eventParams,
        });
      } else if (__DEV__) {
        useAppLogsStore.getState().debug("[Firebase] Sending event", {
          eventName,
          eventParams,
        });
      }
      try {
        const pending = firebaseAnalytics.logEvent(eventName, eventParams) as
          | Promise<void>
          | undefined;
        if (pending && typeof pending.then === "function") {
          void pending.then(
            () => {
              if (isPaidPurchaseRevenue) {
                useAppLogsStore
                  .getState()
                  .info(
                    "[IAP PaidPurchase] 08_firebase SDK resolved logEvent",
                    { eventName }
                  );
                useAppLogsStore.getState().info("[Firebase] Success", {
                  eventName,
                });
              } else if (isAuthSignupEvent) {
                useAppLogsStore
                  .getState()
                  .info("[AUTH Signup] Firebase success", {
                    eventName,
                  });
              }
            },
            (e: unknown) =>
              useAppLogsStore.getState().error("[Firebase] Error", {
                eventName,
                error: e instanceof Error ? e.message : String(e),
              })
          );
        } else if (isPaidPurchaseRevenue || isAuthSignupEvent) {
          useAppLogsStore
            .getState()
            .warn(
              "[Firebase] logEvent did not return a promise (skipped or init failed?)",
              { eventName }
            );
        }
      } catch (e) {
        useAppLogsStore.getState().error("[Firebase] Error", {
          eventName,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      this.logMetaEventFromAnalytics(eventName, params);
    } catch (error) {
      useAppLogsStore.getState().error("Error logging event", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logScreenView(screenName: string, params?: Record<string, any>) {
    this.logEvent(EVENTS.screen_view, { screen_name: screenName, ...params });
  }

  logError(error: Error, context?: Record<string, any>) {
    try {
      firebaseCrashlytics.recordError(error, error.name);
      this.logEvent(EVENTS.error_occurred, {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        ...context,
      });
    } catch (err) {
      useAppLogsStore.getState().error("Error logging error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logApiError(endpoint: string, error: any, context?: Record<string, any>) {
    try {
      this.logEvent(EVENTS.api_error, {
        endpoint,
        error_message: error?.message || "Unknown error",
        error_code: error?.code,
        ...context,
      });
    } catch (err) {
      useAppLogsStore.getState().error("Error logging API error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Log a feature-level error (feature_name, error_code, error_message).
   */
  logFeatureError(
    featureName: string,
    errorCode: string,
    errorMessage: string
  ) {
    this.logEvent(EVENTS.feature_error, {
      feature_name: featureName,
      error_code: errorCode,
      error_message: errorMessage,
    });
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      firebaseAnalytics.setAnalyticsCollectionEnabled(enabled);
    } catch (error) {
      useAppLogsStore.getState().error("Error setting analytics enabled", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  reset() {
    try {
      firebaseAnalytics.resetAnalyticsData();
      this.setUserId(null);
    } catch (error) {
      useAppLogsStore.getState().error("Error resetting analytics", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const analyticsService = new AnalyticsService();
