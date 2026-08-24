/**
 * Authentication API Types
 * Types matching the backend API structure
 */

/**
 * User name structure
 */
export interface UserName {
  first: string;
  last: string;
  full: string;
}

/**
 * FTUE Completion status
 */
export interface FtueCompletion {
  HOME_FTUE_SHOWN?: boolean;
  TASK_FTUE_SHOWN?: boolean;
  HABIT_CREATE_FTUE_SHOWN?: boolean;
  STATS_FTUE_SHOWN?: boolean;
  HABIT_DETAILS_FTUE_SHOWN?: boolean;
}

/**
 * Seller Details
 */
export interface SellerDetails {
  name: string;
  contactEmail: string;
  externalLinks: string[];
  location: string;
  phoneNumber: string;
  bio: string;
}

/**
 * Complete User object from backend
 */
export interface BackendUser {
  _id: string;
  id: string;
  email: string;
  isActive: boolean;
  name: UserName;
  gender?: string;
  age?: number;
  isSocial: boolean;
  socialProvider: string | null;
  isGuest: boolean;
  isSubscribed: boolean;
  isRewarded: boolean;
  ftueCompletion: FtueCompletion;
  successfulReferralCount: number;
  subscriptionDate: string | null;
  subscriptionProvider: string | null;
  hasUsedTrial: boolean;
  googlePurchaseData: Record<string, any>;
  applePurchaseData: Record<string, any>;
  premappedExperimentVariants: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  sellerDetails?: SellerDetails;
  phone?: string;
  picture?: string;
  country?: string;
  timezone?: string;
  language?: string;
}

/**
 * Standard API Response (backend format)
 */
export interface BackendApiResponse<_T = any> {
  error: boolean;
  message?: string;
  /** Present on some error responses (e.g. parse-google-purchasetoken) */
  reason?: string;
  [key: string]: any; // Allow additional fields like token, user, etc.
}

/**
 * Reset Password Response
 */
export interface ResetPasswordResponse extends BackendApiResponse {
  email: string;
}

/**
 * Auth Response (signup/login)
 */
export interface AuthResponse extends BackendApiResponse {
  token: string;
  user: BackendUser;
  isSignup?: boolean; // For social login
}

/**
 * Guest Login Response
 */
export interface GuestLoginResponse extends BackendApiResponse {
  token: string;
  guestId: string;
  isFirstTime: boolean;
  isSubscribed: boolean;
  guest: BackendUser;
}

/**
 * Refresh Token Response
 */
export interface RefreshTokenResponse extends BackendApiResponse {
  token: string;
  userId: string;
}

/**
 * Get User Profile Response
 */
export interface GetUserProfileResponse extends BackendApiResponse {
  user: BackendUser;
  token?: string;
  discount?: {
    isApplicable: boolean;
    endsAt: number;
  };
}

/**
 * Referral Response
 */
export interface ReferralResponse extends BackendApiResponse {
  userId: string;
  referralCode: string;
  successfulReferralCount: number;
  referredBy?: {
    _id: string;
    name: UserName;
    email: string;
    phone?: string;
    picture?: string;
    code: string;
    referralTimestampInMs: number;
  };
  referredUsers?: Array<{
    _id: string;
    name: UserName;
    email: string;
    phone?: string;
    picture?: string;
    isGuest: boolean;
  }>;
  message?: string;
}

/**
 * Subscription Response
 */
export interface SubscriptionResponse extends BackendApiResponse {
  userId: string;
  isSubscribed: boolean;
  isSubscriptionActive?: boolean;
  subscriptionProvider: string | null;
  googlePurchaseData?: Record<string, any>;
  applePurchaseData?: Record<string, any>;
}

/**
 * Parse Purchase Token Response
 */
export interface ParsePurchaseTokenResponse extends BackendApiResponse {
  type: "subscription" | "product";
  parsedPayload: any;
}

// ============================================
// Request Types
// ============================================

/**
 * Signup Request
 */
export interface SignupRequest {
  guestId?: string;
  email: string;
  phone?: string;
  fullName?: string;
  password: string;
  gender?: string;
  country?: string;
  age?: number;
  picture?: string;
}

/**
 * Login Request
 */
export interface LoginRequest {
  handle: string; // email or phone
  password: string;
}

/**
 * Social Login Request (Google/Apple)
 */
export interface SocialLoginRequest {
  credential: string; // ID token
  nonce?: string; // For Apple
  guestId?: string;
  fullName?: string;
}

/**
 * Guest Login Request
 */
export interface GuestLoginRequest {
  guestId?: string;
}

/**
 * Forgot Password Request
 */
export interface ForgotPasswordRequest {
  handle: string; // email or phone — POST /auth/forgot-password
}

/**
 * Reset Password Request
 */
export interface ResetPasswordRequest {
  token: string; // OTP token
  password: string;
  email: string;
}

/**
 * Update Profile Request
 */
export interface UpdateProfileRequest {
  password?: string;
  fullName?: string;
  phone?: string;
  picture?: string;
  country?: string;
  gender?: string;
  age?: number;
  timezone?: string;
  language?: string;
  ftueCompletion?: FtueCompletion;
  sellerDetails?: SellerDetails;
}

/**
 * Use Referral Code Request
 */
export interface UseReferralCodeRequest {
  code: string;
}

/**
 * Google Subscription Request
 * Matches backend: purchaseTime is ISO 8601 string (e.g. "2024-10-22T08:25:00.231Z").
 */
export interface GoogleSubscriptionRequest {
  purchaseToken: string;
  itemId: string;
  purchaseTime: string;
  isProduct: boolean;
  isLifetimePurchase: boolean;
  includesTrial: boolean;
}

/**
 * Apple Subscription Request
 * Backend expects receipt, isSandbox, and product/lifetime/trial flags. Wherever the backend needs isSandbox, it must call
 * validateReceiptIosSmart first; the return result to use is isSandbox = validation?.environment?.toLowerCase() === 'sandbox'.
 * isProduct, isLifetimePurchase, includesTrial are optional for backwards compatibility with stored pending payloads.
 */
export interface AppleSubscriptionRequest {
  receipt: string;
  isSandbox: boolean;
  isProduct?: boolean;
  isLifetimePurchase?: boolean;
  includesTrial?: boolean;
}

/**
 * Parse Google Purchase Token Request
 */
export interface ParseGooglePurchaseTokenRequest {
  purchaseToken: string;
  itemId: string;
  isProduct: boolean;
  packageName?: string;
}
