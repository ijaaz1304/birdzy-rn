import { coalesceInFlight } from "../../../utils/coalesceInFlight";
/**
 * Authentication Service
 * Business logic layer for authentication
 * Handles all auth operations with proper error handling
 */

import { authApi } from "../../../services/api/features/auth.api";
import {
  SignupRequest,
  LoginRequest,
  SocialLoginRequest,
  GuestLoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UseReferralCodeRequest,
  GoogleSubscriptionRequest,
  AppleSubscriptionRequest,
  ParseGooglePurchaseTokenRequest,
  BackendUser,
} from "../../../services/api/features/auth.api.types";
import { ApiException, normalizeError } from "../../../services/api/errors";
import { executeWithRetry } from "../../../utils/retry";
import { User, useAuthStore } from "../auth.store";
import { AUTH_STRINGS } from "../../../config/strings/auth.strings";
import { useAppLogsStore } from "../../app-logs/app-logs.store";
import type { SubscriptionResponse } from "../../../services/api/features/auth.api.types";

const MIN_APPLE_RECEIPT_LENGTH = 1000;

function assertValidAppleSubscribePayload(
  data: AppleSubscriptionRequest
): void {
  if (
    typeof data.receipt !== "string" ||
    data.receipt.length <= MIN_APPLE_RECEIPT_LENGTH
  ) {
    throw new ApiException("Invalid receipt");
  }
  if (typeof data.isSandbox !== "boolean") {
    throw new ApiException("Invalid Apple subscription payload");
  }
}

export interface AuthResult {
  user: User;
  token: string;
  isSignup?: boolean;
}

export interface GuestLoginResult {
  user: User;
  token: string;
  guestId: string;
  isFirstTime: boolean;
  isSubscribed: boolean;
}

/**
 * Convert backend user to frontend user format
 */
function mapBackendUserToUser(backendUser: BackendUser): User {
  return {
    id: backendUser.id || backendUser._id,
    email: backendUser.email,
    name:
      backendUser.name?.full ||
      `${backendUser.name?.first || ""} ${backendUser.name?.last || ""}`.trim(),
    firstName: backendUser.name?.first,
    lastName: backendUser.name?.last,
    avatar: backendUser.picture,
    phone: backendUser.phone,
    gender: backendUser.gender,
    age: backendUser.age,
    country: backendUser.country,
    isActive: backendUser.isActive,
    isSocial: backendUser.isSocial,
    socialProvider: backendUser.socialProvider,
    isGuest: backendUser.isGuest,
    isSubscribed: backendUser.isSubscribed,
    isRewarded: backendUser.isRewarded,
    isProfileComplete: backendUser.isProfileComplete,
    isEmailVerified: backendUser.isEmailVerified,
    subscriptionDate: backendUser.subscriptionDate,
    subscriptionProvider: backendUser.subscriptionProvider,
    hasUsedTrial: backendUser.hasUsedTrial,
    createdAt: backendUser.createdAt,
    updatedAt: backendUser.updatedAt,
    ftueCompletion: backendUser.ftueCompletion,
    successfulReferralCount: backendUser.successfulReferralCount,
    sellerDetails: backendUser.sellerDetails,
  };
}

/**
 * Authentication service - handles business logic for auth operations
 */
class AuthService {
  /**
   * Signup with email/password
   */
  async signup(data: SignupRequest): Promise<AuthResult> {
    try {
      const response = await authApi.signup(data);

      if (response.error) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.signupFailed
        );
      }

