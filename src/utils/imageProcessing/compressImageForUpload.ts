import { Image } from "react-native";
import ImageEditor from "@react-native-community/image-editor";
import RNFS from "react-native-fs";
import { normalizeFileUri } from "./normalizeFileUri";
import {
  IMAGE_PIPELINE_JPEG_QUALITY,
  IMAGE_PIPELINE_MAX_SIDE,
  IMAGE_PIPELINE_MAX_UPLOAD_MB,
} from "../../constants/imagePipeline.constants";

export type CompressImageResult = {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
};

const getImageSize = (
  uri: string
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
  });

const getFileSize = async (uri: string): Promise<number> => {
  const normalized = normalizeFileUri(uri);
  if (!normalized.startsWith("file://")) return 0;
  try {
    const stat = await RNFS.stat(fileUriToPath(normalized));
    return stat.size;
  } catch {
    return 0;
  }
};

const fileUriToPath = (uri: string): string =>
  uri.startsWith("file://") ? uri.slice(7) : uri;

const encodeJpeg = async (
  uri: string,
  width: number,
  height: number,
  quality: number
): Promise<string> => {
  const result = await ImageEditor.cropImage(uri, {
    offset: { x: 0, y: 0 },
    size: { width, height },
    quality,
    format: "jpeg",
  });
  return normalizeFileUri(result.uri);
};

/**
 * Downscale and re-encode as JPEG, targeting <= maxFileSizeMB.
 */
export const compressImageForUpload = async (
  uri: string,
  options?: {
    maxSide?: number;
    quality?: number;
    maxFileSizeMB?: number;
  }
): Promise<CompressImageResult> => {
  const maxSide = options?.maxSide ?? IMAGE_PIPELINE_MAX_SIDE;
  const quality = options?.quality ?? IMAGE_PIPELINE_JPEG_QUALITY;
  const maxFileSizeMB = options?.maxFileSizeMB ?? IMAGE_PIPELINE_MAX_UPLOAD_MB;
  const maxBytes = maxFileSizeMB * 1024 * 1024;

  const normalized = normalizeFileUri(uri);
  const { width, height } = await getImageSize(normalized);

  const scale = Math.min(1, maxSide / Math.max(width, height));
  let targetWidth = Math.max(1, Math.round(width * scale));
  let targetHeight = Math.max(1, Math.round(height * scale));
  let currentQuality = quality;

  let outputUri = await encodeJpeg(
    normalized,
    targetWidth,
    targetHeight,
    currentQuality
  );
  let fileSize = await getFileSize(outputUri);

  if (fileSize > maxBytes && currentQuality > 0.72) {
    currentQuality = 0.72;
    outputUri = await encodeJpeg(
      normalized,
      targetWidth,
      targetHeight,
      currentQuality
    );
    fileSize = await getFileSize(outputUri);
  }

  if (fileSize > maxBytes && Math.max(targetWidth, targetHeight) > 1280) {
    const strictScale = 1280 / Math.max(targetWidth, targetHeight);
    targetWidth = Math.max(1, Math.round(targetWidth * strictScale));
    targetHeight = Math.max(1, Math.round(targetHeight * strictScale));
    currentQuality = 0.72;
    outputUri = await encodeJpeg(
      normalized,
      targetWidth,
      targetHeight,
      currentQuality
    );
    fileSize = await getFileSize(outputUri);
  }

  if (fileSize <= 0) {
    fileSize = Math.round(targetWidth * targetHeight * 3 * currentQuality);
  }

  return {
    uri: outputUri,
    width: targetWidth,
    height: targetHeight,
    fileSize,
  };
};
