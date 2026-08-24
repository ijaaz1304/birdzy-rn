/**
 * Authentication API endpoints
 * Complete implementation matching backend API structure
 * All endpoints use constants - no hardcoded values
 */

import { apiClient } from "../axios";
import { API_ENDPOINTS } from "../../../constants/api";
import { API_BASE_URL, API_TIMEOUT } from "../../../constants/env";
import { ApiException } from "../errors";
import {
  SignupRequest,
  LoginRequest,
  SocialLoginRequest,
  GuestLoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UpdateProfileRequest,
  UseReferralCodeRequest,
  GoogleSubscriptionRequest,
  AppleSubscriptionRequest,
  ParseGooglePurchaseTokenRequest,
  AuthResponse,
  GuestLoginResponse,
  RefreshTokenResponse,
  GetUserProfileResponse,
  ReferralResponse,
  SubscriptionResponse,
  ParsePurchaseTokenResponse,
  BackendApiResponse,
} from "./auth.api.types";

function buildAuthUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Authentication API service
 * Complete implementation matching backend API documentation
 *
 * All endpoints follow the structure:
 * - Request body matches API documentation exactly
 * - Response types match API documentation exactly
 * - Error handling via axios interceptors
 * - All requests logged via axios interceptors
 */
export const authApi = {
  /**
   * POST /auth/signup
   * Create a new user account with email and password
   *
   * If Guest ID is provided, the guest user is promoted to a normal user.
   *
   * Request Body:
   * {
   *   "guestId": "507f1f77bcf86cd799439011", // Optional: Promote guest to user
   *   "email": "user@example.com",
   *   "phone": "+1234567890", // Optional
   *   "fullName": "John Doe", // Optional
   *   "password": "password123",
   *   "gender": "Male", // Optional
   *   "country": "USA", // Optional
   *   "age": 30, // Optional
   *   "picture": "https://example.com/profile.jpg" // Optional
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "token": "eyJhbGciOi......",
   *   "user": { ... } // Complete user object
   * }
   */
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.SIGNUP,
      data
    );
    return response.data;
  },

  /**
   * POST /auth/login
   * User login using email/password
   *
   * Request Body:
   * {
   *   "handle": "user@example.com", // Email or phone
   *   "password": "password123"
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": { ... } // Complete user object
   * }
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      data
    );
    return response.data;
  },

  /**
   * GET /auth/refresh-auth-token
   * Exchange current JWT for a fresh one. The existing token is sent automatically
   * via the axios request interceptor (Authorization: Bearer <current token>).
   * Caller must update the auth store with the returned token.
   *
   * Response:
   * {
   *   "error": false,
   *   "userId": "...",
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   */
  refreshAuthToken: async (): Promise<RefreshTokenResponse> => {
    const endpoint = API_ENDPOINTS.AUTH.REFRESH_TOKEN;
    if (__DEV__) {
      console.log(
        "[REFRESH-AUTH-TOKEN] authApi.refreshAuthToken() → GET",
        endpoint
      );
    }
    const response = await apiClient.get<RefreshTokenResponse>(endpoint);
    if (__DEV__) {
      console.log(
        "[REFRESH-AUTH-TOKEN] authApi.refreshAuthToken() ← response",
        {
          status: response.status,
          hasToken: !!(response.data as any)?.token,
        }
      );
    }
    return response.data;
  },

  /**
   * POST /auth/social-login/google
   * Login with Google
   *
   * Send the credential (Google ID Token) obtained after successful
   * client-side "Sign in with Google".
   *
   * If a Guest ID is provided, the guest user is promoted to a normal user.
   * Otherwise, a new user is created.
   *
   * Request Body:
   * {
   *   "credential": "google_id_token",
   *   "guestId": "507f1f77bcf86cd799439011", // Optional: Promote guest
   *   "fullName": "John Doe" // Optional
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "isSignup": true, // true if new user created
   *   "token": "eyJhb.......",
   *   "user": { ... } // Complete user object
   * }
   */
  socialLoginGoogle: async (
    data: SocialLoginRequest
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.SOCIAL_LOGIN_GOOGLE,
      data
    );
    return response.data;
  },

  /**
   * POST /auth/social-login/apple
   * Login with Apple
   *
   * Send the credential (Apple ID Token) obtained after successful
   * client-side "Sign in with Apple".
   *
   * If a Guest ID is provided, the guest user is promoted to a normal user.
   * Otherwise, a new user is created.
   *
   * Request Body:
   * {
   *   "credential": "apple_id_token",
   *   "nonce": "optional_nonce", // Optional
   *   "guestId": "507f1f77bcf86cd799439011", // Optional: Promote guest
   *   "fullName": "John Doe" // Optional
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "isSignup": true, // true if new user created
   *   "token": "eyJhbGciOiJIUz.....",
   *   "user": { ... } // Complete user object
   * }
   */
  socialLoginApple: async (data: SocialLoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.SOCIAL_LOGIN_APPLE,
      data
    );
    return response.data;
  },

  /**
   * POST /auth/guest-login
   * Create or login Guest user
   *
   * If guestId is provided, logs in existing guest user.
   * If guestId is not provided (empty body), creates new guest user.
   *
   * Request Body (optional):
   * - { "guestId": "507f1f77bcf86cd799439011" } - Login existing guest
   * - {} - Create new guest
   *
   * Response includes:
   * - token: JWT token for guest user
   * - guestId: Guest user ID (for future login)
   * - isFirstTime: true if new guest created
   * - isSubscribed: Subscription status
   * - guest: Guest user object
   */
  guestLogin: async (data?: GuestLoginRequest): Promise<GuestLoginResponse> => {
    // Send empty object if no data provided (creates new guest)
    // Send { guestId } if provided (logs in existing guest)
    const requestBody: GuestLoginRequest = data?.guestId
      ? { guestId: data.guestId }
      : {};
    const url = buildAuthUrl(API_ENDPOINTS.AUTH.GUEST_LOGIN);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const body = (await res.json().catch(() => ({}))) as GuestLoginResponse;
      if (!res.ok) {
        throw new ApiException(
          (body as any)?.message ||
            (body as any)?.reason ||
            res.statusText ||
            "Guest login failed",
          res.status
        );
      }
      return body;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err instanceof ApiException) throw err;
      if (err?.name === "AbortError") {
        throw new ApiException("Request timeout. Please try again.", 408);
      }
      throw err;
    }
  },

  /**
   * POST /auth/forgot-password
   * Start forgot password workflow
   *
   * Sends an OTP to the user's email (provided the user exists).
   *
   * Request Body:
   * {
   *   "handle": "user@example.com" // Email or phone
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "message": "OTP sent to the registered email."
   * }
   */
  forgotPassword: async (
    data: ForgotPasswordRequest
  ): Promise<BackendApiResponse> => {
    const response = await apiClient.post<BackendApiResponse>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data
    );
    return response.data;
  },

  /**
   * POST /auth/reset-password
   * Reset password using OTP
   *
   * Reset the user's password using the OTP sent to their email.
   *
   * Request Body:
   * {
   *   "token": "otp_token", // OTP received via email
   *   "password": "new_password123",
   *   "email": "user@example.com"
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "email": "user@example.com"
   * }
   */
  resetPassword: async (
    data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post<ResetPasswordResponse>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );
    return response.data;
  },

  /**
   * GET /auth/me
   * Get user profile
   *
   * Get the user's own profile.
   * Requires authentication (Bearer token in header).
   *
   * Response:
   * {
   *   "error": false,
   *   "discount": { // Optional
   *     "isApplicable": true,
   *     "endsAt": 1736706599999
   *   },
   *   "user": { ... }, // Complete user object
   *   "token": "eyJhbGciOi...." // Optional: New token if refreshed
   * }
   */
  getProfile: async (): Promise<GetUserProfileResponse> => {
    const response = await apiClient.get<GetUserProfileResponse>(
      API_ENDPOINTS.AUTH.GET_PROFILE
    );
    return response.data;
  },

  /**
   * PATCH /auth/me
   * Update user profile
   *
   * Update the user's own profile.
   * All fields are optional - only include fields to update.
   *
   * Request Body (all fields optional):
   * {
   *   "password": "password123",
   *   "fullName": "John Doe",
   *   "phone": "+1234567890",
   *   "picture": "https://example.com/profile.jpg",
   *   "country": "USA",
   *   "gender": "Male",
   *   "age": 30,
   *   "timezone": "America/New_York",
   *   "language": "en",
   *   "ftueCompletion": { ... },
   *   "sellerDetails": { ... }
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "user": { ... }, // Updated user object
   *   "token": "eyJhbGciOi.........." // Optional: New token
   * }
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<AuthResponse> => {
    const response = await apiClient.patch<AuthResponse>(
      API_ENDPOINTS.AUTH.UPDATE_PROFILE,
      data
    );
    return response.data;
  },

  /**
   * DELETE /auth/me
   * Delete user account
   *
   * This endpoint is used to delete the user's account and all associated data.
   * This action is irreversible.
   *
   * Response:
   * {
   *   "error": false
   * }
   */
  deleteProfile: async (): Promise<BackendApiResponse> => {
    const response = await apiClient.delete<BackendApiResponse>(
      API_ENDPOINTS.AUTH.DELETE_PROFILE
    );
    return response.data;
  },

  /**
   * POST /auth/resend-verification-mail
   * Resend verification email
   *
   * Resend the verification email to the logged-in user
   * (only relevant for email/password registered users).
   *
   * Response:
   * {
   *   "error": false,
   *   "message": "Verification email sent."
   * }
   */
  resendVerificationEmail: async (): Promise<BackendApiResponse> => {
    const response = await apiClient.post<BackendApiResponse>(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      {}
    );
    return response.data;
  },

  /**
   * GET /auth/referrals
   * Get referral code and stats
   *
   * Get the user's own referral code and stats, including the number of
   * successful referrals and the list of referred users.
   *
   * N.B.: This endpoint should be used by a Referrer User (parent)
   *
   * Response:
   * {
   *   "error": false,
   *   "userId": "677ce8b3aa8f8044ea3910e8",
   *   "referredBy": { ... }, // Optional: If user was referred
   *   "referralCode": "XYZW1234",
   *   "successfulReferralCount": 5,
   *   "referredUsers": [ ... ] // List of users referred by this user
   * }
   */
  getReferrals: async (): Promise<ReferralResponse> => {
    const response = await apiClient.get<ReferralResponse>(
      API_ENDPOINTS.AUTH.GET_REFERRALS
    );
    return response.data;
  },

  /**
   * POST /auth/referrals
   * Use referral code
   *
   * Use a referral code during signup or later.
   *
   * N.B.: This endpoint should be used by a Referred User (child)
   *
   * Request Body:
   * {
   *   "code": "REF12345"
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "userId": "677ce8b3aa8f8044ea3910e8",
   *   "referralCode": "XYZW1234",
   *   "referredBy": { ... },
   *   "message": "Referral set successfully!"
   * }
   */
  useReferralCode: async (
    data: UseReferralCodeRequest
  ): Promise<ReferralResponse> => {
    const response = await apiClient.post<ReferralResponse>(
      API_ENDPOINTS.AUTH.USE_REFERRAL,
      data
    );
    return response.data;
  },

  /**
   * PUT /auth/subscribe/google
   * Validate Google Play purchase
   *
   * Validate Google Play purchase and update user status as applicable.
   *
   * Request Body:
   * {
   *   "purchaseToken": "xyz.123.pqr",
   *   "itemId": "lifetime_habit_eazy",
   *   "purchaseTime": "2024-10-22T08:25:00.231Z",
   *   "isProduct": true,
   *   "isLifetimePurchase": true,
   *   "includesTrial": false
   * }
   * (purchaseTime: ISO 8601 string)
   *
   * Response:
   * {
   *   "error": false,
   *   "userId": "66ffe0f4c1ada3b70b6033c0",
   *   "isSubscribed": true,
   *   "isSubscriptionActive": true,
   *   "subscriptionProvider": "google",
   *   "googlePurchaseData": { ... }
   * }
   */
  subscribeGoogle: async (
    data: GoogleSubscriptionRequest
  ): Promise<SubscriptionResponse> => {
    const response = await apiClient.put<SubscriptionResponse>(
      API_ENDPOINTS.AUTH.SUBSCRIBE_GOOGLE,
      data
    );
    return response.data;
  },

  /**
   * DELETE /auth/unsubscribe/google
   * Unsubscribe from Google Play
   *
   * Unsubscribe from Google Play subscription.
   *
   * Query Parameters:
   * - removeLifetimePurchase (optional): Set to true to remove lifetime purchase without unsubscribing
   *
   * Response:
   * {
   *   "error": false
   * }
   */
  unsubscribeGoogle: async (
    removeLifetimePurchase?: boolean
  ): Promise<BackendApiResponse> => {
    const params = removeLifetimePurchase
      ? { removeLifetimePurchase: "true" }
      : {};
    const response = await apiClient.delete<BackendApiResponse>(
      API_ENDPOINTS.AUTH.UNSUBSCRIBE_GOOGLE,
      { params }
    );
    return response.data;
  },

  /**
   * PUT /auth/subscribe/apple
   * Subscribe with Apple. Sends receipt + isSandbox. Backend must call validateReceiptIosSmart
   * first; the return result to use is isSandbox = validation?.environment?.toLowerCase() === 'sandbox'.
   *
   * Request Body:
   * {
   *   "receipt": "MIJhugYJKoZIhvcNAQcCoIJhqzCCYacCA.........",
   *   "isSandbox": false,
   *   "isProduct": false,
   *   "isLifetimePurchase": false,
   *   "includesTrial": false
   * }
   *
   * Response:
   * {
   *   "error": false,
   *   "userId": "66ffe0f4c1ada3b70b6033c0",
   *   "isSubscribed": true,
   *   "subscriptionProvider": "apple",
   *   "applePurchaseData": {}
   * }
   */
  subscribeApple: async (
    data: AppleSubscriptionRequest
  ): Promise<SubscriptionResponse> => {
    const response = await apiClient.put<SubscriptionResponse>(
      API_ENDPOINTS.AUTH.SUBSCRIBE_APPLE,
      data
    );
    return response.data;
  },

  /**
   * DELETE /auth/unsubscribe/apple
   * Unsubscribe from Apple
   *
   * Unsubscribe user from Apple.
   *
   * Response:
   * {
   *   "error": false
   * }
   */
  unsubscribeApple: async (): Promise<BackendApiResponse> => {
    const response = await apiClient.delete<BackendApiResponse>(
      API_ENDPOINTS.AUTH.UNSUBSCRIBE_APPLE
    );
    return response.data;
  },

  /**
   * POST /auth/parse-google-purchasetoken
   * Parse and validate Google Play purchase token (no side effects)
   *
   * This endpoint parses and validates a Google Play purchase token
   * (either a subscription or a product) and returns the parsed payload.
   * It does not update the database or user status.
   * Useful for debugging or client-side validation.
   *
   * Request Body:
   * {
   *   "purchaseToken": "string (required)",
   *   "itemId": "string (required)",
   *   "isProduct": false,
   *   "packageName": "com.example.app" // optional, defaults to server config
   * }
   *
   * Response (Subscription Example):
   * {
   *   "error": false,
   *   "type": "subscription",
   *   "parsedPayload": { ... Google API response for subscription ... }
   * }
   *
   * Response (Product Example):
   * {
   *   "error": false,
   *   "type": "product",
   *   "parsedPayload": { ... Google API response for product ... }
   * }
   *
   * Error Response:
   * {
   *   "error": true,
   *   "reason": "Missing mandatory fields purchaseToken & itemId!"
   * }
   */
  parseGooglePurchaseToken: async (
    data: ParseGooglePurchaseTokenRequest
  ): Promise<ParsePurchaseTokenResponse> => {
    const response = await apiClient.post<ParsePurchaseTokenResponse>(
      API_ENDPOINTS.AUTH.PARSE_GOOGLE_TOKEN,
      data
    );
    return response.data;
  },
};
