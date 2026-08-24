/**
 * Firebase configuration and initialization
 *
 * Firebase is auto-initialized in React Native Firebase via native modules.
 * The google-services.json (Android) and GoogleService-Info.plist (iOS) files
 * are automatically read by the native SDKs.
 *
 * We use lazy imports for Firebase services to avoid initialization issues.
 * Firebase App is statically imported as recommended by React Native Firebase.
 */

import { getApps, firebase } from "@react-native-firebase/app";
import { getAppIntent } from "../env/appEnv";

/**
 * Expected Firebase project IDs per environment
 * DEV: birdzy-app-dev
 * PROD: birdzy-app
 */
const EXPECTED_PROJECT_IDS = {
  dev: "birdzy-app-dev",
  prod: "birdzy-app",
};

/**
 * Check if Firebase is initialized
 * Uses static import of getApps() for deterministic readiness check
 */
export function isFirebaseInitialized(): boolean {
  try {
    return getApps().length > 0;
  } catch (error) {
    // If getApps throws, Firebase isn't initialized yet
    return false;
  }
}

/**
 * Verify that the correct Firebase project is loaded based on app intent
 *
 * PANIC GUARD LOGIC:
 * - Panic ONLY when: APP_ENV === "dev" AND Firebase project is PROD
 * - DO NOT panic when: APP_ENV === "prod" (even if Metro is running)
 * - Release builds must never panic
 *
 * This prevents accidental use of prod Firebase in dev builds while allowing
 * intentional local PROD testing (Metro + prod env).
 */
