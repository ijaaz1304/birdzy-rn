/**
 * Device Management Store
 * Handles device registration for push notifications
 * Following banknote app pattern
 */

import { create } from "zustand";
import {
  notificationApi,
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
} from "../../services/api/features/notification.api";

interface DeviceState {
  loading: boolean;
  error: {
    message: string;
    status: number;
    method: string;
  } | null;
  notificationIds: DeviceRegistrationResponse | null;
  status: number | null;
}

interface DeviceActions {
  manageDeviceData: (
    payload: DeviceRegistrationRequest
  ) => Promise<DeviceRegistrationResponse | null>;
  reset: () => void;
}

type DeviceStore = DeviceState & DeviceActions;

const initialState: DeviceState = {
  loading: false,
  error: null,
  notificationIds: null,
  status: null,
};

/**
 * Device management store
 * Registers device with backend for push notifications
 */
export const useDeviceManage = create<DeviceStore>((set) => ({
  ...initialState,

  /**
   * Register device with backend
   * Sends device info including FCM token to notification service
   */
  manageDeviceData: async (
    payload: DeviceRegistrationRequest
  ): Promise<DeviceRegistrationResponse | null> => {
    set({ loading: true, error: null, notificationIds: null });

    console.log("Device payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await notificationApi.registerDevice(payload);

      // Check if response indicates error
      if (response.error || !response.success) {
        set({
          loading: false,
          error: {
            message:
              response.reason || response.message || "Something went wrong!",
            status: response.status || 400,
            method: "POST",
          },
        });
        return null;
      }

      set({
        notificationIds: response,
        status: response.status || 200,
        loading: false,
        error: null,
      });

      return response;
    } catch (error: any) {
      console.error("Push Notification Error:", error);

      const errorMessage =
        error.response?.data?.reason ||
        error.response?.data?.message ||
        error.message ||
        "Something went wrong!";
      const errorStatus = error.response?.status || 500;

      set({
        loading: false,
        error: {
          message: errorMessage,
          status: errorStatus,
          method: "POST",
        },
      });

      return null;
    }
  },

  /**
   * Reset store state
   */
  reset: () => {
    set(initialState);
  },
}));
