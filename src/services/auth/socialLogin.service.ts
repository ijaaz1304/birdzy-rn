/**
 * Social Login Service
 * Handles Google and Apple Sign-In integration
 */

import { Platform } from "react-native";
import { SocialLoginRequest } from "../api/features/auth.api.types";
import {
  APP_CODE,
  ENV,
  API_BASE_URL,
  GOOGLE_WEB_CLIENT_ID,
  PLAY_STORE_ID,
} from "../../constants/env";
import { useAppLogsStore } from "../../features/app-logs/app-logs.store";

const appLogs = () => useAppLogsStore.getState();

const appLog = (message: string, metadata?: Record<string, unknown>) => {
  appLogs().info(message, metadata);
};

const appLogWarn = (message: string, metadata?: Record<string, unknown>) => {
  appLogs().warn(message, metadata);
};

const appLogError = (message: string, metadata?: Record<string, unknown>) => {
  appLogs().error(message, metadata);
};

/** Safe hint for verifying the correct OAuth web client is bundled (not the full secret). */
function maskWebClientId(id: string | undefined): string {
  if (!id?.trim()) return "(empty)";
  const trimmed = id.trim();
  if (trimmed.length <= 16) return "(set)";
  return `${trimmed.slice(0, 12)}…${trimmed.slice(-20)}`;
}

function getRuntimeBuildInfo(): Record<string, unknown> {
  let bundleId: string | null = null;
  let appVersion: string | null = null;
  let buildNumber: string | null = null;
  try {
    const deviceInfo = require("react-native-device-info");
    bundleId = deviceInfo.getBundleId?.() ?? null;
    appVersion = deviceInfo.getVersion?.() ?? null;
    buildNumber = deviceInfo.getBuildNumber?.() ?? null;
  } catch {
    // device-info optional at runtime
  }
  return {
    platform: Platform.OS,
    env: ENV,
    appCode: APP_CODE,
    buildMode: __DEV__ ? "debug" : "release",
    bundleId,
    appVersion,
    buildNumber,
    playStoreIdFromEnv: PLAY_STORE_ID,
  };
}

function getGoogleSignInDiagnostics(webClientId?: string) {
  const mismatch = getGoogleWebClientMismatch(webClientId);
  return {
    ...getRuntimeBuildInfo(),
    webClientIdSet: !!webClientId?.trim(),
    webClientIdLength: webClientId?.length ?? 0,
    webClientIdHint: maskWebClientId(webClientId),
    webClientIdMismatch: mismatch,
  };
}

/** Dev/prod APKs must bundle the OAuth web client for the same Firebase project as the app id. */
function getGoogleWebClientMismatch(webClientId?: string): string | null {
  if (Platform.OS !== "android" || !webClientId?.trim()) {
    return null;
  }

  let bundleId: string | null = null;
  try {
    bundleId = require("react-native-device-info").getBundleId?.() ?? null;
  } catch {
    return null;
  }
  if (!bundleId) {
    return null;
  }

  const expectedPrefix = bundleId.endsWith(".dev")
    ? "480281695791-"
    : "123389676792-";
  if (!webClientId.trim().startsWith(expectedPrefix)) {
    return `Bundle ${bundleId} requires GOOGLE_WEB_CLIENT_ID starting with ${expectedPrefix}. Rebuild APK with npm run env:dev or env:prod before ./gradlew.`;
  }
  return null;
}

function assertGoogleWebClientMatchesBundle(webClientId: string) {
  const mismatch = getGoogleWebClientMismatch(webClientId);
  if (!mismatch) {
    return;
  }
  appLogError("[AUTH] Google: web client ID does not match app package", {
    ...getGoogleSignInDiagnostics(webClientId),
    fix: mismatch,
  });
  throw new Error(mismatch);
}

function isGoogleDeveloperError(error: any): boolean {
  return (
    error?.code === 10 ||
    error?.code === "10" ||
    (error?.message &&
      String(error.message).toLowerCase().includes("developer"))
  );
}

function getBundleId(): string | null {
  try {
    return require("react-native-device-info").getBundleId?.() ?? null;
  } catch {
    return null;
  }
}

/** Known local debug keystore SHA-1 (android/app/debug.keystore). */
const ANDROID_DEBUG_SHA1 =
  "5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25";

type GoogleSignInAndroidScenario =
  | "prodDebug"
  | "devDebug"
  | "prodRelease"
  | "devRelease"
  | "unknown";

