/**
 * Optimized API Logger
 * Fast logging with performance tracking.
 * Console output is dev-only; App Logs store captures when enabled (dev + prod).
 */

import { useAppLogsStore } from "../../features/app-logs/app-logs.store";

const appLog = (
  level: "debug" | "info" | "warn" | "error",
  message: string,
  metadata?: Record<string, unknown>
) => {
  if (!useAppLogsStore.getState().isEnabled) return;
  useAppLogsStore.getState()[level](message, metadata);
};

// Cache for stringified data to avoid re-stringifying
const stringifyCache = new Map<string, string>();
const CACHE_SIZE_LIMIT = 50;

/**
 * Fast JSON stringify with truncation for large objects
 */
const fastStringify = (data: any, maxLength: number = 2000): string => {
  if (!data) return "No data";

  // For primitives, return directly
  if (typeof data === "string") {
    return data.length > maxLength
      ? data.substring(0, maxLength) + "..."
      : data;
  }

  if (typeof data !== "object") {
    return String(data);
  }

  try {
    // Create cache key
    const cacheKey = JSON.stringify(data);
    if (stringifyCache.has(cacheKey)) {
      return stringifyCache.get(cacheKey)!;
    }

    // Stringify with truncation
    const str = JSON.stringify(data, null, 2);
    const truncated =
      str.length > maxLength
        ? str.substring(0, maxLength) + "... (truncated)"
        : str;

    // Cache it (with size limit)
    if (stringifyCache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = stringifyCache.keys().next().value;
      if (firstKey !== undefined) {
        stringifyCache.delete(firstKey);
      }
    }
    stringifyCache.set(cacheKey, truncated);

    return truncated;
  } catch {
    return "[Unable to stringify]";
  }
};

/** Safe preview for JWT / identity tokens — never log full credential. */
function maskCredential(value: unknown): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) {
    return { hasCredential: false, credentialLength: 0 };
  }
  return {
    hasCredential: true,
    credentialLength: value.length,
    credentialPreview:
      value.length > 24
        ? `${value.slice(0, 12)}…${value.slice(-8)}`
        : "(short)",
  };
}

function isAppleSocialLoginUrl(url?: string): boolean {
  return !!url && url.includes("/auth/social-login/apple");
}

function sanitizeSocialLoginRequestBody(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return { hasBody: false };
  }
  const body = data as Record<string, unknown>;
  return {
    ...maskCredential(body.credential),
    guestId: body.guestId ?? null,
    hasFullName: !!body.fullName,
    fullName: body.fullName ?? null,
  };
}

function sanitizeAuthApiResponse(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return { hasBody: false };
  }
  const body = data as Record<string, unknown>;
  const user =
    body.user && typeof body.user === "object"
      ? (body.user as Record<string, unknown>)
      : null;
  const token = body.token;
  return {
    error: body.error ?? null,
    message: body.message ?? null,
    isSignup: body.isSignup ?? null,
    hasToken: typeof token === "string" && token.length > 0,
    tokenLength: typeof token === "string" ? token.length : 0,
    userId: user?.id ?? user?._id ?? null,
    email: user?.email ?? null,
    socialProvider: user?.socialProvider ?? null,
  };
}
export const logRequest = (config: {
  method: string;
  url: string;
  baseURL?: string;
  params?: any;
  data?: any;
  token?: string;
  startTime?: number;
}): number => {
  const startTime = config.startTime || Date.now();
  const method = config.method?.toUpperCase() || "UNKNOWN";
  const fullUrl = `${config.baseURL || ""}${config.url}`;

  if (__DEV__) {
    const logParts = [
      `📤 [${method}] ${fullUrl}`,
      config.params ? `Params: ${fastStringify(config.params, 500)}` : null,
      config.data ? `Body: ${fastStringify(config.data, 1000)}` : null,
      config.token ? `Token: ${config.token.substring(0, 20)}...` : null,
    ].filter(Boolean);
    console.log(logParts.join(" | "));
  }

  appLog("debug", `[API] ${method} ${fullUrl}`, {
    params: config.params,
    hasBody: !!config.data,
    hasToken: !!config.token,
    ...(isAppleSocialLoginUrl(config.url)
      ? { appleSocialLoginRequest: sanitizeSocialLoginRequestBody(config.data) }
      : {}),
  });

  return startTime;
};

/**
 * Log API response (console in dev; App Logs when enabled)
 */
export const logResponse = (response: {
  method: string;
  url: string;
  baseURL?: string;
  status: number;
  statusText: string;
  data?: any;
  startTime?: number;
}): void => {
  const method = response.method?.toUpperCase() || "UNKNOWN";
  const fullUrl = `${response.baseURL || ""}${response.url}`;
  const duration = response.startTime
    ? `${Date.now() - response.startTime}ms`
    : "";

  if (__DEV__) {
    console.log(
      `📥 [${method}] ${response.status} ${response.statusText} ${fullUrl} ${duration}`,
      response.data ? `| Data: ${fastStringify(response.data, 1000)}` : ""
    );
  }

  appLog("info", `[API] ${method} ${response.status} ${fullUrl}`, {
    status: response.status,
    durationMs: response.startTime ? Date.now() - response.startTime : undefined,
    ...(isAppleSocialLoginUrl(response.url)
      ? { appleSocialLoginResponse: sanitizeAuthApiResponse(response.data) }
      : {}),
  });
};

/**
 * Log API error (console in dev; App Logs when enabled)
 */
export const logError = (error: {
  method?: string;
  url?: string;
  baseURL?: string;
  status?: number;
  statusText?: string;
  data?: any;
  message?: string;
  startTime?: number;
}): void => {
  const method = error.method?.toUpperCase() || "UNKNOWN";
  const fullUrl = `${error.baseURL || ""}${error.url || ""}`;
  const duration = error.startTime ? `${Date.now() - error.startTime}ms` : "";

  if (__DEV__) {
    if (error.status) {
      console.error(
        `❌ [${method}] ${error.status} ${
          error.statusText || ""
        } ${fullUrl} ${duration}`,
        error.data ? `| Error: ${fastStringify(error.data, 1000)}` : ""
      );
    } else {
      console.error(
        `❌ [${method}] ${fullUrl} ${duration} | ${
          error.message || "No response"
        }`
      );
    }
  }

  if (error.status) {
    appLog("error", `[API] ${method} ${error.status} ${fullUrl}`, {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      durationMs: error.startTime ? Date.now() - error.startTime : undefined,
      ...(isAppleSocialLoginUrl(error.url)
        ? { appleSocialLoginError: sanitizeAuthApiResponse(error.data) }
        : {}),
    });
  } else {
    appLog("error", `[API] ${method} ${fullUrl}`, {
      message: error.message || "No response",
      durationMs: error.startTime ? Date.now() - error.startTime : undefined,
    });
  }
};

/**
 * Clear stringify cache (call periodically if needed)
 */
export const clearLogCache = (): void => {
  stringifyCache.clear();
};
