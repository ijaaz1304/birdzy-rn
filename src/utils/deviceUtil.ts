/**
 * Device Utility
 * Generates and manages persistent device UUID
 * Following banknote app pattern
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
const DEVICE_ID_KEY = "@firebase_id";

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create persistent device UUID
 * This ID persists across app installs (until user clears app data)
 *
 * @returns Device UUID string
 */
export const getFirebaseId = async (): Promise<string> => {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate new UUID if not found
      deviceId = generateUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log("Generated new device ID:", deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("Error getting device ID:", error);
    // Fallback: generate a temporary ID (won't persist)
    return generateUUID();
  }
};

/**
 * Clear device ID (useful for testing or logout)
 */
export const clearDeviceId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error("Error clearing device ID:", error);
  }
};

/**
 * Get device platform
 */
export const getDevicePlatform = (): "ios" | "android" => {
  return Platform.OS === "ios" ? "ios" : "android";
};