function getGoogleSignInAndroidScenario(): GoogleSignInAndroidScenario {
  if (Platform.OS !== "android") {
    return "unknown";
  }
  const bundleId = getBundleId();
  if (!bundleId) {
    return "unknown";
  }
  const isDevPackage = bundleId.endsWith(".dev");
  if (__DEV__) {
    return isDevPackage ? "devDebug" : "prodDebug";
  }
  return isDevPackage ? "devRelease" : "prodRelease";
}

function getGoogleDeveloperErrorContext(): {
  scenario: GoogleSignInAndroidScenario;
  likelyCause: string;
  fixSteps: string[];
  userMessage: string;
} {
  const scenario = getGoogleSignInAndroidScenario();
  const diagnostics = getGoogleSignInDiagnostics(GOOGLE_WEB_CLIENT_ID);

  if (diagnostics.webClientIdMismatch) {
    return {
      scenario,
      likelyCause: String(diagnostics.webClientIdMismatch),
      fixSteps: [
        "Dev: npm run env:dev then rebuild.",
        "Prod: npm run env:prod then rebuild.",
      ],
      userMessage: String(diagnostics.webClientIdMismatch),
    };
  }

  if (scenario === "prodDebug") {
    return {
      scenario,
      likelyCause:
        "prodDebug build: package com.trackzio.birds is signed with the DEBUG keystore, but prod Firebase only has the upload-key SHA-1.",
      fixSteps: [
        `Firebase → birdzy-app → Android app com.trackzio.birds → Add fingerprint → SHA-1: ${ANDROID_DEBUG_SHA1}`,
        "Download updated google-services.json → replace android/app/src/prod/google-services.json",
        "OR use npm run android (devDebug) for local Google Sign-In testing",
        "OR use npm run android:build:prod:apk with upload keystore for prod release testing",
      ],
      userMessage:
        "Google Sign-In does not work in prod debug builds until the debug SHA-1 is added to prod Firebase (see App Logs for steps).",
    };
  }

  if (scenario === "devDebug") {
    return {
      scenario,
      likelyCause:
        "devDebug SHA-1 missing from birdzy-app-dev Firebase, or OAuth consent screen blocks this account.",
      fixSteps: [
        `Firebase → birdzy-app-dev → Android app com.trackzio.birds.dev → verify SHA-1: ${ANDROID_DEBUG_SHA1}`,
        "Download updated google-services.json if you add fingerprints.",
      ],
      userMessage:
        "Google Sign-In is not set up for the dev app in Firebase (see GOOGLE_SIGNIN_TROUBLESHOOTING.md).",
    };
  }

  if (scenario === "prodRelease") {
    return {
      scenario,
      likelyCause:
        "prodRelease: upload-key or Play App signing SHA-1 missing from birdzy-app Firebase.",
      fixSteps: [
        "Local APK: add upload keystore SHA-1 to prod Firebase.",
        "Play Store APK: add App signing key SHA-1 from Play Console → App integrity.",
        "Download updated google-services.json and rebuild.",
      ],
      userMessage:
        "Google Sign-In is not set up for this release build in Firebase (see GOOGLE_SIGNIN_TROUBLESHOOTING.md).",
    };
  }

  return {
    scenario,
    likelyCause:
      "Android package name + signing certificate SHA-1 do not match Firebase / Google Cloud OAuth client.",
    fixSteps: [
      "See docs/GOOGLE_SIGNIN_TROUBLESHOOTING.md.",
      `Debug keystore SHA-1: ${ANDROID_DEBUG_SHA1}`,
    ],
    userMessage:
      "Google Sign-In is not set up for this app. Please add the app’s SHA-1 fingerprint in Firebase Console (see GOOGLE_SIGNIN_TROUBLESHOOTING.md).",
  };
}

function logGoogleDeveloperError(error: any) {
  const context = getGoogleDeveloperErrorContext();
  appLogError("[AUTH] Google signIn: DEVELOPER_ERROR (code 10)", {
    ...getGoogleSignInDiagnostics(GOOGLE_WEB_CLIENT_ID),
    scenario: context.scenario,
    nativeCode: error?.code ?? null,
    nativeMessage: error?.message ?? null,
    likelyCause: context.likelyCause,
    fixSteps: context.fixSteps,
  });
}

/**
 * Google Sign-In Service
 * Note: Requires @react-native-google-signin/google-signin package
 */
