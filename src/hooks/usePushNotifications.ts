/**
 * Push Notifications Hook
 * Handles device token (FCM on Android, APNS on iOS) and device registration.
 * Follows Banknotes pattern: Android = FCM token, iOS = APNS token; platform "apple" | "android".
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDeviceManage } from "../features/notifications/device.store";
import { useAuthStore } from "../features/auth/auth.store";
import { getFirebaseId } from "../utils/deviceUtil";
import type { DeviceRegistrationRequest } from "../services/api/features/notification.api";
import { checkNotificationPermission } from "../services/permissions/permission.service";

export type RegisterDeviceOptions = {
  /** When false (default), only registers if permission is already granted. */
  requestPermission?: boolean;
};

// Lazy import Firebase Messaging to avoid initialization issues
let messaging: any = null;
const getMessaging = async () => {
  if (!messaging) {
    try {
      messaging = require("@react-native-firebase/messaging").default;
    } catch (error) {
      console.error("Failed to import Firebase Messaging:", error);
      return null;
    }
  }
  return messaging;
};

/**
 * Request notification permission.
 * Call only after registerDeviceForRemoteMessages() on iOS.
 */
const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const messagingModule = await getMessaging();
    if (!messagingModule) {
      return false;
    }

    const authStatus = await messagingModule().requestPermission();
    const enabled =
      authStatus === messagingModule.AuthorizationStatus.AUTHORIZED ||
      authStatus === messagingModule.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log("Notification permission granted");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Permission request failed:", error);
    return false;
  }
};

/**
 * Get the device token to send to /device API.
 * Call only after registerDeviceForRemoteMessages() + requestPermission() on iOS.
 * - Android: FCM token (messaging().getToken())
 * - iOS: APNS token (messaging().getAPNSToken()) — backend expects APNS, not FCM.
 */
export const getDeviceTokenForApi = async (): Promise<string | null> => {
  try {
    const messagingModule = await getMessaging();
    if (!messagingModule) {
      return null;
    }

    const msg = messagingModule();

    if (Platform.OS === "android") {
      const token = await msg.getToken();
      console.log(
        "Device token (FCM, Android):",
        token ? `${token.substring(0, 20)}...` : null
      );
      return token;
    }

    // iOS: APNS token only. Caller must have called registerDeviceForRemoteMessages() first.
    const apnsToken = await msg.getAPNSToken();
    if (apnsToken) {
      console.log(
        "Device token (APNS, iOS):",
        `${apnsToken.substring(0, 20)}...`
      );
    } else {
      console.warn("APNS token not yet available on iOS");
    }
    return apnsToken ?? null;
  } catch (error) {
    console.error("Error getting device token for API:", error);
    return null;
  }
};

/** @deprecated Use getDeviceTokenForApi for /device registration (FCM on Android, APNS on iOS). */
const getFCMToken = async (): Promise<string | null> => {
  return getDeviceTokenForApi();
};

/**
 * Hook to manage push notifications
 * Automatically registers device on mount if user is authenticated
 */
