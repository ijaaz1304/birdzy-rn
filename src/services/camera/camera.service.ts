/**
 * Camera Service - Implementation using react-native-image-picker
 */

import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  MediaType,
  PhotoQuality,
} from "react-native-image-picker";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";

import { Platform } from "react-native";
export interface CameraOptions {
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  /** Resize output image to fit within max dimensions (react-native-image-picker) */
  maxWidth?: number;
  /** Resize output image to fit within max dimensions (react-native-image-picker) */
  maxHeight?: number;
}

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
}

const toPositiveIntOrUndefined = (value: unknown): number | undefined => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
};

class CameraService {
  /**
   * Open camera to capture image
   */
  async captureImage(options: CameraOptions = {}): Promise<ImageResult> {
    return new Promise((resolve, reject) => {
      // react-native-image-picker is strict about numeric maxWidth/maxHeight.
      // Also strip non-supported options from our higher-level interface.
      const { maxWidth, maxHeight, quality, ...rest } = options;
      const safeMaxWidth = toPositiveIntOrUndefined(maxWidth);
      const safeMaxHeight = toPositiveIntOrUndefined(maxHeight);

      launchCamera(
        {
          mediaType: "photo" as MediaType,
          saveToPhotos: false,
          ...(safeMaxWidth ? { maxWidth: safeMaxWidth } : {}),
          ...(safeMaxHeight ? { maxHeight: safeMaxHeight } : {}),
          ...rest,
          quality: (quality ?? 0.8) as PhotoQuality,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            reject(new Error("User cancelled camera"));
          } else if (response.errorCode) {
            reject(new Error(response.errorMessage || "Camera error"));
          } else if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            resolve({
              uri: asset.uri || "",
              width: asset.width || 1920,
              height: asset.height || 1080,
              type: asset.type || "image/jpeg",
              fileName: asset.fileName || "captured-image.jpg",
            });
          } else {
            reject(new Error("No image captured"));
          }
        }
      );
    });
  }

  /**
   * Pick image from gallery
   */
  async pickFromGallery(options: CameraOptions = {}): Promise<ImageResult> {
    return new Promise((resolve, reject) => {
      const { maxWidth, maxHeight, quality, ...rest } = options;
      const safeMaxWidth = toPositiveIntOrUndefined(maxWidth);
      const safeMaxHeight = toPositiveIntOrUndefined(maxHeight);

      launchImageLibrary(
        {
          mediaType: "photo" as MediaType,
          selectionLimit: 1,
          ...(safeMaxWidth ? { maxWidth: safeMaxWidth } : {}),
          ...(safeMaxHeight ? { maxHeight: safeMaxHeight } : {}),
          ...rest,
          quality: (quality ?? 0.8) as PhotoQuality,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            reject(new Error("User cancelled gallery picker"));
          } else if (response.errorCode) {
            reject(new Error(response.errorMessage || "Gallery picker error"));
          } else if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            resolve({
              uri: asset.uri || "",
              width: asset.width || 1920,
              height: asset.height || 1080,
              type: asset.type || "image/jpeg",
              fileName: asset.fileName || "gallery-image.jpg",
            });
          } else {
            reject(new Error("No image selected"));
          }
        }
      );
    });
  }

  /**
   * Check camera permissions
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === "ios"
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error("Error checking camera permission:", error);
      return false;
    }
  }

  /**
   * Request camera permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === "ios"
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      return false;
    }
  }
}

export const cameraService = new CameraService();