class GoogleSignInService {
  /**
   * Sign in with Google
   * Returns the ID token for backend authentication
   */
  async signIn(): Promise<{ idToken: string; userInfo?: any }> {
    const {
      GoogleSignin,
    } = require("@react-native-google-signin/google-signin");

    try {
      appLog("[AUTH] Google signIn: starting native flow", {
        step: "hasPlayServices",
        ...getGoogleSignInDiagnostics(GOOGLE_WEB_CLIENT_ID),
      });

      // Check if Google Play services are available (Android only)
      if (Platform.OS === "android") {
        const playServicesOk = await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        appLog("[AUTH] Google signIn: Play Services check", {
          playServicesOk,
        });
      }

      appLog("[AUTH] Google signIn: opening account picker", {
        step: "GoogleSignin.signIn",
      });
      const signInResult = await GoogleSignin.signIn();

      if (signInResult.type === "cancelled") {
        appLog("[AUTH] Google signIn: cancelled by user", {
          code: "SIGN_IN_CANCELLED",
        });
        throw new Error("Sign in was cancelled");
      }

      appLog("[AUTH] Google signIn: account selected, resolving idToken", {
        step: "signInResult.data.idToken || getTokens",
        hasIdTokenInSignInResponse: !!signInResult.data.idToken,
      });

      let idToken = signInResult.data.idToken;
      let accessToken: string | undefined;

      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens.idToken;
        accessToken = tokens.accessToken;
      }

      if (!idToken) {
        appLogError("[AUTH] Google signIn: missing idToken after signIn/getTokens", {
          hasAccessToken: !!accessToken,
        });
        throw new Error("Failed to get Google ID token");
      }

      const userInfo = signInResult.data;
      appLog("[AUTH] Google signIn: native success", {
        hasIdToken: true,
        idTokenLength: idToken.length,
        email: userInfo?.user?.email ?? null,
        hasUserInfo: !!userInfo,
      });

      return {
        idToken,
        userInfo,
      };
    } catch (error: any) {
      const cancelled =
        error?.code === "SIGN_IN_CANCELLED" ||
        String(error?.message ?? "")
          .toLowerCase()
          .includes("cancel");

      if (cancelled) {
        appLog("[AUTH] Google signIn: cancelled by user", {
          code: error?.code ?? null,
        });
        throw new Error("Sign in was cancelled");
      }

      if (error?.code === "IN_PROGRESS") {
        appLogWarn("[AUTH] Google signIn: already in progress", {
          code: error.code,
        });
        throw new Error("Sign in is already in progress");
      }

      if (error?.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        appLogError("[AUTH] Google signIn: Play Services not available", {
          code: error.code,
          message: error.message,
        });
        throw new Error("Google Play services not available");
      }

      if (isGoogleDeveloperError(error)) {
        const context = getGoogleDeveloperErrorContext();
        logGoogleDeveloperError(error);
        if (__DEV__) {
          console.warn(
            `[Google Sign-In] ${context.scenario}: ${context.likelyCause}`,
            context.fixSteps
          );
        }
        throw new Error(context.userMessage);
      }

      appLogError("[AUTH] Google signIn: native error", {
        ...getGoogleSignInDiagnostics(GOOGLE_WEB_CLIENT_ID),
        code: error?.code ?? null,
        message: error?.message ?? String(error),
        name: error?.name ?? null,
      });
      throw new Error(error.message || "Google sign in failed");
    }
  }

  /**
   * Configure Google Sign-In.
   * - Only web client ID from env; on iOS the native GoogleService-Info.plist provides the iOS client.
   */
  configure(webClientId: string) {
    try {
      assertGoogleWebClientMatchesBundle(webClientId);
      const {
        GoogleSignin,
      } = require("@react-native-google-signin/google-signin");

      const config = {
        webClientId,
        scopes: ["profile", "email"],
        offlineAccess: false,
      };
      appLog("[AUTH] Google configure", {
        ...getGoogleSignInDiagnostics(webClientId),
        scopes: config.scopes,
        offlineAccess: config.offlineAccess,
      });
      GoogleSignin.configure(config);
      appLog("[AUTH] Google configure: success");
    } catch (error: any) {
      appLogError("[AUTH] Google configure: failed", {
        message: error?.message ?? String(error),
        ...getGoogleSignInDiagnostics(webClientId),
      });
      const message = String(error?.message ?? "");
      const isMissingPackage =
        message.includes("Cannot find module") ||
        message.includes("Unable to resolve module");
      if (isMissingPackage) {
        console.warn(
          "Google Sign-In package not installed. Please install @react-native-google-signin/google-signin"
        );
      }
    }
  }
}

/**
 * Apple Sign-In Service
 * Note: Requires @invertase/react-native-apple-authentication package
 */