export function verifyFirebaseProject(): void {
  if (!isFirebaseInitialized()) {
    if (__DEV__) {
      console.warn(
        "⚠️  Firebase not initialized yet, cannot verify project ID"
      );
    }
    return;
  }

  try {
    // Bundle id helps us distinguish true "dev app" binaries from prod-id binaries.
    // Some teams intentionally run a debug build with PROD bundle id / Firebase to test prod-only features.
    // In that scenario, PANIC GUARD should warn (not crash).
    let bundleId: string | null = null;
    try {
      const deviceInfo = require("react-native-device-info");
      bundleId =
        typeof deviceInfo?.getBundleId === "function"
          ? (deviceInfo.getBundleId() as string)
          : null;
    } catch {
      bundleId = null;
    }
    const isDevBundleId =
      typeof bundleId === "string" && bundleId.toLowerCase().includes(".dev");

    const app = firebase.app();
    const options = app.options;
    const currentProjectId = options.projectId;

    // Get app intent from environment variable (source of truth)
    const appIntent = getAppIntent();
    const isDevIntent = appIntent === "dev";
    const isProdIntent = appIntent === "prod";

    // Determine expected project ID based on app intent
    const expectedProjectId = isDevIntent
      ? EXPECTED_PROJECT_IDS.dev
      : EXPECTED_PROJECT_IDS.prod;

    const isProdFirebase = currentProjectId === EXPECTED_PROJECT_IDS.prod;
    const isDevFirebase = currentProjectId === EXPECTED_PROJECT_IDS.dev;

    // PANIC GUARD: Only panic when DEV intent is connected to PROD Firebase
    // This is the dangerous scenario we want to prevent
    if (isDevIntent && isProdFirebase && isDevBundleId) {
      const errorMessage =
        `🚨 PANIC GUARD: DEV app intent connected to PROD Firebase!\n` +
        `   App Intent: DEV (from APP_ENV/ENV)\n` +
        `   Expected Firebase: ${EXPECTED_PROJECT_IDS.dev}\n` +
        `   Actual Firebase: ${currentProjectId} (PROD)\n` +
        `   Bundle ID: ${bundleId ?? "unknown"}\n` +
        `   This is dangerous - dev builds should NEVER use prod Firebase!`;

      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // If JS intent says DEV but the binary is not a dev bundle id, do not crash.
    // This supports "debug build with prod bundle id" flows, while still warning loudly.
    if (isDevIntent && isProdFirebase && !isDevBundleId) {
      const warningMessage =
        `⚠️  Firebase project mismatch (allowed): DEV intent using PROD Firebase\n` +
        `   App Intent: DEV (from APP_ENV/ENV)\n` +
        `   Firebase: ${currentProjectId} (PROD)\n` +
        `   Bundle ID: ${bundleId ?? "unknown"}\n` +
        `   PANIC GUARD skipped because bundle id is not a ".dev" binary.`;
      console.warn(warningMessage);
    }

    // WARNING: PROD intent connected to DEV Firebase
    // Don't panic - just warn and log to Crashlytics
    if (isProdIntent && isDevFirebase) {
      const warningMessage =
        `⚠️  PROD app intent connected to DEV Firebase\n` +
        `   App Intent: PROD (from APP_ENV/ENV)\n` +
        `   Expected Firebase: ${EXPECTED_PROJECT_IDS.prod}\n` +
        `   Actual Firebase: ${currentProjectId} (DEV)\n` +
        `   This may indicate a configuration issue.`;

      console.warn(warningMessage);

      // Send to Crashlytics for visibility (non-blocking)
      try {
        const crashlyticsModule = require("@react-native-firebase/crashlytics");
        const crashlytics = crashlyticsModule?.default || crashlyticsModule;
        if (typeof crashlytics === "function") {
          crashlytics().recordError(
            new Error(
              `Firebase project mismatch in PROD intent: Expected ${EXPECTED_PROJECT_IDS.prod}, got ${currentProjectId}`
            )
          );
        }
      } catch (crashlyticsError) {
        // Silently fail if Crashlytics is not available
        if (__DEV__) {
          console.warn(
            "Could not send Firebase mismatch to Crashlytics:",
            crashlyticsError
          );
        }
      }
    }

    // Success case: Firebase project matches app intent
    if (currentProjectId === expectedProjectId) {
      if (__DEV__) {
        console.log(
          `✅ Firebase project verified: ${currentProjectId} (${appIntent.toUpperCase()} intent)`
        );
      }
    }
  } catch (error) {
    // Re-throw panic guard errors (they should crash the app)
    if (error instanceof Error && error.message.includes("PANIC GUARD")) {
      throw error;
    }

    // Log other errors but don't crash
    if (__DEV__) {
      console.warn("⚠️  Could not verify Firebase project ID:", error);
    }
  }
}

const FIREBASE_READY_CHECK_INTERVAL_MS = 100;
const FIREBASE_READY_MAX_WAIT_MS = 4000;

/**
 * Wait for Firebase app to be ready (native init can be async).
 * Resolves when getApps().length > 0 or after max wait.
 * @param maxWaitMs - Optional timeout in ms (default 4000). Use a shorter value (e.g. 2500) when calling from a user action to avoid blocking too long.
 */
export function waitForFirebaseReady(
  maxWaitMs = FIREBASE_READY_MAX_WAIT_MS
): Promise<boolean> {
  return new Promise((resolve) => {
    if (isFirebaseInitialized()) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      if (isFirebaseInitialized()) {
        clearInterval(id);
        resolve(true);
        return;
      }
      if (Date.now() - start >= maxWaitMs) {
        clearInterval(id);
        if (__DEV__)
          console.warn("Firebase did not become ready within timeout");
        resolve(false);
      }
    }, FIREBASE_READY_CHECK_INTERVAL_MS);
  });
}

/**
 * Initialize Firebase services. Called once when the app starts.
 * Waits for Firebase to be ready (with timeout), then configures Analytics/Crashlytics in background.
 */
