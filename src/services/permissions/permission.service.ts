/**
 * Permission Service
 * Unified permission handling for Camera, Location, Notifications, and Storage
 *
 * Note: For full functionality, install react-native-permissions:
 * npm install react-native-permissions
 *
 * For iOS: Follow setup instructions in react-native-permissions docs
 * For Android: Add permissions to AndroidManifest.xml (already done)
 */

import { Platform, Linking, PermissionsAndroid } from "react-native";
import { showAlert } from "../../store/alert.store";
import { Camera } from "react-native-vision-camera";

// Try to import react-native-permissions, fallback if not installed
let PERMISSIONS: any;
let RESULTS: any;
let check: any;
let request: any;
let openSettingsRNP: any;
let checkNotifications: any;
let requestNotifications: any;

try {
  const RNP = require("react-native-permissions");
  PERMISSIONS = RNP.PERMISSIONS;
  RESULTS = RNP.RESULTS;
  check = RNP.check;
  request = RNP.request;
  openSettingsRNP = RNP.openSettings;
  const notifications = require("react-native-permissions");
  checkNotifications = notifications.checkNotifications;
  requestNotifications = notifications.requestNotifications;
} catch (error) {
  console.warn(
    "react-native-permissions not installed. Some permission features may be limited."
  );
  // Provide fallback values
  RESULTS = {
    UNAVAILABLE: "unavailable",
    DENIED: "denied",
    LIMITED: "limited",
    GRANTED: "granted",
    BLOCKED: "blocked",
  };
}

export type PermissionType =
  | "camera"
  | "location"
  | "notifications"
  | "storage"
  | "photos"
  | "microphone";

export type PermissionStatus =
  | "not-determined"
  | "denied"
  | "restricted"
  | "authorized"
  | "granted"
  | "blocked"
  | "unavailable"
  | "limited";

export interface PermissionResult {
  granted: boolean;
  status: PermissionStatus | string;
  canRequestAgain: boolean;
  blocked: boolean;
}

const isMediaLibraryGranted = (status: string): boolean =>
  status === RESULTS.GRANTED ||
  status === RESULTS.LIMITED ||
  status === "granted" ||
  status === "limited";

/**
 * Android photos permission for in-app gallery (CameraRoll).
 * API 33+ uses READ_MEDIA_IMAGES; older versions use READ_EXTERNAL_STORAGE.
 */
const getAndroidPhotosPermission = (): string | null => {
  if (!PERMISSIONS) return null;
  if (Number(Platform.Version) >= 33) {
    return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
  }
  return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
};

/**
 * Get the appropriate permission constant based on platform and type
 */
const getPermissionConstant = (type: PermissionType): string | null => {
  if (!PERMISSIONS) {
    return null; // react-native-permissions not installed
  }

  if (Platform.OS === "ios") {
    switch (type) {
      case "camera":
        return PERMISSIONS.IOS.CAMERA;
      case "location":
        return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      case "notifications":
        return PERMISSIONS.IOS.NOTIFICATIONS;
      case "storage":
      case "photos":
        return PERMISSIONS.IOS.PHOTO_LIBRARY;
      case "microphone":
        return PERMISSIONS.IOS.MICROPHONE;
      default:
        throw new Error(`Unsupported permission type: ${type}`);
    }
  } else {
    switch (type) {
      case "camera":
        return PERMISSIONS.ANDROID.CAMERA;
      case "microphone":
        return PERMISSIONS.ANDROID.RECORD_AUDIO;
      case "location":
        return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      case "notifications":
        return PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
      case "storage":
      case "photos":
        return getAndroidPhotosPermission();
      default:
        throw new Error(`Unsupported permission type: ${type}`);
    }
  }
};

/**
 * Check camera permission status
 * Uses react-native-vision-camera for camera-specific checks
 */