class AppleSignInService {
  /**
   * Sign in with Apple
   * Returns the ID token and identity token for backend authentication
   */
  async signIn(): Promise<{ idToken: string; nonce?: string; userInfo?: any }> {
    try {
      const appleAuth =
        require("@invertase/react-native-apple-authentication").default;

      appLog("[AUTH] Apple signIn: checking native support", {
        platform: Platform.OS,
        ...getRuntimeBuildInfo(),
      });

      if (!appleAuth.isSupported) {
        appLogError("[AUTH] Apple signIn: not supported on device", {
          platform: Platform.OS,
        });
        throw new Error("Apple Sign-In is not supported on this device");
      }

      const nonce =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      appLog("[AUTH] Apple signIn: opening native sheet", {
        step: "performRequest",
        requestedScopes: ["EMAIL", "FULL_NAME"],
        nonceLength: nonce.length,
      });

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        nonce,
      });

      appLog("[AUTH] Apple signIn: native response received", {
        hasIdentityToken: !!appleAuthRequestResponse.identityToken,
        identityTokenLength:
          appleAuthRequestResponse.identityToken?.length ?? 0,
        hasAuthorizationCode: !!appleAuthRequestResponse.authorizationCode,
        authorizationCodeLength:
          appleAuthRequestResponse.authorizationCode?.length ?? 0,
        appleUser: appleAuthRequestResponse.user ?? null,
        emailPresent: !!appleAuthRequestResponse.email,
        email: appleAuthRequestResponse.email ?? null,
        hasFullName: !!appleAuthRequestResponse.fullName,
        fullName: appleAuthRequestResponse.fullName
          ? {
              givenName: appleAuthRequestResponse.fullName.givenName ?? null,
              familyName: appleAuthRequestResponse.fullName.familyName ?? null,
              middleName: appleAuthRequestResponse.fullName.middleName ?? null,
              nickname: appleAuthRequestResponse.fullName.nickname ?? null,
            }
          : null,
        realUserStatus: appleAuthRequestResponse.realUserStatus ?? null,
        state: appleAuthRequestResponse.state ?? null,
      });

      if (!appleAuthRequestResponse.identityToken) {
        appLogError("[AUTH] Apple signIn: missing identity token", {
          appleUser: appleAuthRequestResponse.user ?? null,
          emailPresent: !!appleAuthRequestResponse.email,
        });
        throw new Error("Apple Sign-In failed - no identity token");
      }

      appLog("[AUTH] Apple signIn: native success", {
        identityTokenLength: appleAuthRequestResponse.identityToken.length,
        appleUser: appleAuthRequestResponse.user ?? null,
      });

      return {
        idToken: appleAuthRequestResponse.identityToken,
        nonce,
        userInfo: {
          user: appleAuthRequestResponse.user,
          email: appleAuthRequestResponse.email,
          fullName: appleAuthRequestResponse.fullName,
        },
      };
    } catch (error: any) {
      const cancelled =
        error.code === "1001" ||
        error.code === "ERR_CANCELED" ||
        String(error.message ?? "")
          .toLowerCase()
          .includes("cancel");

      if (cancelled) {
        appLog("[AUTH] Apple signIn: cancelled by user", {
          code: error.code ?? null,
          message: error.message ?? null,
        });
        throw new Error("Apple Sign-In was cancelled");
      }

      if (
        error.code === "1000" ||
        (error.message && String(error.message).includes("1000"))
      ) {
        appLogError("[AUTH] Apple signIn: unavailable (error 1000)", {
          code: error.code ?? null,
          message: error.message ?? null,
          fix: "Sign in to iCloud in Settings and ensure Sign in with Apple is enabled for this app.",
        });
        throw new Error(
          "Apple Sign-In is not available. Sign in to iCloud in Settings and ensure this app has Sign in with Apple enabled."
        );
      }

      appLogError("[AUTH] Apple signIn: native error", {
        ...getRuntimeBuildInfo(),
        code: error.code ?? null,
        message: error.message ?? String(error),
        name: error.name ?? null,
      });
      throw new Error(error.message || "Apple Sign-In failed");
    }
  }
}

/**
 * Social Login Service
 * Main service for handling social authentication
 */
class SocialLoginService {
  private googleService: GoogleSignInService;
  private appleService: AppleSignInService;

  constructor() {
    this.googleService = new GoogleSignInService();
    this.appleService = new AppleSignInService();
  }