export const initializeFirebase = async (): Promise<void> => {
  const ready = await waitForFirebaseReady();
  if (!ready) {
    if (__DEV__) {
      console.warn(
        "Firebase not ready; Remote Config, Feed, Analytics will use defaults or no-op until ready."
      );
    }
    return;
  }
  verifyFirebaseProject();

  Promise.resolve()
    .then(async () => {
      try {
        // Check if Firebase is ready using deterministic state check
        if (!isFirebaseInitialized()) {
          return;
        }

        let analytics: any;
        let crashlytics: any;
        try {
          const analyticsModule = require("@react-native-firebase/analytics");
          analytics = analyticsModule?.default || analyticsModule;
          const crashlyticsModule = require("@react-native-firebase/crashlytics");
          crashlytics = crashlyticsModule?.default || crashlyticsModule;
          if (
            typeof analytics !== "function" ||
            typeof crashlytics !== "function"
          ) {
            throw new Error("Firebase modules are not functions");
          }
        } catch (error) {
          if (__DEV__) {
            console.warn("Firebase modules not available:", error);
          }
          // Return early - modules will be available later
          return;
        }

        // Configure Crashlytics: Disabled in DEV, Enabled in PROD
        // This prevents polluted dashboards with dev data
        try {
          const crashlyticsInstance = crashlytics();
          if (__DEV__) {
            crashlyticsInstance.setCrashlyticsCollectionEnabled(false);
            console.log("✅ Firebase Crashlytics disabled (DEV mode)");
          } else {
            crashlyticsInstance.setCrashlyticsCollectionEnabled(true);
            console.log("✅ Firebase Crashlytics enabled (PROD mode)");
          }
        } catch (error: any) {
          // Silently fail - don't block app startup
          if (__DEV__) {
            console.warn("Failed to configure Crashlytics:", error);
          }
        }

        // Configure Analytics: enabled in all environments
        try {
          const analyticsInstance = analytics();
          await analyticsInstance.setAnalyticsCollectionEnabled(true);
          if (__DEV__) {
            console.log("✅ Firebase Analytics enabled");
          } else {
            console.log("✅ Firebase Analytics enabled (PROD mode)");
          }
        } catch (error: any) {
          if (__DEV__) {
            console.warn("Failed to configure Analytics:", error);
          }
        }

        if (__DEV__) {
          console.log("✅ Firebase initialization completed");
        }
      } catch (error) {
        if (__DEV__) {
          console.warn("Firebase initialization error:", error);
        }
      }
    })
    .catch((error) => {
      if (__DEV__) {
        console.warn("Firebase initialization background error:", error);
      }
    });
};

/**
 * Firestore exports
 * Use firestore() to get the Firestore instance
 * Lazy import to avoid initialization issues
 */
export const getFirestore = () => {
  const firestore = require("@react-native-firebase/firestore").default;
  return firestore();
};

export const firestoreService = {
  get: getFirestore,
};

/** GA/Firebase Analytics limits string param values (commonly 100 chars); long values can drop or corrupt events. */
const FIREBASE_ANALYTICS_STRING_PARAM_MAX = 100;

