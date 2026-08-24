/**
 * Axios instance with interceptors
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { useAuthStore } from "../../features/auth/auth.store";
import { normalizeError, normalizeAuthObtainError, isPaywallOrLimitReason } from "./errors";
import { API_BASE_URL, API_TIMEOUT } from "../../constants/env";
import { getRemoteConfigValue } from "../remoteConfig";
import { logRequest, logResponse, logError } from "./logger";

// Request deduplication - prevent duplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Create request key for deduplication
 * Returns null for auth endpoints so they are never deduplicated (each login/guest attempt is fresh).
 */
const getRequestKey = (config: InternalAxiosRequestConfig): string | null => {
  const url = config.url || "";
  const path = url.split("?")[0];
  const isAuth =
    path === "/auth/login" ||
    path === "/auth/signup" ||
    path === "/auth/guest-login" ||
    path.endsWith("/auth/social-login/google") ||
    path.endsWith("/auth/social-login/apple");
  if (isAuth) return null;
  return `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(
    config.params
  )}_${JSON.stringify(config.data)}`;
};

/**
 * Create axios instance
 * All configuration values come from environment constants - no hardcoded values
 */
// Get API timeout from remote config, fallback to env constant
const getApiTimeout = (): number => {
  try {
    return getRemoteConfigValue("apiTimeoutMs") || API_TIMEOUT;
  } catch {
    return API_TIMEOUT;
  }
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: getApiTimeout(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Request interceptor - Add auth token and log requests
 * Waits for authentication to complete if in progress
 */
// Auth paths that obtain a token — never wait for token for these (avoids deadlock)
const AUTH_OBTAIN_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/guest-login",
  "/auth/social-login/google",
  "/auth/social-login/apple",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const isAuthObtainRequest = (url?: string): boolean => {
  const path = (url || "").split("?")[0];
  return AUTH_OBTAIN_PATHS.some((p) => path === p || path.endsWith(p));
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get auth state
    const authStore = useAuthStore.getState();
    let token = authStore.token;

    // Do NOT wait for token when this request is login/signup/guest-login (we're obtaining the token).
    // Otherwise we deadlock: guest-login waits for token, token only arrives after guest-login completes.
    const isObtainingToken = isAuthObtainRequest(config.url);

    // If no token but auth is loading, wait briefly (cap to avoid blocking / unwanted loaders)
    if (!isObtainingToken && !token && authStore.isLoading) {
      const maxWaitTime = Math.min(
        Number(getRemoteConfigValue("apiAuthWaitTimeoutMs")) || 2000,
        2000
      );
      const checkInterval = Math.min(
        Number(getRemoteConfigValue("apiAuthCheckIntervalMs")) || 80,
        100
      );
      const startTime = Date.now();

      while (!token && Date.now() - startTime < maxWaitTime) {
        await new Promise<void>((resolve) =>
          setTimeout(() => resolve(), checkInterval)
        );
        const currentState = useAuthStore.getState();
        token = currentState.token;

        // If auth is no longer loading and still no token, break
        if (!currentState.isLoading && !token) {
          break;
        }
      }
    }

    // Auth obtain endpoints must not send a stale JWT (causes 401 + misleading "Session expired").
    if (token && config.headers && !isAuthObtainRequest(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let axios/platform set Content-Type with boundary for FormData (required for multipart uploads in RN)
    if (
      config.data &&
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      delete config.headers["Content-Type"];
    }

    // Store start time for performance tracking
    const startTime = Date.now();
    (config as any).__startTime = startTime;

    // Optimized logging (dev only)
    logRequest({
      method: config.method || "GET",
      url: config.url || "",
      baseURL: config.baseURL,
      params: config.params,
      data: config.data,
      token: token || undefined,
      startTime,
    });

    // Explicit log for refresh-auth-token (request)
    if (__DEV__ && isRefreshTokenRequest(config.url)) {
      console.log("[REFRESH-AUTH-TOKEN] Request", {
        method: config.method || "GET",
        url: config.url,
        baseURL: config.baseURL,
        hasToken: !!token,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    logError({ message: error.message });
    return Promise.reject(error);
  }
);

/** Single in-flight refresh promise so multiple 401s don't trigger multiple refresh calls or double logout. */
let refreshPromise: Promise<string> | null = null;

const REFRESH_TOKEN_PATH = "/auth/refresh-auth-token";

/** True if this request is the refresh-token API call (handles relative and full URLs). */
function isRefreshTokenRequest(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split("?")[0];
  return path === REFRESH_TOKEN_PATH || path.endsWith(REFRESH_TOKEN_PATH);
}

/** Get HTTP status from axios error or ApiException. */
function getErrorStatus(err: any): number | undefined {
  return err?.response?.status ?? err?.status ?? err?.statusCode;
}

/**
 * Response interceptor - Handle errors and token refresh, log responses
 *
 * 401 handling:
 * 1. If 401 is from the refresh endpoint itself → session invalid → logout once, reject.
 * 2. If user is guest → do not logout; reject so UI can handle.
 * 3. If we have token or user → call refresh token API once; on success retry original request with new token; on failure only logout if refresh returned 401/403 (not on 5xx or network error).
 * 4. If no token/user (e.g. not rehydrated) → do not logout; reject.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Optimized logging (dev only)
    const startTime = (response.config as any).__startTime;
    logResponse({
      method: response.config.method || "GET",
      url: response.config.url || "",
      baseURL: response.config.baseURL,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      startTime,
    });

    // Explicit log for refresh-auth-token (success response)
    if (__DEV__ && isRefreshTokenRequest(response.config.url)) {
      const d = response.data as
        | { error?: boolean; userId?: string; token?: string }
        | undefined;
      console.log("[REFRESH-AUTH-TOKEN] Response", {
        status: response.status,
        error: d?.error,
        userId: d?.userId,
        tokenPresent: !!d?.token,
        tokenLast4:
          typeof d?.token === "string" ? d.token.slice(-4) : undefined,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & {
          _retry?: boolean;
        })
      | undefined;
    const startTime = (error.config as any)?.__startTime;

    // Detect auth failures early so we can refresh-and-retry for 401/403.
    const status = error.response?.status;
    const isUnauthorized = status === 401;
    const isForbidden = status === 403;
    const reason =
      error.response?.data && typeof error.response.data === "object"
        ? (error.response.data as { reason?: string }).reason
        : undefined;
    const reasonStr = String(reason ?? "");
    const isPaywallForbidden =
      status === 403 && isPaywallOrLimitReason(reasonStr);
    const isJwtExpired =
      isUnauthorized || (reason && /jwt\s*expired/i.test(String(reason)));
    const isAuthRecoveryEligible403 = isForbidden && !isPaywallForbidden;
    const shouldAttemptAuthRecovery =
      isUnauthorized || isAuthRecoveryEligible403 || isJwtExpired;
    const willRetryOnAuthRecovery =
      originalRequest &&
      shouldAttemptAuthRecovery &&
      !originalRequest._retry &&
      !isRefreshTokenRequest(originalRequest.url);

    // Business-limit 403: reject immediately — no token refresh, no error toast upstream.
    if (isPaywallForbidden) {
      return Promise.reject(normalizeError(error));
    }

    // Optimized error logging (dev only). Skip red ❌ for 401/403 when we will refresh and retry.
    if (error.response) {
      if (!willRetryOnAuthRecovery && !isPaywallForbidden) {
        logError({
          method: error.config?.method,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          startTime,
        });
      }
    } else if (error.request) {
      logError({
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
        startTime,
      });
    }

    if (!originalRequest) {
      return Promise.reject(normalizeError(error));
    }

    // Login/signup/social-login: never refresh-and-retry; surface backend auth error as-is.
    if (isAuthObtainRequest(originalRequest.url)) {
      return Promise.reject(normalizeAuthObtainError(error));
    }

    // Explicit log for refresh-auth-token (error response)
    if (__DEV__ && isRefreshTokenRequest(originalRequest.url)) {
      console.log("[REFRESH-AUTH-TOKEN] Error response", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Handle 401/403: try refresh token API, then retry; logout only when refresh returns 401/403.
    // Guest users refresh via guest-login (inside authStore.refreshAuthToken).
    if (shouldAttemptAuthRecovery && !originalRequest._retry) {
      originalRequest._retry = true;

      const authStore = useAuthStore.getState();
      const user = authStore.user;
      const token = authStore.token;

      if (__DEV__) {
        console.log(
          "[AXIOS] 401/403 auth failure → refreshing auth token and retrying",
          { url: originalRequest.url, status }
        );
      }

      // 401 from the refresh endpoint itself → session invalid, do not call refresh again
      if (isRefreshTokenRequest(originalRequest.url)) {
        if (token && !user?.isGuest) {
          try {
            await authStore.logout();
          } catch (e) {
            if (__DEV__)
              console.warn("[AXIOS] Logout on refresh 401 failed:", e);
          }
        }
        return Promise.reject(normalizeError(error));
      }

      // Authenticated (including guest): refresh token then retry.
      // Guest: POST /auth/guest-login with guestId. Non-guest: GET /auth/refresh-auth-token.
      if (token || user) {
        if (__DEV__) {
          console.log("[AXIOS] Refreshing auth token", {
            mode: user?.isGuest ? "guest-login" : "refresh-auth-token",
            status,
            url: originalRequest.url,
          });
        }
        if (!refreshPromise) {
          refreshPromise = authStore.refreshAuthToken().finally(() => {
            refreshPromise = null;
          });
        }
        try {
          const newToken = await refreshPromise;
          // Non-guest: after refresh-token, sync auth/me in background.
          if (!user?.isGuest) {
            try {
              await authStore.refreshProfileSilent();
            } catch {
              // Best-effort sync only; request retry should still proceed.
            }
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError: any) {
          const status = getErrorStatus(refreshError);
          // Only logout when refresh API returned 401/403 (token invalid or expired). Do NOT logout on 5xx, timeout, or network error.
          if (status === 401 || status === 403) {
            try {
              await useAuthStore.getState().logout();
            } catch (e) {
              if (__DEV__)
                console.warn("[AXIOS] Logout on refresh 401/403 failed:", e);
            }
          }
          return Promise.reject(normalizeError(refreshError));
        }
      }

      // No token and no user (e.g. store not rehydrated yet): do not logout
      if (__DEV__) {
        console.log(
          "[REFRESH-AUTH-TOKEN] Skipping refresh (no token and no user)"
        );
      }
      return Promise.reject(normalizeError(error));
    }

    const normalizedError = normalizeError(error);
    return Promise.reject(normalizedError);
  }
);

// Error handling moved to errors.ts

/**
 * API helper functions with typed responses and request deduplication
 * Backend returns data directly (not wrapped in ApiResponse)
 */
export const api = {
  get: async <T = any>(
    url: string,
    config?: InternalAxiosRequestConfig
  ): Promise<T> => {
    const requestKey = getRequestKey({
      ...config,
      method: "GET",
      url,
    } as InternalAxiosRequestConfig);

    if (requestKey !== null && pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!;
    }

    const request = apiClient
      .get<T>(url, config)
      .then((response) => {
        if (requestKey !== null) pendingRequests.delete(requestKey);
        return response.data;
      })
      .catch((error) => {
        if (requestKey !== null) pendingRequests.delete(requestKey);
        throw error;
      });

    if (requestKey !== null) pendingRequests.set(requestKey, request);
    return request;
  },

  post: async <T = any>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<T> => {
    const requestKey = getRequestKey({
      ...config,
      method: "POST",
      url,
      data,
    } as InternalAxiosRequestConfig);

    if (requestKey !== null && pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!;
    }

    const request = apiClient
      .post<T>(url, data, config)
      .then((response) => {
        if (requestKey !== null) pendingRequests.delete(requestKey);
        return response.data;
      })
      .catch((error) => {
        if (requestKey !== null) pendingRequests.delete(requestKey);
        throw error;
      });

    if (requestKey !== null) pendingRequests.set(requestKey, request);
    return request;
  },

  put: async <T = any>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T = any>(
    url: string,
    data?: any,
    config?: InternalAxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T = any>(
    url: string,
    config?: InternalAxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
};

export default apiClient;
