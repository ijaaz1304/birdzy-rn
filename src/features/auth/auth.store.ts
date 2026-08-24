/**
 * Authentication store using Zustand
 * Complete implementation with all auth flows
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "./services/auth.service";
import {
  SignupRequest,
  SocialLoginRequest,
  UpdateProfileRequest,
  GoogleSubscriptionRequest,
  AppleSubscriptionRequest,
  ParseGooglePurchaseTokenRequest,
  ParsePurchaseTokenResponse,
} from "../../services/api/features/auth.api.types";
import { refreshNotificationService } from "../../services/notifications/notification.service";
import { AUTH_STRINGS } from "../../config/strings/auth.strings";
import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";
import { useAppLogsStore } from "../app-logs/app-logs.store";
import {
  APPLE_SUBSCRIPTIONS_DISABLED_MESSAGE,
  isAppleSubscriptionsEnabled,
} from "../subscription/appleSubscriptionsFeature";
import {
  APPLE_LOGIN_DISABLED_MESSAGE,
  isAppleLoginEnabled,
} from "./appleLoginFeature";

const APP_LOGS_TOOLTIP_ELIGIBLE_KEY = "app_logs_tooltip_eligible_signup";

const UNIFIED_AUTH_SOURCE = "onboarding_unified";

/**
 * Social API should return `isSignup: true` for new accounts and `false` for returning users.
 * If the field is omitted, we still emit signup analytics (common backend gap); only explicit
 * `false` is treated as login-only.
 */
function isSocialSignupForAnalytics(isSignup: boolean | undefined): boolean {
  return isSignup !== false;
}

/** Which UI started this signup (Login vs Sign up vs email form). */
export type AuthSignupEntryPoint =
  | "login_google"
  | "signup_google"
  | "login_apple"
  | "signup_apple"
  | "signup_email";

function emitSignupAnalytics(params: {
  full_name: string;
  guest_id: string;
  auth_action: "signup";
  method: "email" | "google" | "apple";
  source: string;
  id: string;
  email: string;
  auth_entry_point: AuthSignupEntryPoint;
}): void {
  useAppLogsStore.getState().info("[AUTH Signup] emitSignupAnalytics", {
    eventNames: [EVENTS.unified_auth_success, EVENTS.signup_success],
    method: params.method,
    auth_entry_point: params.auth_entry_point,
    id: params.id,
    email: params.email,
  });
  const { auth_entry_point, ...rest } = params;
          analyticsService.logEvent(EVENTS.unified_auth_success, {
    ...rest,
    auth_entry_point,
  });
  analyticsService.logEvent(EVENTS.signup_success, {
    method: params.method,
    auth_action: "signup",
    source: params.source,
    id: params.id,
    email: params.email,
    full_name: params.full_name,
    auth_entry_point,
  });
  analyticsService.logEvent(EVENTS.registration, {
    method: params.method,
    id: params.id,
    email: params.email,
  });
}

function displayNameForAnalytics(user: User | null): string {
  if (!user) return "";
  const n = user.name?.trim();
  if (n) return n;
  const e = user.email?.trim();
  return e ?? "";
}

