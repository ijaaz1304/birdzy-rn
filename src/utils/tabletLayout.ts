import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";

/** iPad hardware id from uname — works when app is iPhone-only on iPad (375×667 window). */
function isIosIpadHardware(): boolean {
  if (Platform.OS !== "ios") return false;
  const deviceId = DeviceInfo.getDeviceId().toLowerCase();
  if (deviceId.startsWith("ipad")) return true;
  const model = DeviceInfo.getModel().toLowerCase();
  return model.includes("ipad");
}

/**
 * True when UI should use tablet / iPad layout (centered phone column, letterboxing, etc.).
 * Phone → false (original layouts unchanged).
 *
 * iPhone-only builds on iPad report ~375×667 with isPad false — hardware id is the reliable signal.
 * Pass live window dimensions from `useWindowDimensions()` for Android / resizes.
 */
export function isTabletDevice(width: number, height: number): boolean {
  if (isIosIpadHardware()) return true;
  if (DeviceInfo.isTablet()) return true;
  if (Platform.OS === "ios" && Platform.isPad) return true;

  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);

  if (Platform.OS === "ios") {
    return minDim >= 744 && maxDim >= 1024;
  }
  if (Platform.OS === "android") {
    return minDim >= 600;
  }
  return false;
}
