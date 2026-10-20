import { IMAGE_PIPELINE_MAX_UPLOAD_MB } from "../../constants/imagePipeline.constants";
/**
 * Camera utility functions
 */

import { AppState, Image, InteractionManager, Platform } from "react-native";
import { Camera } from "react-native-vision-camera";
import {
  launchImageLibrary,
  ImagePickerResponse,
} from "react-native-image-picker";
import { normalizeFileUri } from "../../utils/imageProcessing/normalizeFileUri";

let RNFS: any = null;
try {
  RNFS = require("react-native-fs");
} catch {
  // optional
}

/**
 * On Android, content:// URIs (e.g. from WhatsApp) often don't render in Image.
 * Copy to a temp file and return a file:// URI so preview and upload work.
 */
const copyAndroidContentUriToCache = async (uri: string): Promise<string> => {
  if (!RNFS) {
    throw new Error("Unable to load the selected photo. Please try again.");
  }

  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext.toLowerCase())
    ? ext
    : "jpg";
  const destPath = `${
    RNFS.CachesDirectoryPath
  }/gallery_${Date.now()}.${safeExt}`;

  try {
    await RNFS.copyFile(uri, destPath);
  } catch (copyError) {
    if (__DEV__) {
      console.warn(
        "ensureLoadableUri: copyFile failed, trying readFile",
        (copyError as Error)?.message
      );
    }
    const base64 = await RNFS.readFile(uri, "base64");
    await RNFS.writeFile(destPath, base64, "base64");
  }

  return `file://${destPath}`;
};

const verifyImageLoads = (uri: string): Promise<void> =>
  new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      () => resolve(),
      () =>
        reject(
          new Error(
            "Unable to load the selected photo. Please try another image."
          )
        )
    );
  });

export const ensureLoadableUri = async (uri: string): Promise<string> => {
  if (!uri) return uri;

  const normalized = normalizeFileUri(uri);

  if (Platform.OS === "android" && normalized.startsWith("content://")) {
    const fileUri = await copyAndroidContentUriToCache(normalized);
    await verifyImageLoads(fileUri);
    return fileUri;
  }

  const resolved =
    normalized.startsWith("file://") || normalized.includes("://")
      ? normalized
      : normalizeFileUri(normalized);

  if (Platform.OS === "android") {
    await verifyImageLoads(resolved);
  }

  return resolved;
};

export type CameraPermissionStatus =
  | "not-determined"
  | "denied"
  | "restricted"
  | "authorized";

const mapCameraPermissionStatus = (status: string): CameraPermissionStatus => {
  if (status === "granted") return "authorized";
  if (
    status === "not-determined" ||
    status === "denied" ||
    status === "restricted"
  ) {
    return status;
  }
  return "not-determined";
};

/**
 * Check camera permission status
 */
export const checkCameraPermission =
  async (): Promise<CameraPermissionStatus> => {
    try {
      const status = await Camera.getCameraPermissionStatus();
      return mapCameraPermissionStatus(status);
    } catch (error) {
      console.error("Error checking camera permission:", error);
      return "not-determined";
    }
  };

/**
 * Request camera permission
 */
export const requestCameraPermission =
  async (): Promise<CameraPermissionStatus> => {
    try {
      const status = await Camera.requestCameraPermission();
      return mapCameraPermissionStatus(status);
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      return "denied";
    }
  };

/**
 * Launch image library picker
 */
export const pickImageFromGallery = (): Promise<ImagePickerResponse> => {
  return new Promise((resolve, reject) => {
    launchImageLibrary(
      {
        mediaType: "photo",
        // Keep images reasonably small for faster on-device flows and backend limits
        quality: 0.8,
        maxWidth: 1280,
        maxHeight: 1280,
        selectionLimit: 1,
      },
      (response) => {
        if (response.didCancel) {
          reject(new Error("User cancelled image picker"));
        } else if (response.errorCode) {
          reject(new Error(response.errorMessage || "Image picker error"));
        } else if (response.assets && response.assets[0]) {
          resolve(response);
        } else {
          reject(new Error("No image selected"));
        }
      }
    );
  });
};

/**
 * Format file path for display (preserves content://, ph://, etc.).
 */