export const checkCameraPermission = async (): Promise<PermissionResult> => {
  try {
    // Prefer react-native-permissions when available (can detect BLOCKED vs DENIED on Android)
    const perm = getPermissionConstant("camera");
    if (perm && check && RESULTS) {
      const r = await check(perm);
      const statusStr = String(r);
      const granted = statusStr === RESULTS.GRANTED || statusStr === "granted";
      const blocked = statusStr === RESULTS.BLOCKED || statusStr === "blocked";
      const limited = statusStr === RESULTS.LIMITED || statusStr === "limited";

      return {
        granted: granted || limited,
        status: granted || limited ? "authorized" : (statusStr as any),
        canRequestAgain: statusStr === RESULTS.DENIED || statusStr === "denied",
        blocked,
      };
    }

    const cameraStatus = await Camera.getCameraPermissionStatus();
    // Vision Camera returns: 'granted' | 'not-determined' | 'denied' | 'restricted' (and some versions use 'authorized')
    const statusStr = String(cameraStatus).toLowerCase();
    const isGranted = statusStr === "authorized" || statusStr === "granted";
    const statusMap: Record<string, PermissionStatus> = {
      authorized: "authorized",
      granted: "authorized",
      denied: "denied",
      restricted: "restricted",
      "not-determined": "not-determined",
    };
    const status = statusMap[statusStr] || "not-determined";

    const isAndroid = Platform.OS === "android";
    return {
      granted: isGranted,
      status: isGranted ? "authorized" : status,
      // Android can generally re-request after "denied"; iOS cannot.
      canRequestAgain:
        statusStr === "not-determined" || (isAndroid && statusStr === "denied"),
      // VisionCamera can't distinguish "blocked" on Android; treat only iOS restricted as blocked.
      blocked:
        !isAndroid && (statusStr === "denied" || statusStr === "restricted"),
    };
  } catch (error) {
    console.error("Error checking camera permission:", error);
    return {
      granted: false,
      status: "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
};

/**
 * Request camera permission
 * Uses react-native-vision-camera for camera-specific requests
 */
export const requestCameraPermission = async (): Promise<PermissionResult> => {
  try {
    // Prefer react-native-permissions when available (can detect BLOCKED vs DENIED on Android)
    const perm = getPermissionConstant("camera");
    if (perm && request && RESULTS) {
      const r = await request(perm);
      const statusStr = String(r);
      const granted = statusStr === RESULTS.GRANTED || statusStr === "granted";
      const blocked = statusStr === RESULTS.BLOCKED || statusStr === "blocked";
      const limited = statusStr === RESULTS.LIMITED || statusStr === "limited";

      return {
        granted: granted || limited,
        status: granted || limited ? "authorized" : (statusStr as any),
        canRequestAgain: statusStr === RESULTS.DENIED || statusStr === "denied",
        blocked,
      };
    }

    const cameraStatus = await Camera.requestCameraPermission();
    // Vision Camera returns: 'granted' | 'not-determined' | 'denied' | 'restricted' (and some versions use 'authorized')
    const statusStr = String(cameraStatus).toLowerCase();
    const isGranted = statusStr === "authorized" || statusStr === "granted";
    const statusMap: Record<string, PermissionStatus> = {
      authorized: "authorized",
      granted: "authorized",
      denied: "denied",
      restricted: "restricted",
      "not-determined": "not-determined",
    };
    const status = statusMap[statusStr] || "not-determined";

    const isAndroid = Platform.OS === "android";
    return {
      granted: isGranted,
      status: isGranted ? "authorized" : status,
      canRequestAgain: isAndroid && statusStr === "denied",
      blocked:
        !isAndroid && (statusStr === "denied" || statusStr === "restricted"),
    };
  } catch (error) {
    console.error("Error requesting camera permission:", error);
    return {
      granted: false,
      status: "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
};

/**
 * Check notification permission status
 */
export const checkNotificationPermission =
  async (): Promise<PermissionResult> => {
    try {
      if (!checkNotifications) {
        // Fallback if react-native-permissions not installed
        return {
          granted: false,
          status: "denied" as any,
          canRequestAgain: true,
          blocked: false,
        };
      }

      const { status } = await checkNotifications();

      return {
        granted: status === RESULTS.GRANTED,
        status: status,
        canRequestAgain: status === RESULTS.DENIED,
        blocked: status === RESULTS.BLOCKED,
      };
    } catch (error: any) {
      // Handle "Notifications permission pod is missing" error gracefully
      if (
        error?.message?.includes("pod is missing") ||
        error?.message?.includes("Notifications permission")
      ) {
        if (__DEV__) {
          console.warn(
            "Notification permission pod not available. This is normal if react-native-permissions iOS pod is not installed."
          );
        }
        return {
          granted: false,
          status: "unavailable" as any,
          canRequestAgain: false,
          blocked: false,
        };
      }

      console.error("Error checking notification permission:", error);
      return {
        granted: false,
        status: RESULTS?.DENIED || "denied",
        canRequestAgain: false,
        blocked: true,
      };
    }
  };

/**
 * Request notification permission
 */
export const requestNotificationPermission =
  async (): Promise<PermissionResult> => {
    try {
      if (!requestNotifications) {
        // Fallback if react-native-permissions not installed
        return {
          granted: false,
          status: "denied" as any,
          canRequestAgain: false,
          blocked: true,
        };
      }

      const { status } = await requestNotifications([
        "alert",
        "sound",
        "badge",
      ]);
      const statusStr = String(status);

      return {
        granted: statusStr === RESULTS?.GRANTED || statusStr === "granted",
        status: statusStr as PermissionStatus,
        canRequestAgain: false,
        blocked: statusStr === RESULTS?.BLOCKED || statusStr === "blocked",
      };
    } catch (error: any) {
      // Handle "Notifications permission pod is missing" error gracefully
      if (
        error?.message?.includes("pod is missing") ||
        error?.message?.includes("Notifications permission")
      ) {
        if (__DEV__) {
          console.warn(
            "Notification permission pod not available. This is normal if react-native-permissions iOS pod is not installed."
          );
        }
        return {
          granted: false,
          status: "unavailable" as any,
          canRequestAgain: false,
          blocked: false,
        };
      }

      console.error("Error requesting notification permission:", error);
      return {
        granted: false,
        status: RESULTS?.DENIED || "denied",
        canRequestAgain: false,
        blocked: true,
      };
    }
  };

/**
 * Check location permission status
 */
export const checkLocationPermission = async (): Promise<PermissionResult> => {
  try {
    if (!check || !PERMISSIONS) {
      return {
        granted: false,
        status: "not-determined" as any,
        canRequestAgain: true,
        blocked: false,
      };
    }

    if (Platform.OS === "android") {
      const [fineStatus, coarseStatus] = await Promise.all([
        check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION),
        check(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION),
      ]);
      const granted =
        fineStatus === RESULTS.GRANTED || coarseStatus === RESULTS.GRANTED;
      const blocked =
        fineStatus === RESULTS.BLOCKED && coarseStatus === RESULTS.BLOCKED;
      const status = granted
        ? RESULTS.GRANTED
        : blocked
        ? RESULTS.BLOCKED
        : fineStatus === RESULTS.DENIED || coarseStatus === RESULTS.DENIED
        ? RESULTS.DENIED
        : fineStatus;

      return {
        granted,
        status,
        canRequestAgain:
          !granted &&
          !blocked &&
          (fineStatus === RESULTS.DENIED || coarseStatus === RESULTS.DENIED),
        blocked,
      };
    }

    const permission = getPermissionConstant("location");
    if (!permission) {
      return {
        granted: false,
        status: "not-determined" as any,
        canRequestAgain: true,
        blocked: false,
      };
    }

    const status = await check(permission);

    return {
      granted: status === RESULTS.GRANTED,
      status: status,
      canRequestAgain: status === RESULTS.DENIED,
      blocked: status === RESULTS.BLOCKED,
    };
  } catch (error) {
    console.error("Error checking location permission:", error);
    return {
      granted: false,
      status: RESULTS?.DENIED || "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
};

const LOCATION_PERMISSION_SETTLE_ATTEMPTS = Platform.OS === "android" ? 8 : 4;
const LOCATION_PERMISSION_SETTLE_DELAY_MS = Platform.OS === "android" ? 250 : 150;

/** Android can briefly report "denied" right after the native allow dialog closes. */
export const waitForLocationPermissionGranted = async (): Promise<boolean> => {
  for (let attempt = 0; attempt < LOCATION_PERMISSION_SETTLE_ATTEMPTS; attempt++) {
    const permission = await checkLocationPermission();
    if (permission.granted) return true;
    if (attempt < LOCATION_PERMISSION_SETTLE_ATTEMPTS - 1) {
      await new Promise<void>((resolve) =>
        setTimeout(() => resolve(), LOCATION_PERMISSION_SETTLE_DELAY_MS)
      );
    }
  }
  return false;
};

let locationPermissionRequestInFlight: Promise<PermissionResult> | null = null;

const ANDROID_LOCATION_PROMPT_RETRY_DELAY_MS = 600;
const ANDROID_INSTANT_DENY_THRESHOLD_MS = 250;

async function requestAndroidFineLocationPermission(): Promise<PermissionResult> {
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

  try {
    const fineGranted = await PermissionsAndroid.check(fine);
    if (fineGranted) {
      return {
        granted: true,
        status: RESULTS.GRANTED,
        canRequestAgain: false,
        blocked: false,
      };
    }

    const coarseGranted = await PermissionsAndroid.check(coarse);
    if (coarseGranted) {
      return {
        granted: true,
        status: RESULTS.GRANTED,
        canRequestAgain: false,
        blocked: false,
      };
    }

    const requestOnce = async () => {
      const startedAt = Date.now();
      const status = await PermissionsAndroid.request(fine);
      return { status, elapsedMs: Date.now() - startedAt };
    };

    let { status, elapsedMs } = await requestOnce();

    // Activity/modal may not be ready — Android can deny instantly without showing UI.
    if (
      status === PermissionsAndroid.RESULTS.DENIED &&
      elapsedMs < ANDROID_INSTANT_DENY_THRESHOLD_MS
    ) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, ANDROID_LOCATION_PROMPT_RETRY_DELAY_MS)
      );
      ({ status, elapsedMs } = await requestOnce());
    }

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return {
        granted: true,
        status: RESULTS.GRANTED,
        canRequestAgain: false,
        blocked: false,
      };
    }

    const blocked = status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
    return {
      granted: false,
      status: blocked ? RESULTS.BLOCKED : RESULTS.DENIED,
      canRequestAgain: !blocked,
      blocked,
    };
  } catch (error) {
    console.error("Error requesting Android location permission:", error);
    return {
      granted: false,
      status: RESULTS?.DENIED || "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
}

async function performLocationPermissionRequest(): Promise<PermissionResult> {
  try {
    if (Platform.OS === "android") {
      return requestAndroidFineLocationPermission();
    }

    if (!request || !PERMISSIONS) {
      return {
        granted: false,
        status: "unavailable" as any,
        canRequestAgain: false,
        blocked: false,
      };
    }

    const permission = getPermissionConstant("location");
    if (!permission) {
      return {
        granted: false,
        status: "unavailable" as any,
        canRequestAgain: false,
        blocked: false,
      };
    }

    const status = await request(permission);

    return {
      granted: status === RESULTS.GRANTED,
      status: status,
      canRequestAgain: false,
      blocked: status === RESULTS.BLOCKED,
    };
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return {
      granted: false,
      status: RESULTS?.DENIED || "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
}

/**
 * Request location permission (deduped — concurrent callers share one native prompt).
 */
export const requestLocationPermission =
  async (): Promise<PermissionResult> => {
    if (locationPermissionRequestInFlight) {
      return locationPermissionRequestInFlight;
    }

    locationPermissionRequestInFlight = performLocationPermissionRequest().finally(
      () => {
        locationPermissionRequestInFlight = null;
      }
    );

    return locationPermissionRequestInFlight;
  };

/**
 * Check storage/photos permission status
 */
export const checkStoragePermission = async (): Promise<PermissionResult> => {
  try {
    // Android 13+: photo picker / embedded picker — no broad media library access.
    if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
      return {
        granted: true,
        status: "granted",
        canRequestAgain: false,
        blocked: false,
      };
    }

    const permission = getPermissionConstant("photos");
    if (!permission || !check) {
      return {
        granted: false,
        status: "not-determined" as any,
        canRequestAgain: true,
        blocked: false,
      };
    }

    const status = await check(permission);

    return {
      granted: isMediaLibraryGranted(String(status)),
      status: status,
      canRequestAgain: status === RESULTS.DENIED,
      blocked: status === RESULTS.BLOCKED,
    };
  } catch (error) {
    console.error("Error checking storage permission:", error);
    return {
      granted: false,
      status: RESULTS?.DENIED || "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
};

/**
 * Request storage/photos permission
 */
export const requestStoragePermission = async (): Promise<PermissionResult> => {
  try {
    if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
      return {
        granted: true,
        status: "granted",
        canRequestAgain: false,
        blocked: false,
      };
    }

    const permission = getPermissionConstant("photos");
    if (!permission || !request) {
      return {
        granted: false,
        status: "not-determined" as any,
        canRequestAgain: true,
        blocked: false,
      };
    }

    const status = await request(permission);

    return {
      granted: isMediaLibraryGranted(String(status)),
      status: status,
      canRequestAgain: false,
      blocked: status === RESULTS.BLOCKED,
    };
  } catch (error) {
    console.error("Error requesting storage permission:", error);
    return {
      granted: false,
      status: RESULTS?.DENIED || "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
};

/**
 * Check microphone permission status (sound identification).
 */
export const checkMicrophonePermission = async (): Promise<PermissionResult> => {
  try {
    const permission = getPermissionConstant("microphone");
    if (!permission || !check || !RESULTS) {
      return {
        granted: false,
        status: "not-determined",
        canRequestAgain: true,
        blocked: false,
      };
    }
    const r = await check(permission);
    const statusStr = String(r);
    const granted =
      statusStr === RESULTS.GRANTED ||
      statusStr === RESULTS.LIMITED ||
      statusStr === "granted" ||
      statusStr === "limited";
    const blocked = statusStr === RESULTS.BLOCKED || statusStr === "blocked";
    return {
      granted,
      status: statusStr as PermissionStatus,
      canRequestAgain:
        statusStr === RESULTS.DENIED ||
        statusStr === RESULTS.UNAVAILABLE ||
        statusStr === "denied",
      blocked,
    };
  } catch (error) {
    console.error("Error checking microphone permission:", error);
    return {
      granted: false,
      status: "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
};

/**
 * Request microphone permission.
 */
export const requestMicrophonePermission = async (): Promise<PermissionResult> => {
  try {
    const permission = getPermissionConstant("microphone");
    if (!permission || !request || !RESULTS) {
      return checkMicrophonePermission();
    }
    const r = await request(permission);
    const statusStr = String(r);
    const granted =
      statusStr === RESULTS.GRANTED ||
      statusStr === RESULTS.LIMITED ||
      statusStr === "granted" ||
      statusStr === "limited";
    const blocked = statusStr === RESULTS.BLOCKED || statusStr === "blocked";
    return {
      granted,
      status: statusStr as PermissionStatus,
      canRequestAgain:
        statusStr === RESULTS.DENIED || statusStr === "denied",
      blocked,
    };
  } catch (error) {
    console.error("Error requesting microphone permission:", error);
    return {
      granted: false,
      status: "denied",
      canRequestAgain: false,
      blocked: true,
    };
  }
};

/**
 * Unified permission check function
 */
export const checkPermission = async (
  type: PermissionType
): Promise<PermissionResult> => {
  switch (type) {
    case "camera":
      return checkCameraPermission();
    case "location":
      return checkLocationPermission();
    case "notifications":
      return checkNotificationPermission();
    case "microphone":
      return checkMicrophonePermission();
    case "storage":
    case "photos":
      return checkStoragePermission();
    default:
      throw new Error(`Unsupported permission type: ${type}`);
  }
};

/**
 * Unified permission request function
 */
export const requestPermission = async (
  type: PermissionType
): Promise<PermissionResult> => {
  switch (type) {
    case "camera":
      return requestCameraPermission();
    case "location":
      return requestLocationPermission();
    case "notifications":
      return requestNotificationPermission();
    case "microphone":
      return requestMicrophonePermission();
    case "storage":
    case "photos":
      return requestStoragePermission();
    default:
      throw new Error(`Unsupported permission type: ${type}`);
  }
};

/**
 * Open device settings
 */
export const openDeviceSettings = (): Promise<void> => {
  if (openSettingsRNP) {
    return openSettingsRNP();
  }
  // Fallback to Linking
  return Linking.openSettings();
};

/**
 * Show permission alert with option to open settings
 */
export const showPermissionAlert = (
  title: string,
  message: string,
  onOpenSettings?: () => void
): void => {
  showAlert(title, message, {
    secondaryText: "Cancel",
    primaryText: "Open Settings",
    onPrimary: () => {
      if (onOpenSettings) {
        onOpenSettings();
      } else {
        openDeviceSettings();
      }
    },
  });
};

/**
 * Check and request permission with automatic handling
 * Returns true if permission is granted, false otherwise
 */
export const ensurePermission = async (
  type: PermissionType,
  showAlertIfBlocked = true
): Promise<boolean> => {
  // First check current status
  const checkResult = await checkPermission(type);

  if (checkResult.granted) {
    return true;
  }

  // If blocked, show alert to open settings
  if (checkResult.blocked && showAlertIfBlocked) {
    const permissionNames: Record<PermissionType, string> = {
      camera: "Camera",
      location: "Location",
      notifications: "Notifications",
      storage: "Storage",
      photos: "Photos",
      microphone: "Microphone",
    };

    showPermissionAlert(
      `${permissionNames[type]} Permission Required`,
      `Please enable ${permissionNames[type]} permission in your device settings to use this feature.`,
      openDeviceSettings
    );
    return false;
  }

  // If can request, request permission
  if (checkResult.canRequestAgain) {
    const requestResult = await requestPermission(type);
    return requestResult.granted;
  }

  return false;
};
