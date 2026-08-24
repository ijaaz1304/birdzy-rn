/**
 * Error handling utilities
 * Centralized error handling for API calls
 */

import { AxiosError } from "axios";
import { ApiError, ApiResponse } from "./types";

/**
 * Custom API exception class
 */
export class ApiException extends Error {
  constructor(
    public message: string,
    public status?: number,
    public code?: string,
    public data?: any,
    public errors?: ApiError[]
  ) {
    super(message);
    this.name = "ApiException";
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}

/**
 * Network error class
 */
export class NetworkException extends Error {
  constructor(
    message: string = "Network error. Please check your connection."
  ) {
    super(message);
    this.name = "NetworkException";
    Object.setPrototypeOf(this, NetworkException.prototype);
  }
}

/**
 * Timeout error class
 */
export class TimeoutException extends Error {
  constructor(message: string = "Request timeout. Please try again.") {
    super(message);
    this.name = "TimeoutException";
    Object.setPrototypeOf(this, TimeoutException.prototype);
  }
}

/**
 * Normalize axios error to ApiException
 */
export function getErrorReasonFromResponse(data: unknown): string {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const reason = d.reason ?? d.message;
    if (typeof reason === "string") return reason;
  }
  return "";
}

/** Backend 403 when free tier caps collections, specimens, identifications, etc. */
export function isPaywallOrLimitReason(reason: string): boolean {
  const r = reason.toLowerCase();
  return /purchase.*plan|subscription|premium|upgrade|maximum collection|add more than.*collection|collection limit|more than \d+ collection|specimen limit|identification limit|daily limit|free limit|forbidden.*collection/.test(
    r
  );
}

export function getApiErrorReason(error: unknown): string {
  if (error instanceof ApiException) {
    return getErrorReasonFromResponse(error.data) || error.message || "";
  }
  if (error instanceof AxiosError && error.response?.data) {
    return getErrorReasonFromResponse(error.response.data);
  }
  if (error instanceof Error) return error.message;
  return "";
}

export function getApiErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiException) return error.status;
  if (error instanceof AxiosError) return error.response?.status;
  const status = (error as { status?: number })?.status;
  return typeof status === "number" ? status : undefined;
}

/** True for business-limit 403 (not session/auth expiry). */
export function isPaywallOrLimitError(error: unknown): boolean {
  const status = getApiErrorStatus(error);
  const reason = getApiErrorReason(error);
  if (status === 403 && isPaywallOrLimitReason(reason)) return true;
  if (status === 403 && reason.trim().length > 0 && !/jwt|token|session|expired|unauthorized|forbidden access/i.test(reason)) {
    // Collection/add and similar endpoints return a plain plan-limit reason on 403.
    return /plan|collection|specimen|identif|premium|subscription|limit|upgrade|purchase/.test(
      reason.toLowerCase()
    );
  }
  return isPaywallOrLimitReason(reason);
}

export function normalizeError(error: unknown): ApiException {
  if (error instanceof ApiException) {
    return error;
  }

  if (error instanceof NetworkException || error instanceof TimeoutException) {
    return error;
  }

  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new TimeoutException();
    }

    if (!error.response) {
      return new NetworkException();
    }

    const response = error.response;
    const data = response.data as ApiResponse | any;
    const status = response.status;
    const backendReason = getErrorReasonFromResponse(data);

    // Preserve paywall/limit 403 reason for upgrade flows (not "Session expired").
    if (status === 403 && isPaywallOrLimitError(error)) {
      return new ApiException(
        backendReason || data?.message || error.message || "An error occurred",
        status,
        data?.code,
        data,
        data?.errors
      );
    }

    // Never show raw 401/403 to the user — use a friendly message (session expired)
    const message =
      status === 401 || status === 403
        ? "Session expired. Please sign in again."
        : backendReason || data?.message || error.message || "An error occurred";

    return new ApiException(message, status, data?.code, data, data?.errors);
  }

  if (error instanceof Error) {
    return new ApiException(error.message);
  }

  return new ApiException("An unexpected error occurred");
}

/**
 * Normalize errors for login/signup/social-login — preserve backend message (not "Session expired").
 */
export function normalizeAuthObtainError(error: unknown): ApiException {
  if (error instanceof ApiException) {
    return error;
  }

  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new TimeoutException();
    }
    if (!error.response) {
      return new NetworkException();
    }

    const response = error.response;
    const data = response.data as ApiResponse | any;
    const status = response.status;
    const message =
      data?.reason ||
      data?.message ||
      (typeof data?.error === "string" ? data.error : undefined) ||
      error.message ||
      "Authentication failed";

    return new ApiException(message, status, data?.code, data, data?.errors);
  }

  return normalizeError(error);
}

/**
 * Check if error is a specific status code
 */
export function isErrorStatus(error: unknown, status: number): boolean {
  return error instanceof ApiException && error.status === status;
}

/** True when error is 401/403 or message indicates session expired (already handled by logout). */
export function isSessionExpiryError(error: unknown): boolean {
  if (isPaywallOrLimitError(error)) return false;
  if (error instanceof ApiException) {
    if (error.status === 401 || error.status === 403) return true;
    if (
      error.message &&
      /session expired|sign in again|jwt expired/i.test(error.message)
    )
      return true;
  }
  return false;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiException) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.status === undefined || // Network error
      error.status >= 500 || // Server error
      error.status === 408 || // Request timeout
      error.status === 429 // Too many requests (rate limit)
    );
  }
  return false;
}

/**
 * Get retry delay with exponential backoff
 */
export function getRetryDelay(
  attempt: number,
  baseDelay: number = 1000
): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkException || error instanceof TimeoutException;
}