export const usePushNotifications = () => {
  const { manageDeviceData } = useDeviceManage();
  const { token, user } = useAuthStore();
  const tokenRefreshUnsubscribeRef = useRef<(() => void) | null>(null);
  const registrationInFlightRef = useRef(false);
  const lastRegistrationKeyRef = useRef<string | null>(null);
  const initializedForUserRef = useRef<string | null>(null);
  const lastRegisterAttemptAtRef = useRef(0);
  const REGISTER_ATTEMPT_COOLDOWN_MS = 60 * 1000;

  /**
   * Platform value for /device API: "apple" (iOS) | "android" (Android)
   */
  const getPlatformForApi = (): "apple" | "android" =>
    Platform.OS === "ios" ? "apple" : "android";

  /**
   * Register device with backend.
   * Order: registerDeviceForRemoteMessages (iOS) → permission check/request → getDeviceTokenForApi → POST /device.
   * Pass requestPermission: true only from explicit user actions (settings toggle, onboarding CTA).
   * @returns true if permission granted and device registered successfully, false otherwise.
   */
  const registerDevice = async (
    options: RegisterDeviceOptions = {}
  ): Promise<boolean> => {
    const { requestPermission: shouldRequestPermission = false } = options;
    const now = Date.now();
    if (now - lastRegisterAttemptAtRef.current < REGISTER_ATTEMPT_COOLDOWN_MS) {
      return false;
    }
    lastRegisterAttemptAtRef.current = now;
    if (registrationInFlightRef.current) {
      return false;
    }
    try {
      registrationInFlightRef.current = true;
      const messagingModule = await getMessaging();
      if (!messagingModule) {
        return false;
      }

      const msg = messagingModule();

      // 1. iOS: register for remote messages before permission or token
      if (Platform.OS === "ios") {
        if (!msg.isDeviceRegisteredForRemoteMessages) {
          await msg.registerDeviceForRemoteMessages();
        }
      }

      // 2. Permission — never prompt unless caller opted in (e.g. onboarding CTA, settings).
      let hasPermission = false;
      if (shouldRequestPermission) {
        hasPermission = await requestNotificationPermission();
      } else {
        const permissionResult = await checkNotificationPermission();
        hasPermission = permissionResult.granted;
      }
      if (!hasPermission) {
        console.log("Notification permission not granted");
        return false;
      }

      // 3. Get platform-specific token (FCM on Android, APNS on iOS)
      const deviceToken = await getDeviceTokenForApi();
      if (!deviceToken) {
        console.log("Failed to get device token");
        return false;
      }

      // iOS must send APNS token; backend may reject FCM token for iOS
      if (Platform.OS === "ios" && deviceToken.includes(":APA91")) {
        console.error(
          "iOS must send APNS token, not FCM. Got FCM-style token. Skip registration until APNS is available."
        );
        return false;
      }

      // 4. Get device UUID
      const deviceUuid = await getFirebaseId();
      const platform = getPlatformForApi();

      // 5. Prepare payload: userId (auth), platform, deviceId, deviceToken
      const payload: DeviceRegistrationRequest = {
        userId: user?.id ?? null,
        platform,
        deviceId: deviceUuid,
        deviceToken,
      };
      const registrationKey = `${payload.userId ?? "guest"}:${
        payload.deviceId
      }:${payload.deviceToken}`;
      if (lastRegistrationKeyRef.current === registrationKey) {
        return true;
      }

      const storedRegistrationKey = await AsyncStorage.getItem(
        "@device_registration_key"
      );
      if (storedRegistrationKey === registrationKey) {
        lastRegistrationKeyRef.current = registrationKey;
        return true;
      }

      console.log("Registering device:", {
        ...payload,
        deviceToken: `${deviceToken.substring(0, 20)}...`,
      });

      // 6. Send to backend (uses auth token from store via notification API client)
      const response = await manageDeviceData(payload);

      const didSucceed =
        response?.success === true ||
        response == null;
      if (didSucceed) {
        await AsyncStorage.setItem("@device_registered", "true");
        await AsyncStorage.setItem("@fcm_token", deviceToken);
        await AsyncStorage.setItem("@device_registration_key", registrationKey);
        lastRegistrationKeyRef.current = registrationKey;
        console.log("Device registered successfully");
        return true;
      }
      console.log("Device registration failed:", response);
      return false;
    } catch (error) {
      console.error("Device registration failed:", error);
      return false;
    } finally {
      registrationInFlightRef.current = false;
    }
  };

  /**
   * Setup token refresh listener (FCM on Android; on iOS re-fetch APNS and re-register)
   */
  const setupTokenRefreshListener = async () => {
    try {
      const messagingModule = await getMessaging();
      if (!messagingModule) {
        return;
      }

      const unsubscribe = messagingModule().onTokenRefresh(async () => {
        console.log("Device token refresh triggered");

        try {
          const deviceToken = await getDeviceTokenForApi();
          if (!deviceToken) return;
          if (Platform.OS === "ios" && deviceToken.includes(":APA91")) {
            console.warn(
              "iOS token refresh: got FCM-style token, skip re-register"
            );
            return;
          }

          await AsyncStorage.setItem("@fcm_token", deviceToken);
          const deviceUuid = await getFirebaseId();
          const payload: DeviceRegistrationRequest = {
            userId: user?.id ?? null,
            platform: getPlatformForApi(),
            deviceId: deviceUuid,
            deviceToken,
          };
          const registrationKey = `${payload.userId ?? "guest"}:${
            payload.deviceId
          }:${payload.deviceToken}`;
          if (lastRegistrationKeyRef.current === registrationKey) {
            return;
          }
          const storedRegistrationKey = await AsyncStorage.getItem(
            "@device_registration_key"
          );
          if (storedRegistrationKey === registrationKey) {
            lastRegistrationKeyRef.current = registrationKey;
            return;
          }
          await manageDeviceData(payload);
          await AsyncStorage.setItem(
            "@device_registration_key",
            registrationKey
          );
          lastRegistrationKeyRef.current = registrationKey;
        } catch (error) {
          console.error("Failed to update device token:", error);
        }
      });

      tokenRefreshUnsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (error) {
      console.error("Failed to setup token refresh listener:", error);
      return null;
    }
  };

  // Initialize on mount if authenticated
  useEffect(() => {
    if (!token || !user?.id) {
      return;
    }

    if (initializedForUserRef.current === user.id) {
      return;
    }
    initializedForUserRef.current = user.id;
    void registerDevice();
    void setupTokenRefreshListener();

    // Cleanup
    return () => {
      if (tokenRefreshUnsubscribeRef.current) {
        tokenRefreshUnsubscribeRef.current();
        tokenRefreshUnsubscribeRef.current = null;
      }
    };
  }, [user?.id, token]);

  return {
    registerDevice,
    getDeviceTokenForApi,
    getFCMToken,
  };
};