      return {
        user: mapBackendUserToUser(response.user),
        token: response.token,
        isSignup: true,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Login with email/password
   */
  async login(handle: string, password: string): Promise<AuthResult> {
    try {
      const request: LoginRequest = { handle, password };
      const response = await authApi.login(request);

      if (response.error) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.loginFailed
        );
      }

      return {
        user: mapBackendUserToUser(response.user),
        token: response.token,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Refresh auth token. Calls GET /auth/refresh-auth-token (current token sent by request interceptor).
   * Returns the new token; the auth store must update its token with this value so subsequent requests use it.
   * Handles both { token } and { data: { token } } response shapes.
   */
  async refreshAuthToken(): Promise<string> {
    try {
      const response = await authApi.refreshAuthToken();

      if (response.error) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.tokenRefreshFailed
        );
      }

      const token =
        response.token ??
        (response as any).data?.token ??
        (response as any).accessToken;
      if (!token || typeof token !== "string") {
        throw new ApiException(
          "Refresh response missing token",
          500,
          undefined,
          response
        );
      }
      return token;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Social login with Google
   */
  async socialLoginGoogle(data: SocialLoginRequest): Promise<AuthResult> {
    useAppLogsStore.getState().info("[AUTH] Google API: POST /auth/social-login/google", {
      hasCredential: !!data.credential,
      credentialLength: data.credential?.length ?? 0,
      guestId: data.guestId ?? null,
      hasFullName: !!data.fullName,
    });
    try {
      const response = await authApi.socialLoginGoogle(data);

      if (response.error) {
        useAppLogsStore.getState().error("[AUTH] Google API: error response", {
          message: response.message ?? null,
          error: response.error,
        });
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.googleLoginFailed
        );
      }

      useAppLogsStore.getState().info("[AUTH] Google API: success", {
        userId: response.user?.id ?? null,
        isSignup: response.isSignup ?? null,
        hasToken: !!response.token,
      });

      return {
        user: mapBackendUserToUser(response.user),
        token: response.token,
        isSignup: response.isSignup,
      };
    } catch (error) {
      const normalized = normalizeError(error);
      useAppLogsStore.getState().error("[AUTH] Google API: request failed", {
        message: normalized.message,
        status: normalized.status ?? null,
      });
      throw normalized;
    }
  }

  /**
   * Social login with Apple
   */
  async socialLoginApple(data: SocialLoginRequest): Promise<AuthResult> {
    useAppLogsStore.getState().info("[AUTH] Apple API: POST /auth/social-login/apple", {
      hasCredential: !!data.credential,
      credentialLength: data.credential?.length ?? 0,
      guestId: data.guestId ?? null,
      hasFullName: !!data.fullName,
      fullName: data.fullName ?? null,
    });
    try {
      const response = await authApi.socialLoginApple(data);

      if (response.error) {
        useAppLogsStore.getState().error("[AUTH] Apple API: error response", {
          message: response.message ?? null,
          error: response.error,
        });
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.appleLoginFailed
        );
      }

      useAppLogsStore.getState().info("[AUTH] Apple API: success", {
        userId: response.user?.id ?? null,
        email: response.user?.email ?? null,
        isSignup: response.isSignup ?? null,
        hasToken: !!response.token,
        tokenLength: response.token?.length ?? 0,
      });

      return {
        user: mapBackendUserToUser(response.user),
        token: response.token,
        isSignup: response.isSignup,
      };
    } catch (error) {
      const normalized = normalizeError(error);
      useAppLogsStore.getState().error("[AUTH] Apple API: request failed", {
        message: normalized.message,
        status: normalized.status ?? null,
      });
      throw normalized;
    }
  }

  /**
   * Guest login
   * Create or login Guest user
   *
   * @param guestId - Optional. If provided, logs in existing guest user.
   *                  If not provided, creates a new guest user.
   *
   * Request Body:
   * - If guestId provided: { "guestId": "..." }
   * - If no guestId: {} (empty object - creates new guest)
   *
   * Response:
   * - token: JWT token for API calls
   * - guestId: Guest user ID (store for future logins)
   * - isFirstTime: true if new guest created
   * - isSubscribed: Subscription status
   * - guest: Complete guest user object
   */
  async guestLogin(guestId?: string): Promise<GuestLoginResult> {
    try {
      // Create request: include guestId only if provided
      // Empty object {} creates new guest, { guestId } logs in existing
      const request: GuestLoginRequest = guestId ? { guestId } : {};
      const response = await authApi.guestLogin(request);

      if (response.error) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.guestLoginFailed
        );
      }