function truncateFirebaseAnalyticsParams(
  params?: Record<string, any>
): Record<string, any> | undefined {
  if (!params) return params;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "boolean") {
      // Booleans can cause the entire event to be dropped on iOS/Android.
      out[k] = v ? "true" : "false";
    } else if (
      typeof v === "string" &&
      v.length > FIREBASE_ANALYTICS_STRING_PARAM_MAX
    ) {
      out[k] = v.slice(0, FIREBASE_ANALYTICS_STRING_PARAM_MAX);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Firebase Analytics exports
 * Lazy imports to avoid initialization issues
 */
export const firebaseAnalytics = {
  logEvent: (
    name: string,
    params?: Record<string, any>
  ): Promise<void> | undefined => {
    const safeParams = truncateFirebaseAnalyticsParams(params);

    const runLog = (): Promise<void> | undefined => {
      try {
        if (!isFirebaseInitialized()) return undefined;
        const analyticsModule = require("@react-native-firebase/analytics");
        if (!analyticsModule?.default) return undefined;
        const analytics = analyticsModule.default;
        return analytics().logEvent(name, safeParams);
      } catch (error) {
        if (__DEV__) {
          console.warn("Firebase Analytics logEvent error:", error);
        }
        return undefined;
      }
    };

    if (isFirebaseInitialized()) {
      return runLog();
    }
    // Native app can be briefly unavailable on startup; retry instead of dropping the event.
    return waitForFirebaseReady(FIREBASE_READY_MAX_WAIT_MS).then((ready) => {
      if (!ready) return undefined;
      return runLog();
    });
  },

  setUserId: (userId: string | null) => {
    try {
      if (!isFirebaseInitialized()) return;
      const analyticsModule = require("@react-native-firebase/analytics");
      if (!analyticsModule?.default) return;
      const analytics = analyticsModule.default;
      return analytics().setUserId(userId || undefined);
    } catch (error) {
      if (__DEV__) {
        console.warn("Firebase Analytics setUserId error:", error);
      }
    }
  },

  setUserProperties: (properties: Record<string, any>) => {
    try {
      if (!isFirebaseInitialized()) return;
      const analyticsModule = require("@react-native-firebase/analytics");
      if (!analyticsModule?.default) return;
      const analytics = analyticsModule.default;
      return analytics().setUserProperties(properties);
    } catch (error) {
      if (__DEV__) {
        console.warn("Firebase Analytics setUserProperties error:", error);
      }
    }
  },

  setAnalyticsCollectionEnabled: (enabled: boolean) => {
    try {
      if (!isFirebaseInitialized()) return;
      const analyticsModule = require("@react-native-firebase/analytics");
      if (!analyticsModule?.default) return;
      const analytics = analyticsModule.default;
      return analytics().setAnalyticsCollectionEnabled(enabled);
    } catch (error) {
      if (__DEV__) {
        console.warn(
          "Firebase Analytics setAnalyticsCollectionEnabled error:",
          error
        );
      }
    }
  },

  resetAnalyticsData: () => {
    try {
      if (!isFirebaseInitialized()) return;
      const analyticsModule = require("@react-native-firebase/analytics");
      if (!analyticsModule?.default) return;
      const analytics = analyticsModule.default;
      return analytics().resetAnalyticsData();
    } catch (error) {
      if (__DEV__) {
        console.warn("Firebase Analytics resetAnalyticsData error:", error);
      }
    }
  },
};

/**
 * Firebase Remote Config exports
 * Lazy imports to avoid initialization issues
 */
export const firebaseRemoteConfig = {
  getValue: (key: string) => {
    if (!isFirebaseInitialized()) {
      if (__DEV__) {
        console.warn("Firebase not ready for Remote Config getValue");
      }
      return null;
    }
    const remoteConfig =
      require("@react-native-firebase/remote-config").default;
    return remoteConfig().getValue(key);
  },

  getAll: () => {
    if (!isFirebaseInitialized()) {
      if (__DEV__) {
        console.warn("Firebase not ready for Remote Config getAll");
      }
      return {};
    }
    const remoteConfig =
      require("@react-native-firebase/remote-config").default;
    return remoteConfig().getAll();
  },

  setDefaults: (defaults: Record<string, any>) => {
    if (!isFirebaseInitialized()) {
      if (__DEV__) {
        console.warn("Firebase not ready for Remote Config setDefaults");
      }
      return Promise.resolve();
    }
    const remoteConfig =
      require("@react-native-firebase/remote-config").default;
    return remoteConfig().setDefaults(defaults);
  },

  fetch: (expirationDurationSeconds?: number) => {
    if (!isFirebaseInitialized()) {
      if (__DEV__) {
        console.warn("Firebase not ready for Remote Config fetch");
      }
      return Promise.resolve();
    }
    const remoteConfig =
      require("@react-native-firebase/remote-config").default;
    return remoteConfig().fetch(expirationDurationSeconds);
  },

  fetchAndActivate: () => {
    if (!isFirebaseInitialized()) {
      if (__DEV__) {
        console.warn("Firebase not ready for Remote Config fetchAndActivate");
      }
      return Promise.resolve();
    }
    const remoteConfig =
      require("@react-native-firebase/remote-config").default;
    return remoteConfig().fetchAndActivate();
  },

  activate: () => {
    if (!isFirebaseInitialized()) {
      if (__DEV__) {
        console.warn("Firebase not ready for Remote Config activate");
      }
      return Promise.resolve();
    }
    const remoteConfig =
      require("@react-native-firebase/remote-config").default;
    return remoteConfig().activate();
  },

  setConfigSettings: (settings: { minimumFetchIntervalMillis?: number }) => {
    if (!isFirebaseInitialized()) {
      if (__DEV__) {
        console.warn("Firebase not ready for Remote Config setConfigSettings");
      }
      return;
    }
    const remoteConfig =
      require("@react-native-firebase/remote-config").default;
    return remoteConfig().setConfigSettings(settings);
  },
};

/**
 * Firebase Performance Monitoring exports
 * Lazy imports to avoid initialization issues
 */
export const firebasePerf = {
  startTrace: async (traceName: string) => {
    try {
      if (!isFirebaseInitialized()) return null;
      const perfModule = require("@react-native-firebase/perf");
      if (!perfModule?.default) return null;
      const perf = perfModule.default;
      return await perf().startTrace(traceName);
    } catch (error) {
      if (__DEV__) {
        console.warn("Firebase Performance startTrace error:", error);
      }
      return null;
    }
  },

  setPerformanceCollectionEnabled: (enabled: boolean) => {
    try {
      if (!isFirebaseInitialized()) return;
      const perfModule = require("@react-native-firebase/perf");
      if (!perfModule?.default) return;
      const perf = perfModule.default;
      return perf().setPerformanceCollectionEnabled(enabled);
    } catch (error) {
      if (__DEV__) {
        console.warn(
          "Firebase Performance setPerformanceCollectionEnabled error:",
          error
        );
      }
    }
  },
};

/**
 * Firebase Crashlytics exports
 * Lazy imports to avoid initialization issues
 */
export const firebaseCrashlytics = {
  recordError: (error: Error, jsErrorName?: string) => {
    if (!isFirebaseInitialized()) return;
    try {
      const crashlytics = require("@react-native-firebase/crashlytics").default;
      return crashlytics().recordError(error, jsErrorName);
    } catch (err) {
      if (__DEV__) {
        console.warn("Crashlytics recordError error:", err);
      }
    }
  },

  log: (message: string) => {
    if (!isFirebaseInitialized()) return;
    try {
      const crashlytics = require("@react-native-firebase/crashlytics").default;
      return crashlytics().log(message);
    } catch (err) {
      if (__DEV__) {
        console.warn("Crashlytics log error:", err);
      }
    }
  },

  setAttribute: (key: string, value: string) => {
    if (!isFirebaseInitialized()) return;
    try {
      const crashlytics = require("@react-native-firebase/crashlytics").default;
      return crashlytics().setAttribute(key, value);
    } catch (err) {
      if (__DEV__) {
        console.warn("Crashlytics setAttribute error:", err);
      }
    }
  },

  setUserId: (userId: string) => {
    if (!isFirebaseInitialized()) return;
    try {
      const crashlytics = require("@react-native-firebase/crashlytics").default;
      return crashlytics().setUserId(userId);
    } catch (err) {
      if (__DEV__) {
        console.warn("Crashlytics setUserId error:", err);
      }
    }
  },

  setCrashlyticsCollectionEnabled: (enabled: boolean) => {
    if (!isFirebaseInitialized()) return;
    try {
      const crashlytics = require("@react-native-firebase/crashlytics").default;
      return crashlytics().setCrashlyticsCollectionEnabled(enabled);
    } catch (err) {
      if (__DEV__) {
        console.warn("Crashlytics setCrashlyticsCollectionEnabled error:", err);
      }
    }
  },

  crash: () => {
    if (!isFirebaseInitialized()) return;
    try {
      const crashlytics = require("@react-native-firebase/crashlytics").default;
      return crashlytics().crash();
    } catch (err) {
      if (__DEV__) {
        console.warn("Crashlytics crash error:", err);
      }
    }
  },
};