/**
 * Complete User interface matching backend structure
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  age?: number;
  country?: string;
  isActive: boolean;
  isSocial: boolean;
  socialProvider: string | null;
  isGuest: boolean;
  isSubscribed: boolean;
  isRewarded: boolean;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  subscriptionDate: string | null;
  subscriptionProvider: string | null;
  hasUsedTrial: boolean;
  createdAt: string;
  updatedAt: string;
  ftueCompletion?: {
    HOME_FTUE_SHOWN?: boolean;
    TASK_FTUE_SHOWN?: boolean;
    HABIT_CREATE_FTUE_SHOWN?: boolean;
    STATS_FTUE_SHOWN?: boolean;
    HABIT_DETAILS_FTUE_SHOWN?: boolean;
  };
  successfulReferralCount?: number;
  sellerDetails?: {
    name: string;
    contactEmail: string;
    externalLinks: string[];
    location: string;
    phoneNumber: string;
    bio: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  guestId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Set to true when persist has rehydrated from storage. Use to avoid showing auth stack before hydration. */
  _hasHydrated: boolean;

  // Actions - Email/Password
  signup: (data: SignupRequest) => Promise<void>;
  login: (handle: string, password: string) => Promise<void>;

  // Actions - Social Login (optional entryPoint: which screen — Login vs Sign up — for analytics)
  socialLoginGoogle: (
    data: SocialLoginRequest,
    options?: { entryPoint: "login" | "signup" }
  ) => Promise<{ isSignup: boolean }>;
  socialLoginApple: (
    data: SocialLoginRequest,
    options?: { entryPoint: "login" | "signup" }
  ) => Promise<{ isSignup: boolean }>;

  // Actions - Guest
  guestLogin: (
    guestId?: string
  ) => Promise<{ isFirstTime: boolean; isSubscribed: boolean }>;

  // Actions - Password Reset
  forgotPassword: (handle: string) => Promise<void>;
  resetPassword: (
    token: string,
    password: string,
    email: string
  ) => Promise<void>;

  // Actions - Profile
  getProfile: () => Promise<void>;
  /** Refresh user from API without loading state. Updates last-activity on backend. */
  refreshProfileSilent: () => Promise<void>;
  /** Call refresh only if last call was ≥1 hour ago (for foreground/home). Use after /device and post-login schedule for first 3 calls. */
  refreshProfileSilentIfThrottled: () => Promise<void>;
  /** After login/signup: schedule auth/me at 5min and 10min (first call is after /device). Then hourly via throttle. */
  schedulePostLoginProfileRefresh: () => void;
  cancelPostLoginProfileRefresh: () => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  deleteProfile: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;

  // Actions - Referrals
  getReferrals: () => Promise<any>;
  useReferralCode: (code: string) => Promise<any>;

  // Actions - Subscriptions
  subscribeGoogle: (data: GoogleSubscriptionRequest) => Promise<any>;
  unsubscribeGoogle: (removeLifetimePurchase?: boolean) => Promise<void>;
  subscribeApple: (data: AppleSubscriptionRequest) => Promise<any>;
  unsubscribeApple: () => Promise<void>;
  /** POST /auth/parse-google-purchasetoken — debug/validation only, no DB side effects */
  parseGooglePurchaseToken: (
    data: ParseGooglePurchaseTokenRequest
  ) => Promise<ParsePurchaseTokenResponse>;

  // Actions - Token
  refreshAuthToken: () => Promise<string>;

  // Actions - State Management
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setGuestId: (guestId: string | null) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  reset: () => void;
  /** Internal: clear all session and AsyncStorage (used by logout and deleteProfile). */
  _clearAllSessionAndStorage: () => Promise<void>;
}

/**
 * After IAP / restore updates entitlement on the backend, exchange the current session for a
 * fresh JWT (guest-login for guests, refresh-auth-token for signed-in users). Non-fatal if the
 * network fails — we still proceed with getProfile using the existing token.
 */
async function refreshAuthTokenAfterEntitlementChange(
  get: () => AuthState
): Promise<void> {
  try {
    await get().refreshAuthToken();
  } catch (err) {
    useAppLogsStore
      .getState()
      .warn(
        "[AUTH] refreshAuthToken after subscription change failed (non-fatal)",
        {
          error: err instanceof Error ? err.message : String(err),
        }
      );
  }
}

/** Timeouts for post-login auth/me schedule (5min, 10min). First call is after /device. Cleared on logout. */
let postLoginRefreshTimeouts: ReturnType<typeof setTimeout>[] = [];

