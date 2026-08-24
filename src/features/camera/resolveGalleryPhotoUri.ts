import { Platform } from "react-native";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import type { GalleryPhoto } from "./galleryPhoto.types";
import { normalizeFileUri } from "../../utils/imageProcessing/normalizeFileUri";
import { ensureLoadableUri } from "./camera.utils";
import { identifyFlowLog } from "./identifyFlowLog";

const IOS_PHOTO_EXPORT_TIMEOUT_MS = 45_000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${Math.round(timeoutMs / 1000)}s. Try another photo or download it from iCloud first.`
        )
      );
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const ensureFilePrefix = (pathOrUri: string) => normalizeFileUri(pathOrUri);

/** Camera-roll `id` / `ph://…` → Photos localIdentifier for iosGetImageDataById. */
function toPhotosInternalId(idOrUri: string): string {
  if (!idOrUri) return idOrUri;
  if (idOrUri.startsWith("ph://")) {
    return idOrUri.replace(/^ph:\/\//, "");
  }
  return idOrUri;
}

/**
 * iOS-only: one Photos export (HEIC→JPEG) for TOCropViewController.
 * Android should use {@link resolveGalleryPhotoUri} instead.
 */
export async function getPathForNativeCropper(
  photo: GalleryPhoto
): Promise<string> {
  if (Platform.OS !== "ios") {
    return resolveGalleryPhotoUri(photo);
  }

  const internalId = toPhotosInternalId(photo.id || photo.uri);
  identifyFlowLog("gallery_export_started", { internalId: internalId.slice(0, 24) });
  try {
    const data = await withTimeout(
      CameraRoll.iosGetImageDataById(internalId, {
        convertHeicImages: true,
      }),
      IOS_PHOTO_EXPORT_TIMEOUT_MS,
      "Photo export"
    );
    const filepath = data?.node?.image?.filepath;
    if (filepath) {
      identifyFlowLog("gallery_export_success", {
        pathPrefix: filepath.slice(0, 32),
      });
      return ensureFilePrefix(filepath);
    }
  } catch (e) {
    identifyFlowLog("gallery_export_failed", {
      message: String((e as Error)?.message ?? e),
    });
  }

  if (photo.uri && !photo.uri.startsWith("ph://")) {
    return ensureFilePrefix(photo.uri);
  }

  throw new Error(
    "Unable to open this photo. Try another image or download it from iCloud first."
  );
}

/** Resolve a camera-roll asset to a uri/path suitable for crop + upload. */
export async function resolveGalleryPhotoUri(
  photo: GalleryPhoto
): Promise<string> {
  if (Platform.OS === "ios") {
    try {
      const data = await CameraRoll.iosGetImageDataById(photo.uri);
      const filepath = data?.node?.image?.filepath;
      if (filepath) return ensureLoadableUri(ensureFilePrefix(filepath));
    } catch {
      try {
        const data = await CameraRoll.iosGetImageDataById(photo.id);
        const filepath = data?.node?.image?.filepath;
        if (filepath) return ensureLoadableUri(ensureFilePrefix(filepath));
      } catch {
        // fall through
      }
    }
  }

  const resolved = await ensureLoadableUri(ensureFilePrefix(photo.uri));
  if (Platform.OS === "ios" && resolved.startsWith("ph://")) {
    throw new Error(
      "Unable to load the selected photo. Try another image or download it from iCloud first."
    );
  }
  return resolved;
}