  /**
   * Configure social login services
   * Should be called during app initialization
   */
  configure(googleWebClientId?: string) {
    if (googleWebClientId) {
      this.googleService.configure(googleWebClientId);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(guestId?: string): Promise<SocialLoginRequest> {
    appLog("[AUTH] Google signIn: user tapped Continue with Google", {
      guestId: guestId ?? null,
      ...getGoogleSignInDiagnostics(GOOGLE_WEB_CLIENT_ID),
    });

    try {
      const webClientId = GOOGLE_WEB_CLIENT_ID;
      if (!webClientId?.trim()) {
        appLogError("[AUTH] Google signIn: GOOGLE_WEB_CLIENT_ID missing in bundle", {
          ...getGoogleSignInDiagnostics(webClientId),
          fix:
            "Run npm run env:prod or env:dev before release build so .env is copied and bundled.",
        });
        throw new Error(
          "Google Sign-In is not configured. Add GOOGLE_WEB_CLIENT_ID to your .env file."
        );
      }

      assertGoogleWebClientMatchesBundle(webClientId);
      this.googleService.configure(webClientId);
      const result = await this.googleService.signIn();
      appLog("[AUTH] Google signIn: credential ready for backend", {
        hasIdToken: !!result.idToken,
        idTokenLength: result.idToken?.length ?? 0,
        hasUserInfo: !!result.userInfo,
        fullName: result.userInfo?.user?.name ?? null,
        guestId: guestId ?? null,
      });
      return {
        credential: result.idToken,
        guestId,
        fullName: result.userInfo?.user?.name || undefined,
      };
    } catch (error: any) {
      if (error.message === "Sign in was cancelled") {
        throw error;
      }
      appLogError("[AUTH] Google signIn: failed (UI or native)", {
        message: error?.message ?? String(error),
        guestId: guestId ?? null,
        ...getGoogleSignInDiagnostics(GOOGLE_WEB_CLIENT_ID),
      });
      throw new Error(`Google Sign-In failed: ${error.message}`);
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(guestId?: string): Promise<SocialLoginRequest> {
    appLog("[AUTH] Apple signIn: user tapped Continue with Apple", {
      platform: Platform.OS,
      guestId: guestId ?? null,
      ...getRuntimeBuildInfo(),
    });

    try {
      const result = await this.appleService.signIn();

      let fullName: string | undefined;
      if (result.userInfo?.fullName) {
        const { givenName, familyName } = result.userInfo.fullName;
        if (givenName || familyName) {
          fullName = [givenName, familyName].filter(Boolean).join(" ");
        }
      }

      appLog("[AUTH] Apple signIn: credential ready for backend", {
        hasIdToken: !!result.idToken,
        idTokenLength: result.idToken?.length ?? 0,
        appleUser: result.userInfo?.user ?? null,
        emailPresent: !!result.userInfo?.email,
        email: result.userInfo?.email ?? null,
        fullName: fullName ?? null,
        guestId: guestId ?? null,
      });

      // Backend: nonce is optional — do not pass it (align with rczky / Banknote auth doc)
      return {
        credential: result.idToken,
        guestId,
        fullName,
      };
    } catch (error: any) {
      if (error.message === "Apple Sign-In was cancelled") {
        throw error;
      }
      appLogError("[AUTH] Apple signIn: failed (UI or native)", {
        message: error?.message ?? String(error),
        guestId: guestId ?? null,
        ...getRuntimeBuildInfo(),
      });
      throw new Error(`Apple Sign-In failed: ${error.message}`);
    }
  }
}

export const socialLoginService = new SocialLoginService();

/** Call at app startup so App Logs captures Google Sign-In config before any sign-in attempt. */
export function logGoogleSignInStartupDiagnostics(): void {
  const webClientId = GOOGLE_WEB_CLIENT_ID;
  if (!webClientId?.trim()) {
    appLogError("[AUTH] Google startup: GOOGLE_WEB_CLIENT_ID missing", {
      ...getGoogleSignInDiagnostics(webClientId),
      fix: "Run npm run env:dev or env:prod before building.",
    });
    return;
  }
  appLog("[AUTH] Google startup: configured", {
    ...getGoogleSignInDiagnostics(webClientId),
  });
}

/** Logs bundled auth/API env — use App Logs on prod builds to verify correct .env was baked in. */
export function logSocialAuthStartupDiagnostics(): void {
  appLog("[AUTH] Social login startup", {
    ...getRuntimeBuildInfo(),
    apiBaseUrl: API_BASE_URL,
    googleWebClientIdHint: maskWebClientId(GOOGLE_WEB_CLIENT_ID),
    googleWebClientIdMismatch: getGoogleWebClientMismatch(GOOGLE_WEB_CLIENT_ID),
  });
}
