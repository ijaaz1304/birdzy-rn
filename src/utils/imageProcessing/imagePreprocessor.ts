/**
 * Image Preprocessor
 * Handles image validation, resizing, compression, and format conversion
 */

import { Image } from "react-native";
import RNFS from "react-native-fs";
import { normalizeFileUri } from "./normalizeFileUri";
import { compressImageForUpload } from "./compressImageForUpload";

const normalizeUri = normalizeFileUri;

const getExtensionFromUri = (uri: string): string | undefined => {
  const clean = uri.split("?")[0].split("#")[0];
  const fileName = clean.split("/").pop() || "";
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return undefined;
  return fileName.slice(dot + 1).toLowerCase();
};

const inferMimeTypeFromUri = (uri: string): string => {
  const ext = getExtensionFromUri(uri);
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
};

export interface ProcessedImage {
  uri: string;
  fileName: string;
  type: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface ImageProcessingConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxFileSizeMB: number;
  allowedFormats: string[];
}

export const DEFAULT_CONFIG: ImageProcessingConfig = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.92,
  maxFileSizeMB: 5,
  // Backend accepts common image formats; allow modern iOS/Android formats too.
  allowedFormats: ["jpeg", "jpg", "png", "heic", "heif", "webp"],
};

/** Stricter config for large images: smaller dimensions and lower quality to stay under 5MB */
export const STRICT_CONFIG: ImageProcessingConfig = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.72,
  maxFileSizeMB: 5,
  allowedFormats: ["jpeg", "jpg", "png", "heic", "heif", "webp"],
};

export class ImageProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

/**
 * Validate image URI and format
 */
export const validateImage = async (
  uri: string,
  config: ImageProcessingConfig = DEFAULT_CONFIG
): Promise<void> => {
  if (!uri || uri.trim() === "") {
    throw new ImageProcessingError("Image URI is required", "INVALID_URI");
  }

  const normalizedUri = normalizeUri(uri);

  // Check file extension
  const extension = getExtensionFromUri(normalizedUri);
  // Some valid URIs (e.g. `content://...`) may not include an extension.
  // If an extension exists, enforce allowlist; otherwise rely on accessibility checks.
  if (extension && !config.allowedFormats.includes(extension)) {
    throw new ImageProcessingError(
      `Unsupported image format. Allowed formats: ${config.allowedFormats.join(
        ", "
      )}`,
      "INVALID_FORMAT"
    );
  }

  if (normalizedUri.startsWith("file://")) {
    try {
      const exists = await RNFS.exists(normalizedUri.replace("file://", ""));
      if (!exists) {
        throw new ImageProcessingError(
          "Image file does not exist",
          "FILE_NOT_FOUND"
        );
      }
    } catch (error) {
      if (error instanceof ImageProcessingError) throw error;
    }
  }
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (
  uri: string
): Promise<{ width: number; height: number }> => {
  const normalizedUri = normalizeUri(uri);
  return new Promise((resolve, reject) => {
    Image.getSize(
      normalizedUri,
      (width, height) => resolve({ width, height }),
      () =>
        reject(
          new ImageProcessingError(
            "Failed to get image dimensions",
            "DIMENSION_ERROR"
          )
        )
    );
  });
};

/**
 * Process image: resize, compress, and convert to JPEG
 */
export const processImage = async (
  uri: string,
  config: ImageProcessingConfig = DEFAULT_CONFIG
): Promise<ProcessedImage> => {
  try {
    const normalizedUri = normalizeUri(uri);
    // Validate image first
    await validateImage(normalizedUri, config);

    // Get original dimensions (also serves as accessibility check)
    let originalWidth = 0;
    let originalHeight = 0;
    try {
      ({ width: originalWidth, height: originalHeight } =
        await getImageDimensions(normalizedUri));
    } catch (err) {
      throw new ImageProcessingError(
        "Image file not accessible",
        "FILE_NOT_FOUND"
      );
    }

    if (originalWidth <= 0 || originalHeight <= 0) {
      throw new ImageProcessingError(
        "Invalid image dimensions",
        "INVALID_SIZE"
      );
    }

    const maxSide = Math.max(config.maxWidth, config.maxHeight);
    const compressed = await compressImageForUpload(normalizedUri, {
      maxSide,
      quality: config.quality,
      maxFileSizeMB: config.maxFileSizeMB,
    });

    const maxFileSizeBytes = config.maxFileSizeMB * 1024 * 1024;
    if (compressed.fileSize > maxFileSizeBytes) {
      throw new ImageProcessingError(
        `Image file size (${(compressed.fileSize / 1024 / 1024).toFixed(
          2
        )}MB) exceeds maximum (${config.maxFileSizeMB}MB)`,
        "TOO_LARGE"
      );
    }

    const timestamp = Date.now();
    const fileName = `processed_${timestamp}.jpg`;

    return {
      uri: compressed.uri,
      fileName,
      type: "image/jpeg",
      width: compressed.width,
      height: compressed.height,
      fileSize: compressed.fileSize,
    };
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw error;
    }
    throw new ImageProcessingError(
      `Image processing failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      "PROCESSING_FAILED"
    );
  }
};

/**
 * Preprocess multiple images
 */
export const preprocessImages = async (
  imageUris: string[],
  config: ImageProcessingConfig = DEFAULT_CONFIG
): Promise<ProcessedImage[]> => {
  const results: ProcessedImage[] = [];

  for (const uri of imageUris) {
    try {
      const processed = await processImage(uri, config);
      results.push(processed);
    } catch (error) {
      // Log error but continue with other images
      console.warn(`Failed to process image ${uri}:`, error);
      // Optionally throw to stop processing all images
      // throw error;
    }
  }

  return results;
};

/**
 * Final upload guard: validate, compress, retry with stricter settings if needed.
 */
export const prepareImageForUpload = async (
  uri: string
): Promise<ProcessedImage> => {
  await validateImage(uri, DEFAULT_CONFIG);
  try {
    return await processImage(uri, DEFAULT_CONFIG);
  } catch (error) {
    if (error instanceof ImageProcessingError && error.code === "TOO_LARGE") {
      return await processImage(uri, STRICT_CONFIG);
    }
    throw error;
  }
};

/**
 * Get user-friendly error message
 */
export const getImageProcessingErrorMessage = (
  error: ImageProcessingError
): string => {
  switch (error.code) {
    case "INVALID_FORMAT":
      return "This image format is not supported. Please use JPEG, PNG, HEIC, or WEBP.";
    case "INVALID_SIZE":
      return "Invalid image dimensions. Please try another image.";
    case "TOO_LARGE":
      return `This image is too large. Maximum size is ${DEFAULT_CONFIG.maxFileSizeMB}MB.`;
    case "FILE_NOT_FOUND":
      return "The selected image is empty or corrupted. Please try another image.";
    case "PROCESSING_FAILED":
      return "Failed to process image. Please try again.";
    default:
      return "An error occurred while processing the image. Please try again.";
  }
};