export const formatImagePath = (path: string): string => normalizeFileUri(path);

/** Resolve a local path/uri to one Image can render (copies Android content:// to cache). */
export const resolvePreviewImageUri = async (
  pathOrUri: string
): Promise<string> => ensureLoadableUri(normalizeFileUri(pathOrUri));

/**
 * Validate image quality (basic checks)
 */
export const validateImageQuality = (
  width: number,
  height: number,
  fileSize?: number
): { valid: boolean; warning?: string } => {
  // Minimum dimensions
  if (width < 200 || height < 200) {
    return {
      valid: false,
      warning: "Image is too small. Please use a higher resolution image.",
    };
  }

  // Maximum file size (5MB)
  if (fileSize && fileSize > IMAGE_PIPELINE_MAX_UPLOAD_MB * 1024 * 1024) {
    return {
      valid: false,
      warning: "Image file is too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
};

/** Wait until app is active before presenting native crop UI (notification shade blocks it). */
export function waitForAppActive(maxMs = 8000): Promise<boolean> {
  if (AppState.currentState === "active") return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      sub.remove();
      resolve(false);
    }, maxMs);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        clearTimeout(timer);
        sub.remove();
        resolve(true);
      }
    });
  });
}

export const deferAfterNativeDismiss = (): Promise<void> =>
  new Promise((resolve) => {
    const ms = Platform.OS === "android" ? 650 : 300;
    requestAnimationFrame(() => {
      setTimeout(resolve, ms);
    });
  });

/** Let stack transitions finish before TOCropViewController presents (gallery → crop host). */
export const settleBeforeNativeCropper = (opts?: {
  /** Camera was unmounted before navigate — shorter settle is enough. */
  afterCameraRelease?: boolean;
}): Promise<void> =>
  new Promise((resolve) => {
    const delayMs =
      Platform.OS === "ios"
        ? opts?.afterCameraRelease
          ? 250
          : 450
        : opts?.afterCameraRelease
        ? 150
        : 200;
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, delayMs);
      });
    });
  });

/**
 * VisionCamera keeps AVFoundation busy while mounted even when isActive=false.
 * Unmount Camera first, then wait briefly so TOCrop can present without backgrounding the app.
 */
export async function releaseVisionCameraForNativeUi(): Promise<void> {
  await waitForAppActive();
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, Platform.OS === "ios" ? 200 : 100);
      });
    });
  });
}

export const normalizeImageUriForCrop = (pathOrUri: string): string | null => {
  if (!pathOrUri?.trim()) return null;
  return normalizeFileUri(pathOrUri.trim());
};

const stripFilePrefix = (uri: string) =>
  uri.startsWith("file://") ? uri.slice(7) : uri;

/** Copy VisionCamera capture to app cache so TOCrop can read it reliably on iOS. */
export async function copyCaptureToStableCache(
  pathOrUri: string
): Promise<string | null> {
  if (!pathOrUri?.trim() || !RNFS) return null;
  try {
    const normalized = normalizeFileUri(pathOrUri.trim());
    const src = stripFilePrefix(normalized);
    if (src.includes("/Caches/") || src.includes("/tmp/")) {
      return normalized;
    }
    const ext = src.split(".").pop()?.split("?")[0]?.toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "heic", "webp"].includes(ext ?? "")
      ? ext!
      : "jpg";
    const dest = `${RNFS.CachesDirectoryPath}/capture_${Date.now()}.${safeExt}`;
    await RNFS.copyFile(src, dest);
    return normalizeFileUri(dest);
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "[IdentifyFlow] copyCaptureToStableCache failed",
        (error as Error)?.message
      );
    }
    return null;
  }
}

let emulatorCheck: boolean | null = null;

/** Cached — emulators/simulators often lack a real camera or native crop UI. */
export async function isEmulatorDevice(): Promise<boolean> {
  if (emulatorCheck !== null) return emulatorCheck;
  try {
    const DeviceInfo = require("react-native-device-info").default;
    emulatorCheck = !!(await DeviceInfo.isEmulator());
  } catch {
    emulatorCheck = false;
  }
  return emulatorCheck;
}
