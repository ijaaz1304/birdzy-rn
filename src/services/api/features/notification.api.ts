/**
 * Notification API endpoints
 * Device registration for push notifications
 * Following banknote app pattern - no hardcoded values
 */

import axios, { AxiosInstance } from "axios";
import {
  NOTIFICATION_BASE_URL,
  API_TIMEOUT,
  APP_CODE,
} from "../../../constants/env";
import { API_ENDPOINTS } from "../../../constants/api";
import { useAuthStore } from "../../../features/auth/auth.store";

/**
 * Create axios instance for notification service
 * Uses separate base URL if different from main API.
 * Sends x-app-code header (BirdsDev / Birds) required by notification service.
 */
const createNotificationClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: NOTIFICATION_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-app-code": APP_CODE,
    },
  });

  // Add auth token interceptor
  instance.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log API request
      const method = config.method?.toUpperCase() || "UNKNOWN";
      const url = config.url || "";
      const fullUrl = `${config.baseURL || ""}${url}`;
      const requestBody = config.data
        ? typeof config.data === "string"
          ? config.data
          : JSON.stringify(config.data, null, 2)
        : null;

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📤 NOTIFICATION API REQUEST [${method}]`);
      console.log(`📍 URL: ${fullUrl}`);
      if (requestBody) {
        console.log(`📦 Request Body:\n${requestBody}`);
      }
      if (token) {
        console.log(`🔑 Auth Token: ${token.substring(0, 20)}...`);
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return config;
    },
    (error) => {
      console.error("❌ NOTIFICATION API REQUEST ERROR:", error.message);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  instance.interceptors.response.use(
    (response) => {
      const method = response.config.method?.toUpperCase() || "UNKNOWN";
      const url = response.config.url || "";
      const fullUrl = `${response.config.baseURL || ""}${url}`;
      const status = response.status;
      const responseData = response.data
        ? typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data, null, 2)
        : "No data";

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📥 NOTIFICATION API RESPONSE [${method}] ${status}`);
      console.log(`📍 URL: ${fullUrl}`);
      console.log(`📦 Response Body:\n${responseData}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return response;
    },
    (error) => {
      if (error.response) {
        const method = error.config?.method?.toUpperCase() || "UNKNOWN";
        const url = error.config?.url || "";
        const fullUrl = `${error.config?.baseURL || ""}${url}`;
        const status = error.response.status;
        const errorData = error.response.data
          ? typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data, null, 2)
          : "No error data";

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`❌ NOTIFICATION API ERROR RESPONSE [${method}] ${status}`);
        console.log(`📍 URL: ${fullUrl}`);
        console.log(`📦 Error Body:\n${errorData}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Device registration request payload
 * Matches notification service POST /device body: userId, platform, deviceId, deviceToken
 * Platform: "apple" (iOS) | "android" (Android) per API contract.
 */
export interface DeviceRegistrationRequest {
  userId: string | null;
  platform: "apple" | "android";
  deviceId: string; // Device UUID (persistent), e.g. from getFirebaseId()
  deviceToken: string; // FCM token (Android) or APNS token (iOS)
}

/**
 * Device registration response
 */
export interface DeviceRegistrationResponse {
  success: boolean;
  message?: string;
  deviceId?: string;
  registeredAt?: number;
  notificationEnabled?: boolean;
  error?: string;
  reason?: string;
  status?: number;
}

/**
 * Notification API service
 */
export const notificationApi = {
  /**
   * POST /device
   * Register device for push notifications
   *
   * Headers: x-app-code (MineralsDev / Minerals), Content-Type: application/json
   *
   * Request Body:
   * {
   *   "userId": "user_id_or_null",
   *   "platform": "apple" | "android",
   *   "deviceId": "device_uuid_here",
   *   "deviceToken": "fcm_token_here" (Android) | "apns_token_here" (iOS)
   * }
   *
   * Response:
   * { "success": true, "message": "...", "deviceId": "...", "registeredAt": ..., "notificationEnabled": ... }
   */
  registerDevice: async (
    data: DeviceRegistrationRequest
  ): Promise<DeviceRegistrationResponse> => {
    const client = createNotificationClient();
    const response = await client.post<DeviceRegistrationResponse>(
      API_ENDPOINTS.NOTIFICATION.REGISTER_DEVICE,
      data
    );
    return response.data;
  },
};