/** Last time we called refreshProfileSilent (for last-activity). Used to throttle to once per hour from foreground/home. */
let lastProfileRefreshAt = 0;
const PROFILE_REFRESH_THROTTLE_MS = 60 * 60 * 1000; // 1 hour

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      guestId: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Signup
      signup: async (data: SignupRequest) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.signup(data);
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          // Clear guest ID if user was promoted from guest
          if (data.guestId) {
            set({ guestId: null });
          }
          get().schedulePostLoginProfileRefresh();
          emitSignupAnalytics({
            full_name:
              displayNameForAnalytics(result.user) || result.user.email || "",
            guest_id: data.guestId ?? "",
            auth_action: "signup",
            method: "email",
            source: UNIFIED_AUTH_SOURCE,
            id: result.user.id,
            email: result.user.email ?? "",
            auth_entry_point: "signup_email",
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.signupFailed,
          });
          analyticsService.logEvent(EVENTS.registration_failed, {
            method: "email",
            error_message: error?.message || "signup_failed",
          });
          throw error;
        }
      },

      // Login
      login: async (handle: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.login(handle, password);
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          // Filterable debug log (does not print token)

          console.log("[AUTH_STORE]", "login success", {
            hasToken:
              typeof result.token === "string" && result.token.length > 0,
            tokenLen:
              typeof result.token === "string" ? result.token.length : null,
            tokenLast4:
              typeof result.token === "string" ? result.token.slice(-4) : null,
            userId: result.user?.id,
          });
          await AsyncStorage.setItem(APP_LOGS_TOOLTIP_ELIGIBLE_KEY, "true");
          get().schedulePostLoginProfileRefresh();
          analyticsService.logEvent(EVENTS.login, { type_of_login: "email" });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.loginFailed,
          });
          analyticsService.logEvent(EVENTS.login_failed, {
            type_of_login: "email",
            error_message: error?.message || "login_failed",
          });
          throw error;
        }
      },

      // Social Login Google
      socialLoginGoogle: async (
        data: SocialLoginRequest,
        options?: { entryPoint: "login" | "signup" }
      ) => {
        const entryPoint = options?.entryPoint ?? "signup";
        const authEntryGoogle: AuthSignupEntryPoint =
          entryPoint === "login" ? "login_google" : "signup_google";
        set({ isLoading: true, error: null });
        try {
          const result = await authService.socialLoginGoogle(data);
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          // Clear guest ID if user was promoted from guest
          if (data.guestId) {
            set({ guestId: null });
          }
          get().schedulePostLoginProfileRefresh();
          if (result.isSignup === undefined) {
            useAppLogsStore
              .getState()
              .info(
                "[AUTH Analytics] Google social: isSignup missing in API — using signup analytics path",
                { hasIsSignupField: false }
              );
          }
          if (isSocialSignupForAnalytics(result.isSignup)) {
            emitSignupAnalytics({
              full_name:
                displayNameForAnalytics(result.user) || result.user.email || "",
              guest_id: data.guestId ?? "",
              auth_action: "signup",
              method: "google",
              source: UNIFIED_AUTH_SOURCE,
              id: result.user.id,
              email: result.user.email ?? "",
              auth_entry_point: authEntryGoogle,
            });
          } else {
            useAppLogsStore
              .getState()
              .info("[AUTH Signup] skip signup events for social login", {
                provider: "google",
                reason: "result.isSignup === false",
                auth_entry_point: authEntryGoogle,
                id: result.user.id,
              });
            analyticsService.logEvent(EVENTS.login, {
              type_of_login: "sso",
              auth_entry_point:
                entryPoint === "login" ? "login_google" : "signup_google",
            });
          }
          return {
            isSignup:
              result.isSignup ?? isSocialSignupForAnalytics(result.isSignup),
          };
        } catch (error: any) {
          useAppLogsStore.getState().error("[AUTH] Google signup/login store: failed", {
            message: error?.message ?? String(error),
            auth_entry_point: authEntryGoogle,
            guestId: data.guestId ?? null,
          });
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.googleLoginFailed,
          });
          analyticsService.logEvent(
            entryPoint === "login" ? EVENTS.login_failed : EVENTS.registration_failed,
            {
              type_of_login: "google",
              method: "google",
              error_message: error?.message || "google_auth_failed",
            }
          );
          throw error;
        }
      },

      // Social Login Apple
      socialLoginApple: async (
        data: SocialLoginRequest,
        options?: { entryPoint: "login" | "signup" }
      ) => {
        if (!isAppleLoginEnabled()) {
          useAppLogsStore
            .getState()
            .info("[AUTH] socialLoginApple blocked (not iOS)");
          throw new Error(APPLE_LOGIN_DISABLED_MESSAGE);
        }
        const entryPoint = options?.entryPoint ?? "signup";
        const authEntryApple: AuthSignupEntryPoint =
          entryPoint === "login" ? "login_apple" : "signup_apple";
        set({ isLoading: true, error: null });
        try {
          const result = await authService.socialLoginApple(data);
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          // Clear guest ID if user was promoted from guest
          if (data.guestId) {
            set({ guestId: null });
          }
          get().schedulePostLoginProfileRefresh();
          if (result.isSignup === undefined) {
            useAppLogsStore
              .getState()
              .info(
                "[AUTH Analytics] Apple social: isSignup missing in API — using signup analytics path",
                { hasIsSignupField: false }
              );
          }
          if (isSocialSignupForAnalytics(result.isSignup)) {
            emitSignupAnalytics({
              full_name:
                displayNameForAnalytics(result.user) || result.user.email || "",
              guest_id: data.guestId ?? "",
              auth_action: "signup",
              method: "apple",
              source: UNIFIED_AUTH_SOURCE,
              id: result.user.id,
              email: result.user.email ?? "",
              auth_entry_point: authEntryApple,
            });
          } else {
            useAppLogsStore
              .getState()
              .info("[AUTH Signup] skip signup events for social login", {
                provider: "apple",
                reason: "result.isSignup === false",
                auth_entry_point: authEntryApple,
                id: result.user.id,
              });
            analyticsService.logEvent(EVENTS.login, {
              type_of_login: "sso",
              auth_entry_point:
                entryPoint === "login" ? "login_apple" : "signup_apple",
            });
          }
          return {
            isSignup:
              result.isSignup ?? isSocialSignupForAnalytics(result.isSignup),
          };
        } catch (error: any) {
          useAppLogsStore.getState().error("[AUTH] Apple signup/login store: failed", {
            message: error?.message ?? String(error),
            auth_entry_point: authEntryApple,
            guestId: data.guestId ?? null,
          });
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.appleLoginFailed,
          });
          analyticsService.logEvent(
            entryPoint === "login" ? EVENTS.login_failed : EVENTS.registration_failed,
            {
              type_of_login: "apple",
              method: "apple",
              error_message: error?.message || "apple_auth_failed",
            }
          );
          throw error;
        }
      },

      // Guest Login
      guestLogin: async (guestId?: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.guestLogin(
            guestId || get().guestId || undefined
          );
          set({
            user: result.user,
            token: result.token,
            guestId: result.guestId,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          await AsyncStorage.setItem(APP_LOGS_TOOLTIP_ELIGIBLE_KEY, "true");
          // Always log guest_signup_success on successful guest auth (login, sign-up, onboarding).
          // is_first_time is for GA4/BQ segmentation; do not gate the event on it (backend flag was under-counting).
          analyticsService.logEvent(EVENTS.guest_login, {
            guest_id: result.guestId,
            is_first_time: String(result.isFirstTime),
          });
          analyticsService.logEvent(EVENTS.login, { type_of_login: "guest" });
          analyticsService.logEvent(EVENTS.guest_signup_success, {
            full_name: displayNameForAnalytics(result.user) || "Guest_User",
            guest_id: result.guestId,
            method: "guest",
            is_first_time: String(result.isFirstTime),
          });
          return {
            isFirstTime: result.isFirstTime,
            isSubscribed: result.isSubscribed,
          };
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.guestLoginFailed,
          });
          throw error;
        }
      },

      // Forgot Password
      forgotPassword: async (handle: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.forgotPassword(handle);
          set({ isLoading: false, error: null });
        } catch (error: any) {
          // Do not set global `error` — callers show alerts/local copy. Shared `error`
          // was leaking onto Login / Sign up and persisting across auth screens.
          set({ isLoading: false, error: null });
          throw error;
        }
      },

      // Reset Password
      resetPassword: async (token: string, password: string, email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(token, password, email);
          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.resetPasswordFailed,
          });
          throw error;
        }
      },

      // Get Profile
      getProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.getProfile();
          set({
            user: result.user,
            token: result.token || get().token, // Keep existing token if new one not provided
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.getProfileFailed,
          });
          throw error;
        }
      },

      // Refresh profile in background (no loading state). Updates last-activity on backend. Records timestamp for throttle.
      refreshProfileSilent: async () => {
        if (!get().isAuthenticated || !get().token) return;
        try {
          const result = await authService.getProfile();
          set({
            user: result.user,
            token: result.token || get().token,
          });
          lastProfileRefreshAt = Date.now();
        } catch (e) {
          if (__DEV__) {
            console.warn("[AUTH_STORE] refreshProfileSilent failed", e);
          }
        }
      },

      // Only refresh if last call was ≥1 hour ago. Use from app foreground and home focus.
      refreshProfileSilentIfThrottled: async () => {
        if (!get().isAuthenticated || !get().token) return;
        const now = Date.now();
        if (
          lastProfileRefreshAt > 0 &&
          now - lastProfileRefreshAt < PROFILE_REFRESH_THROTTLE_MS
        )
          return;
        await get().refreshProfileSilent();
      },

      // Post login/signup: schedule auth/me at 5min and 10min only. First call is once after /device (in usePushNotifications).
      schedulePostLoginProfileRefresh: () => {
        postLoginRefreshTimeouts.forEach((id) => clearTimeout(id));
        postLoginRefreshTimeouts = [];
        const t1 = setTimeout(
          () => get().refreshProfileSilent(),
          5 * 60 * 1000
        );
        const t2 = setTimeout(
          () => get().refreshProfileSilent(),
          10 * 60 * 1000
        );
        postLoginRefreshTimeouts = [t1, t2];
      },

      cancelPostLoginProfileRefresh: () => {
        postLoginRefreshTimeouts.forEach((id) => clearTimeout(id));
        postLoginRefreshTimeouts = [];
        lastProfileRefreshAt = 0;
      },

      // Update Profile
      updateProfile: async (data: UpdateProfileRequest) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.updateProfile(data);
          set({
            user: result.user,
            token: result.token || get().token, // Keep existing token if new one not provided
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.updateProfileFailed,
          });
          throw error;
        }
      },

      // Delete Profile — same full clear as logout (session + AsyncStorage + stores)
      deleteProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.deleteProfile();
          get().cancelPostLoginProfileRefresh();
          await get()._clearAllSessionAndStorage();
          set({
            user: null,
            token: null,
            guestId: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.deleteAccountFailed,
          });
          throw error;
        }
      },

      // Resend Verification Email
      resendVerificationEmail: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.resendVerificationEmail();
          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error:
              error.message || AUTH_STRINGS.errors.resendVerificationFailed,
          });
          throw error;
        }
      },

      // Get Referrals
      getReferrals: async () => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.getReferrals();
          set({ isLoading: false, error: null });
          return result;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.getReferralsFailed,
          });
          throw error;
        }
      },

      // Use Referral Code
      useReferralCode: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.useReferralCode(code);
          // Update user if referral affects user data
          if (result.userId) {
            await get().getProfile(); // Refresh profile
          }
          set({ isLoading: false, error: null });
          return result;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.useReferralFailed,
          });
          throw error;
        }
      },

      // Subscribe Google
      subscribeGoogle: async (data: GoogleSubscriptionRequest) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.subscribeGoogle(data);
          await refreshAuthTokenAfterEntitlementChange(get);
          // Refresh profile to get updated subscription status
          await get().getProfile();
          // Refresh notification service to enable subscription features
          await refreshNotificationService();
          set({ isLoading: false, error: null });
          return result;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.subscribeGoogleFailed,
          });
          throw error;
        }
      },

      // Unsubscribe Google
      unsubscribeGoogle: async (removeLifetimePurchase?: boolean) => {
        set({ isLoading: true, error: null });
        try {
          await authService.unsubscribeGoogle(removeLifetimePurchase);
          await refreshAuthTokenAfterEntitlementChange(get);
          // Refresh profile to get updated subscription status
          await get().getProfile();
          // Refresh notification service to adjust for subscription change
          await refreshNotificationService();
          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.unsubscribeGoogleFailed,
          });
          throw error;
        }
      },

      // Subscribe Apple
      subscribeApple: async (data: AppleSubscriptionRequest) => {
        if (!isAppleSubscriptionsEnabled()) {
          useAppLogsStore.getState().warn(
            "[Subscription] subscribeApple blocked (appleSubscriptionsEnabled=false)"
          );
          throw new Error(APPLE_SUBSCRIPTIONS_DISABLED_MESSAGE);
        }
        set({ isLoading: true, error: null });
        try {
          const result = await authService.subscribeApple(data);
          await refreshAuthTokenAfterEntitlementChange(get);
          // Refresh profile to get updated subscription status
          await get().getProfile();
          // Refresh notification service to enable subscription features
          await refreshNotificationService();
          set({ isLoading: false, error: null });
          return result;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.subscribeAppleFailed,
          });
          throw error;
        }
      },

      // Unsubscribe Apple
      unsubscribeApple: async () => {
        set({ isLoading: true, error: null });
        try {
          await authService.unsubscribeApple();
          await refreshAuthTokenAfterEntitlementChange(get);
          // Refresh profile to get updated subscription status
          await get().getProfile();
          // Refresh notification service to adjust for subscription change
          await refreshNotificationService();
          set({ isLoading: false, error: null });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.unsubscribeAppleFailed,
          });
          throw error;
        }
      },

      // Parse Google purchase token (no side effects)
      parseGooglePurchaseToken: async (
        data: ParseGooglePurchaseTokenRequest
      ) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.parseGooglePurchaseToken(data);
          set({ isLoading: false, error: null });
          return result;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || AUTH_STRINGS.errors.parseTokenFailed,
          });
          throw error;
        }
      },

      // Refresh Auth Token:
      // - Guest: POST /auth/guest-login with { guestId } (same endpoint as login).
      // - Non-guest: GET /auth/refresh-auth-token (current token sent via request interceptor).
      // On success: updates store + persisted storage; axios interceptor will retry the failed request with the new token.
      // On failure: only logout when backend returns 401/403 (invalid/expired token). Do NOT logout on 5xx, timeout, or network error.
      refreshAuthToken: async () => {
        const token = get().token;
        const user = get().user;
        const guestId = get().guestId;
        if (!token) {
          if (__DEV__) {
            console.log("[AUTH_STORE] refreshAuthToken skipped: no token");
          }
          throw new Error("No token to refresh");
        }
        const getStatus = (err: any) =>
          err?.response?.status ?? err?.status ?? err?.statusCode;

        // Guest: refresh via POST /auth/guest-login with guestId (same endpoint as login)
        if (user?.isGuest) {
          if (!guestId) {
            if (__DEV__) {
              console.log(
                "[AUTH_STORE] refreshAuthToken skipped: guest has no guestId"
              );
            }
            throw new Error("Guest cannot refresh without guestId");
          }
          const tryGuestRefresh = async (): Promise<string> => {
            const result = await authService.guestLogin(guestId);
            set({
              user: result.user,
              token: result.token,
              guestId: result.guestId,
            });
            return result.token;
          };
          try {
            const newToken = await tryGuestRefresh();
            if (__DEV__) {
              console.log(
                "[AUTH_STORE] refreshAuthToken (guest-login) success",
                {
                  newTokenLast4:
                    typeof newToken === "string" ? newToken.slice(-4) : null,
                }
              );
            }
            return newToken;
          } catch (firstError: any) {
            const status = getStatus(firstError);
            if (status === 401 || status === 403) {
              if (__DEV__) {
                console.log(
                  "[AUTH_STORE] guest-login refresh invalid (401/403), logging out"
                );
              }
              await get().logout();
            }
            throw firstError;
          }
        }

        // Non-guest: GET /auth/refresh-auth-token
        const tryRefresh = async (): Promise<string> => {
          const newToken = await authService.refreshAuthToken();
          return newToken;
        };
        try {
          const newToken = await tryRefresh();
          set({ token: newToken });
          if (__DEV__) {
            console.log(
              "[AUTH_STORE] refreshAuthToken success, token updated",
              {
                newTokenLast4:
                  typeof newToken === "string" ? newToken.slice(-4) : null,
              }
            );
          }
          return get().token ?? newToken;
        } catch (firstError: any) {
          const status = getStatus(firstError);
          const isInvalidRefresh = status === 401 || status === 403;
          if (isInvalidRefresh) {
            if (__DEV__) {
              console.log(
                "[AUTH_STORE] refresh token invalid (401/403), logging out"
              );
            }
            await get().logout();
            throw firstError;
          }
          // Transient error (5xx, network): retry once; do not logout
          try {
            const newToken = await tryRefresh();
            set({ token: newToken });
            if (__DEV__) {
              console.log(
                "[AUTH_STORE] refreshAuthToken success (retry), token updated",
                {
                  newTokenLast4:
                    typeof newToken === "string" ? newToken.slice(-4) : null,
                }
              );
            }
            return get().token ?? newToken;
          } catch (retryError: any) {
            const retryStatus = getStatus(retryError);
            if (retryStatus === 401 || retryStatus === 403) {
              if (__DEV__) {
                console.log(
                  "[AUTH_STORE] refresh token invalid on retry (401/403), logging out"
                );
              }
              await get().logout();
            }
            throw retryError;
          }
        }
      },

      // Shared cleanup: clear session AsyncStorage, session, stores, cache (used by logout and deleteProfile).
      _clearAllSessionAndStorage: async () => {
        let themeMode: import("../../design-system/themes").ThemeMode = "system";
        try {
          const { useThemeStore } = require("../theme/theme.store");
          themeMode = useThemeStore.getState().themeMode;
        } catch (e) {
          if (__DEV__) console.warn("[AUTH_STORE] read theme before clear failed", e);
        }

        try {
          const {
            clearSessionStorage,
          } = require("../../utils/clearSessionStorage");
          await clearSessionStorage();
        } catch (e) {
          if (__DEV__)
            console.warn("[AUTH_STORE] clearSessionStorage failed", e);
        }

        try {
          const { useThemeStore } = require("../theme/theme.store");
          useThemeStore.getState().setThemeMode(themeMode);
        } catch (e) {
          if (__DEV__) console.warn("[AUTH_STORE] restore theme after clear failed", e);
        }
        try {
          const {
            resetSessionCount,
          } = require("../../services/session/session.service");
          await resetSessionCount();
        } catch (e) {
          if (__DEV__) console.warn("[AUTH_STORE] resetSessionCount failed", e);
        }
        try {
          const { useBirdsStore } = require("../catalogue/birds.store");
          useBirdsStore.getState().reset();
        } catch (e) {
          /* ignore */
        }
        try {
          const {
            useSubscriptionStore,
          } = require("../subscription/subscription.store");
          useSubscriptionStore.getState().reset();
        } catch (e) {
          /* ignore */
        }
        try {
          const { useProfileStore } = require("../profile/profile.store");
          useProfileStore.getState().reset();
        } catch (e) {
          /* ignore */
        }
        try {
          const {
            useOnboardingStore,
          } = require("../onboarding/onboarding.store");
          useOnboardingStore.getState().reset();
        } catch (e) {
          /* ignore */
        }
        try {
          const {
            usePostAuthOnboardingStore,
          } = require("../post-auth-onboarding/post-auth-onboarding.store");
          usePostAuthOnboardingStore.getState().reset();
        } catch (e) {
          /* ignore */
        }
        try {
          const {
            clearPendingPurchases,
          } = require("../subscription/pendingPurchase.store");
          await clearPendingPurchases();
        } catch (e) {
          /* ignore */
        }
        try {
          const {
            clearLastSubmittedAppleReceipt,
          } = require("./services/auth.service");
          clearLastSubmittedAppleReceipt();
        } catch (e) {
          /* ignore */
        }
        try {
          const {
            clearLocalEntitlementSnapshot,
          } = require("../subscription/localEntitlement.store");
          await clearLocalEntitlementSnapshot();
        } catch (e) {
          /* ignore */
        }
        try {
          const {
            clearAllCache,
          } = require("../../services/cache/dataCache.service");
          await clearAllCache();
        } catch (e) {
          /* ignore */
        }
        // Stop background tasks (interval + AppState listener)
        try {
          const {
            stopBackgroundTasks,
          } = require("../../services/background/backgroundTask.service");
          stopBackgroundTasks();
        } catch (e) {
          /* ignore */
        }
        // Cancel scheduled / inactivity notifications
        try {
          const {
            cancelInactivityNotifications,
          } = require("../../services/notifications/scheduledNotifications.service");
          await cancelInactivityNotifications();
        } catch (e) {
          /* ignore */
        }
        try {
          const {
            cancelAllNotifications,
          } = require("../../services/notifications/notification.service");
          await cancelAllNotifications();
        } catch (e) {
          /* ignore */
        }
      },

      // Logout — only called explicitly by user or when refresh token is invalid (401/403)
      logout: async () => {
        if (__DEV__) {
          console.log("[AUTH_STORE] logout called");
        }
        analyticsService.logEvent(EVENTS.logout);
        set({ isLoading: true });
        get().cancelPostLoginProfileRefresh();
        try {
          await get()._clearAllSessionAndStorage();

          // Logged-out users start at marketing onboarding, not Login
          try {
            const { NavigationService } = require("../../utils/navigation");
            const navigationRef = NavigationService.getNavigationRef();
            if (navigationRef?.isReady()) {
              navigationRef.dispatch(
                require("@react-navigation/native").CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Onboarding" }],
                })
              );
            }
          } catch (e) {
            // Navigation will be handled by RootNavigator watching auth state
            if (__DEV__) {
              console.warn(
                "Navigation during logout failed, RootNavigator will handle it:",
                e
              );
            }
          }

          // Backend doesn't have a logout endpoint
          // Token invalidation is handled server-side on next request
        } catch (error) {
          // Ignore errors - logout should always succeed locally
          if (__DEV__) {
            console.warn("Error during logout cleanup:", error);
          }
        } finally {
          // Clear Zustand state (this will also clear persisted state)
          set({
            user: null,
            token: null,
            guestId: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Set User
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      // Set Token
      setToken: (token: string | null) => {
        set({ token });
      },

      // Set Guest ID
      setGuestId: (guestId: string | null) => {
        set({ guestId });
      },

      // Set Error
      setError: (error: string | null) => {
        set({ error });
      },

      // Reset
      reset: () => {
        set({
          user: null,
          token: null,
          guestId: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "birdzy-auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Persist full auth state; do not remove token/user from partialize or session is lost.
      // No version/migrate: adding either must not wipe state (migrate must merge, not replace).
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        guestId: state.guestId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
          (state as AuthState)._hasHydrated = true;
        }
        if (error) {
          console.error(
            "[AUTH_STORE] hydration error (state NOT cleared):",
            error
          );
          // Do NOT clear state on hydration error — avoids random logouts from transient storage/parse issues.
        } else {
          console.log("[AUTH_STORE]", "rehydrated", {
            hasUser: !!state?.user,
            hasToken:
              typeof state?.token === "string" && state.token.length > 0,
            tokenLen:
              typeof state?.token === "string" ? state.token.length : null,
            tokenLast4:
              typeof state?.token === "string" ? state.token.slice(-4) : null,
            isAuthenticated: state?.isAuthenticated,
            isGuest: !!state?.user?.isGuest,
          });
          // On every app start: refresh token so session is valid.
          // Non-guest: GET /auth/refresh-auth-token. Guest: POST /auth/guest-login with guestId (same endpoint as login).
          const hasToken =
            typeof state?.token === "string" && state.token.length > 0;
          const hasUser = !!state?.user;
          const isGuest = !!state?.user?.isGuest;
          const hasGuestId =
            typeof state?.guestId === "string" && state.guestId.length > 0;
          const shouldRefreshOnStart =
            hasToken && hasUser && (!isGuest || (isGuest && hasGuestId));
          if (shouldRefreshOnStart) {
            const APP_START_REFRESH_DELAY_MS = 500;
            setTimeout(() => {
              useAuthStore
                .getState()
                .refreshAuthToken()
                .then(() => {
                  if (__DEV__) {
                    console.log(
                      "[AUTH_STORE] app-start refresh token success",
                      { isGuest }
                    );
                  }
                })
                .catch(() => {
                  // Refresh failed (e.g. 401/403) — logout is handled inside refreshAuthToken / axios interceptor
                  if (__DEV__) {
                    console.log(
                      "[AUTH_STORE] app-start refresh token failed (session may have been cleared)",
                      { isGuest }
                    );
                  }
                });
            }, APP_START_REFRESH_DELAY_MS);
          }
        }
      },
    }
  )
);