      return {
        user: mapBackendUserToUser(response.guest),
        token: response.token,
        guestId: response.guestId,
        isFirstTime: response.isFirstTime,
        isSubscribed: response.isSubscribed,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(handle: string): Promise<void> {
    try {
      const request: ForgotPasswordRequest = { handle };
      console.log("request", request);
      const response = await authApi.forgotPassword(request);

      const successFlag = (response as { success?: boolean }).success;
      const failed =
        response.error === true ||
        (typeof successFlag === "boolean" && successFlag === false);

      if (failed) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.forgotPasswordFailed
        );
      }
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Reset password
   */
  async resetPassword(
    token: string,
    password: string,
    email: string
  ): Promise<void> {
    try {
      const request: ResetPasswordRequest = { token, password, email };
      const response = await authApi.resetPassword(request);

      if (response.error) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.resetPasswordFailed
        );
      }
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<{
    user: User;
    token?: string;
    discount?: { isApplicable: boolean; endsAt: number };
  }> {
    const profileToken = useAuthStore.getState().token;
    const profileUserId = useAuthStore.getState().user?.id;
    return coalesceInFlight(
      `auth:profile:${profileUserId ?? ""}:${profileToken ?? ""}`,
      async () => {
        try {
          const response = await authApi.getProfile();

          if (response.error) {
            throw new ApiException(
              response.message || "Failed to get user profile"
            );
          }

          return {
            user: mapBackendUserToUser(response.user),
            token: response.token,
            discount: response.discount,
          };
        } catch (error) {
          throw normalizeError(error);
        }
      }
    );
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResult> {
    try {
      const response = await authApi.updateProfile(data);

      if (response.error) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.updateProfileFailed
        );
      }

      return {
        user: mapBackendUserToUser(response.user),
        token: response.token || "", // Token may not be returned
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Delete user account
   */
  async deleteProfile(): Promise<void> {
    try {
      const response = await authApi.deleteProfile();

      if (response.error) {
        throw new ApiException(response.message || "Failed to delete account");
      }
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<void> {
    try {
      const response = await authApi.resendVerificationEmail();

      if (response.error) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.resendVerificationFailed
        );
      }
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get referrals
   */
  async getReferrals() {
    try {
      const response = await authApi.getReferrals();

      if (response.error) {
        throw new ApiException(response.message || "Failed to get referrals");
      }

      return response;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Use referral code
   */
  async useReferralCode(code: string) {
    try {
      const request: UseReferralCodeRequest = { code };
      const response = await authApi.useReferralCode(request);

      if (response.error) {
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.useReferralFailed
        );
      }

      return response;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Subscribe with Google (with retry and exponential backoff per backend contract).
   * PUT /auth/subscribe/google — validates purchase and updates user status.
   */
  async subscribeGoogle(data: GoogleSubscriptionRequest) {
    useAppLogsStore.getState().info("PUT /auth/subscribe/google request", {
      payload: {
        purchaseToken: data.purchaseToken,
        itemId: data.itemId,
        purchaseTime: data.purchaseTime,
        isProduct: data.isProduct,
        isLifetimePurchase: data.isLifetimePurchase,
        includesTrial: data.includesTrial,
      },
      flow: "subscribe_google",
      phase: "request",
    });
    try {
      const response = await executeWithRetry(
        () => authApi.subscribeGoogle(data),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        }
      );

      if (response.error) {
        useAppLogsStore.getState().error("PUT /auth/subscribe/google error", {
          error: response.message,
          response,
          flow: "subscribe_google",
          outcome: "failure",
          phase: "response_error_flag",
        });
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.subscribeGoogleFailed
        );
      }

      useAppLogsStore.getState().info("PUT /auth/subscribe/google response", {
        flow: "subscribe_google",
        outcome: "success",
        phase: "response",
        response: {
          userId: response.userId,
          isSubscribed: response.isSubscribed,
          isSubscriptionActive: response.isSubscriptionActive,
          subscriptionProvider: response.subscriptionProvider,
          googlePurchaseData: response.googlePurchaseData,
        },
      });
      return response;
    } catch (error) {
      useAppLogsStore.getState().error("PUT /auth/subscribe/google failed", {
        error: error instanceof Error ? error.message : String(error),
        flow: "subscribe_google",
        outcome: "failure",
        phase: "exception",
      });
      throw normalizeError(error);
    }
  }

  /**
   * Unsubscribe from Google. DELETE /auth/unsubscribe/google
   * Optional query: removeLifetimePurchase=true to remove lifetime without unsubscribing.
   */
  async unsubscribeGoogle(removeLifetimePurchase?: boolean): Promise<void> {
    useAppLogsStore.getState().info("DELETE /auth/unsubscribe/google request", {
      payload: { removeLifetimePurchase: removeLifetimePurchase ?? false },
    });
    try {
      const response = await authApi.unsubscribeGoogle(removeLifetimePurchase);

      if (response.error) {
        useAppLogsStore
          .getState()
          .error("DELETE /auth/unsubscribe/google error", {
            error: response.message,
            response,
          });
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.unsubscribeGoogleFailed
        );
      }
      useAppLogsStore
        .getState()
        .info("DELETE /auth/unsubscribe/google response", { response });
    } catch (error) {
      useAppLogsStore
        .getState()
        .error("DELETE /auth/unsubscribe/google failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      throw normalizeError(error);
    }
  }

  /**
   * Subscribe with Apple (with retry and exponential backoff per backend contract).
   * PUT /auth/subscribe/apple — receipt + isSandbox + isProduct + isLifetimePurchase + includesTrial.
   * Backend must call validateReceiptIosSmart first; the return result to use is isSandbox = validation?.environment?.toLowerCase() === 'sandbox'.
   */
  async subscribeApple(
    data: AppleSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    assertValidAppleSubscribePayload(data);

    useAppLogsStore.getState().info("PUT /auth/subscribe/apple request", {
      payload: {
        receiptLength: data.receipt.length,
        receiptPreview:
          data.receipt.length > 24
            ? `${data.receipt.slice(0, 12)}…${data.receipt.slice(-8)}`
            : "(short)",
        isSandbox: data.isSandbox,
        isProduct: data.isProduct,
        isLifetimePurchase: data.isLifetimePurchase,
        includesTrial: data.includesTrial,
      },
      flow: "subscribe_apple",
      phase: "request",
    });
    try {
      const response = await executeWithRetry(
        () => authApi.subscribeApple(data),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 10000,
          backoffMultiplier: 2,
        }
      );

      if (response.error) {
        useAppLogsStore.getState().error("PUT /auth/subscribe/apple error", {
          error: response.message,
          response,
          flow: "subscribe_apple",
          outcome: "failure",
          phase: "response_error_flag",
        });
        throw new ApiException(
          response.message || "Failed to subscribe with Apple"
        );
      }
      useAppLogsStore.getState().info("PUT /auth/subscribe/apple response", {
        flow: "subscribe_apple",
        outcome: "success",
        phase: "response",
        response: {
          userId: response.userId,
          isSubscribed: response.isSubscribed,
          subscriptionProvider: response.subscriptionProvider,
          applePurchaseData: response.applePurchaseData,
        },
      });
      return response;
    } catch (error) {
      useAppLogsStore.getState().error("PUT /auth/subscribe/apple failed", {
        error: error instanceof Error ? error.message : String(error),
        flow: "subscribe_apple",
        outcome: "failure",
        phase: "exception",
      });
      throw normalizeError(error);
    }
  }

  /**
   * Unsubscribe from Apple. DELETE /auth/unsubscribe/apple
   */
  async unsubscribeApple(): Promise<void> {
    useAppLogsStore.getState().info("DELETE /auth/unsubscribe/apple request", {
      payload: {},
    });
    try {
      const response = await authApi.unsubscribeApple();

      if (response.error) {
        useAppLogsStore
          .getState()
          .error("DELETE /auth/unsubscribe/apple error", {
            error: response.message,
            response,
          });
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.unsubscribeAppleFailed
        );
      }
      useAppLogsStore
        .getState()
        .info("DELETE /auth/unsubscribe/apple response", { response });
    } catch (error) {
      useAppLogsStore
        .getState()
        .error("DELETE /auth/unsubscribe/apple failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      throw normalizeError(error);
    }
  }

  /**
   * Parse Google purchase token (no side effects). POST /auth/parse-google-purchasetoken
   */
  async parseGooglePurchaseToken(data: ParseGooglePurchaseTokenRequest) {
    useAppLogsStore
      .getState()
      .info("POST /auth/parse-google-purchasetoken request", {
        payload: {
          purchaseToken: data.purchaseToken,
          itemId: data.itemId,
          isProduct: data.isProduct,
          packageName: data.packageName,
        },
      });
    try {
      const response = await authApi.parseGooglePurchaseToken(data);

      if (response.error) {
        useAppLogsStore
          .getState()
          .error("POST /auth/parse-google-purchasetoken error", {
            error: response.message,
            response,
          });
        throw new ApiException(
          response.message || AUTH_STRINGS.errors.parseTokenFailed
        );
      }
      useAppLogsStore
        .getState()
        .info("POST /auth/parse-google-purchasetoken response", {
          type: response.type,
          parsedPayload: response.parsedPayload,
        });
      return response;
    } catch (error) {
      useAppLogsStore
        .getState()
        .error("POST /auth/parse-google-purchasetoken failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      throw normalizeError(error);
    }
  }
}

export const authService = new AuthService();

/** Clear Apple receipt dedupe cache (e.g. on logout). Call from auth store _clearAllSessionAndStorage. */
export function clearLastSubmittedAppleReceipt(): void {}
