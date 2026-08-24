import { Image, Platform } from "react-native";
import RNFS from "react-native-fs";
import { normalizeFileUri } from "../../utils/imageProcessing/normalizeFileUri";

export interface CroppedImageObject {
  /** Raw file uri/path suitable for uploads (no cache-busting query params) */
  uri: string;
  /** A separate uri for rendering previews (may include cache-busting query params) */
  previewUri: string;
  fileName: string;
  type: string;
  width?: number;
  height?: number;
}

export const isImageCropPickerCancelError = (err: unknown) => {
  const code = String((err as { code?: string })?.code ?? "").toUpperCase();
  const msg = String((err as { message?: string })?.message ?? "").toLowerCase();
  // Avoid matching unrelated errors that merely contain "cancel".
  return (
    code === "E_PICKER_CANCELLED" ||
    msg.includes("user cancelled") ||
    msg.includes("user canceled") ||
    msg === "cancelled" ||
    msg === "canceled"
  );
};

const ensureFilePrefix = (pathOrUri: string) => normalizeFileUri(pathOrUri);

const stripFilePrefix = (uri: string) =>
  uri?.startsWith("file://") ? uri.slice(7) : uri;

const getExtension = (path: string) => {
  const clean = path.split("?")[0].split("#")[0];
  const last = clean.split("/").pop() || "";
  const dot = last.lastIndexOf(".");
  if (dot === -1) return "";
  return last.slice(dot + 1).toLowerCase();
};

export const getMimeType = (pathOrUri: string): string => {
  const ext = getExtension(pathOrUri);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
};

const getFileName = (pathOrUri: string, mime?: string) => {
  const clean = pathOrUri.split("?")[0].split("#")[0];
  const last = clean.split("/").pop();
  if (last && last.includes(".")) return last;
  const extFromMime =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
      ? "webp"
      : mime === "image/heic"
      ? "heic"
      : "jpg";
  return `image-${Date.now()}.${extFromMime}`;
};

const buildFallbackObject = (
  inputUriOrPath: string,
  size?: { width?: number; height?: number }
): CroppedImageObject => {
  const rawUri = ensureFilePrefix(inputUriOrPath);
  const mime = getMimeType(rawUri);
  const fileName = getFileName(rawUri, mime);
  const previewUri = `${rawUri}${
    rawUri.includes("?") ? "&" : "?"
  }t=${Date.now()}`;
  return {
    uri: rawUri,
    previewUri,
    fileName,
    type: mime,
    width: size?.width,
    height: size?.height,
  };
};

/**
 * On Android, content:// URIs (e.g. from WhatsApp downloads) often don't load in Image
 * and can make the cropper fail. Copy to a temp file so we get a stable file:// URI.
 */
const copyContentUriToTempIfNeeded = async (
  inputUriOrPath: string
): Promise<string> => {
  if (
    Platform.OS !== "android" ||
    !inputUriOrPath?.startsWith("content://") ||
    !RNFS
  ) {
    return inputUriOrPath;
  }
  try {
    const ext = getExtension(inputUriOrPath) || "jpg";
    const destPath = `${RNFS.CachesDirectoryPath}/pick_${Date.now()}.${ext}`;
    await RNFS.copyFile(inputUriOrPath, destPath);
    return `file://${destPath}`;
  } catch (e) {
    if (__DEV__) {
      console.warn(
        "Copy content URI to temp failed; using original.",
        (e as Error)?.message
      );
    }
    return inputUriOrPath;
  }
};

/**
 * Path pair for ImagePicker.openCropper — matches identify flow (iOS prefers file://, Android bare path first).
 * Feed and other screens should use this before openCropper so physical devices match Camera/gallery behavior.
 */
export async function resolvePathsForOpenCropper(
  inputUriOrPath: string
): Promise<{ primary: string; secondary: string }> {
  const normalizedInput = await copyContentUriToTempIfNeeded(inputUriOrPath);
  const inputForCropper = ensureFilePrefix(normalizedInput);
  const inputPath = stripFilePrefix(inputForCropper);
  const primary = Platform.OS === "android" ? inputPath : inputForCropper;
  const secondary = Platform.OS === "android" ? inputForCropper : inputPath;
  return { primary, secondary };
}

export const cropImageAndReturnObject = async (
  inputUriOrPath: string,
  opts?: { crop?: boolean }
): Promise<CroppedImageObject | null> => {
  if (!inputUriOrPath) return null;
  const shouldCrop = opts?.crop === true;

  // On Android, content:// (e.g. WhatsApp) → copy to temp file so cropper and Image can use it
  const normalizedInput = await copyContentUriToTempIfNeeded(inputUriOrPath);

  // Keep a stable, local file uri for cropper input (crop-picker wants plain path or file://)
  const inputForCropper = ensureFilePrefix(normalizedInput);

  // Preload width/height best-effort for later (preview sizing, types)
  const size = await new Promise<{ width?: number; height?: number }>(
    (resolve) => {
      Image.getSize(
        inputForCropper,
        (width, height) => resolve({ width, height }),
        () => resolve({})
      );
    }
  );

  // Default: do NOT crop/resize here. Cropping to a fixed 1080×1080 can distort content
  // and degrade identification quality. Selection/capture should handle compression.
  if (!shouldCrop) {
    return buildFallbackObject(normalizedInput, size);
  }

  const computeTargetSize = () => {
    const maxSide = 1920;
    const w = size.width;
    const h = size.height;
    if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
      const scale = Math.min(1, maxSide / Math.max(w, h));
      return {
        width: Math.max(1, Math.round(w * scale)),
        height: Math.max(1, Math.round(h * scale)),
      };
    }
    return { width: 1280, height: 960 };
  };
  const target = computeTargetSize();

  const { openInteractiveCropper } = await import("./interactiveCrop");
  return openInteractiveCropper(normalizedInput, {
    width: target.width,
    height: target.height,
    fallbackToOriginal: true,
  });
};
