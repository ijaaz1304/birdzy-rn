/**
 * Error Reporting Service
 * Centralized error reporting to Crashlytics with context
 */

import { firebaseCrashlytics } from "../../lib/firebase";
import { Platform } from "react-native";
import { getVersion, getBuildNumber } from "react-native-device-info";

export interface ErrorContext {
  screen?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, string>;
}

/**
 * Report error to Crashlytics with context
 */
export const reportError = async (
  error: Error | string,
  context?: ErrorContext
): Promise<void> => {
  try {
    const crashlytics = firebaseCrashlytics;
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorStack = typeof error === "string" ? undefined : error.stack;

    // Set context attributes
    if (context?.screen) {
      crashlytics.setAttribute("screen", context.screen);
    }
    if (context?.action) {
      crashlytics.setAttribute("action", context.action);
    }
    if (context?.userId) {
      crashlytics.setUserId(context.userId);
    }

    // Set platform and version info
    crashlytics.setAttribute("platform", Platform.OS);
    try {
      if (getVersion) {
        const version = getVersion();
        crashlytics.setAttribute("app_version", version);
      }
      if (getBuildNumber) {
        const buildNumber = getBuildNumber();
        crashlytics.setAttribute("build_number", buildNumber);
      }
    } catch {
      // Device info not available
    }

    // Set additional context data
    if (context?.additionalData) {
      Object.entries(context.additionalData).forEach(([key, value]) => {
        crashlytics.setAttribute(key, value);
      });
    }

    // Log error message
    crashlytics.log(`Error: ${errorMessage}`);
    if (errorStack) {
      crashlytics.log(`Stack: ${errorStack}`);
    }

    // Record error
    if (typeof error === "string") {
      crashlytics.recordError(new Error(errorMessage), "CustomError");
    } else {
      crashlytics.recordError(error, error.name || "Error");
    }
  } catch (reportingError) {
    // Silently fail - don't crash app if error reporting fails
    if (__DEV__) {
      console.warn("Failed to report error to Crashlytics:", reportingError);
    }
  }
};

/**
 * Report API error with network context
 */
export const reportApiError = async (
  endpoint: string,
  error: Error,
  statusCode?: number,
  requestData?: Record<string, any>
): Promise<void> => {
  try {
    const context: ErrorContext = {
      screen: "API",
      action: "api_call",
      additionalData: {
        endpoint,
        status_code: statusCode?.toString() || "unknown",
        error_message: error.message,
      },
    };

    if (requestData) {
      // Add sanitized request data (no sensitive info)
      Object.entries(requestData).forEach(([key, value]) => {
        if (typeof value === "string" && value.length < 100) {
          context.additionalData![`request_${key}`] = value;
        }
      });
    }

    await reportError(error, context);
  } catch (reportingError) {
    if (__DEV__) {
      console.warn("Failed to report API error:", reportingError);
    }
  }
};

/**
 * Set user context for error reporting
 */
export const setUserContext = async (
  userId: string,
  email?: string
): Promise<void> => {
  try {
    const crashlytics = firebaseCrashlytics;
    crashlytics.setUserId(userId);
    if (email) {
      crashlytics.setAttribute("user_email", email);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to set user context:", error);
    }
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = async (): Promise<void> => {
  try {
    const crashlytics = firebaseCrashlytics;
    crashlytics.setUserId("");
    crashlytics.setAttribute("user_email", "");
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to clear user context:", error);
    }
  }
};
