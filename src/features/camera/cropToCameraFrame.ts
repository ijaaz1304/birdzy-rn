import { Image } from "react-native";
import ImageEditor from "@react-native-community/image-editor";
import type { PhotoFile } from "react-native-vision-camera";
import type { CaptureFrameLayout } from "./captureFrameLayout";
import { normalizeFileUri } from "../../utils/imageProcessing/normalizeFileUri";

export type FramedCaptureResult = {
  uri: string;
  width: number;
  height: number;
};

const getImageSize = (
  uri: string,
  timeoutMs = 4000
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    let settled = false;
    const finish = (
      result: { width: number; height: number } | null,
      err?: Error
    ) => {
      if (settled) return;
      settled = true;
      if (result) resolve(result);
      else reject(err ?? new Error("getImageSize failed"));
    };
    const timer = setTimeout(
      () => finish(null, new Error("getImageSize_timeout")),
      timeoutMs
    );
    Image.getSize(
      uri,
      (width, height) => {
        clearTimeout(timer);
        finish({ width, height });
      },
      (error) => {
        clearTimeout(timer);
        finish(null, error);
      }
    );
  });

/**
 * Crop a camera capture to the on-screen yellow capture frame.
 */
export const cropToCameraFrame = async (
  photo: PhotoFile,
  layout: CaptureFrameLayout
): Promise<FramedCaptureResult> => {
  const sourceUri = normalizeFileUri(
    photo.path.startsWith("file://") ? photo.path : `file://${photo.path}`
  );

  let photoWidth = photo.width;
  let photoHeight = photo.height;
  if (
    typeof photoWidth !== "number" ||
    typeof photoHeight !== "number" ||
    photoWidth <= 0 ||
    photoHeight <= 0
  ) {
    try {
      const size = await getImageSize(sourceUri);
      photoWidth = size.width;
      photoHeight = size.height;
    } catch {
      return {
        uri: sourceUri,
        width: photoWidth ?? 0,
        height: photoHeight ?? 0,
      };
    }
  }

  const { screenWidth, screenHeight, frameLeft, frameTop, frameSize } = layout;

  const scale = Math.max(photoWidth / screenWidth, photoHeight / screenHeight);
  const visibleWidth = screenWidth * scale;
  const visibleHeight = screenHeight * scale;
  const offsetX = Math.max(0, (photoWidth - visibleWidth) / 2);
  const offsetY = Math.max(0, (photoHeight - visibleHeight) / 2);

  const cropX = Math.round(offsetX + frameLeft * scale);
  const cropY = Math.round(offsetY + frameTop * scale);
  const cropSize = Math.round(frameSize * scale);

  const safeX = Math.min(Math.max(0, cropX), Math.max(0, photoWidth - 1));
  const safeY = Math.min(Math.max(0, cropY), Math.max(0, photoHeight - 1));
  const maxCropW = photoWidth - safeX;
  const maxCropH = photoHeight - safeY;
  const safeSize = Math.min(cropSize, maxCropW, maxCropH);

  if (safeSize <= 0) {
    return {
      uri: sourceUri,
      width: photoWidth,
      height: photoHeight,
    };
  }

  const result = await ImageEditor.cropImage(sourceUri, {
    offset: { x: safeX, y: safeY },
    size: { width: safeSize, height: safeSize },
    quality: 0.85,
    format: "jpeg",
  });

  return {
    uri: normalizeFileUri(result.uri),
    width: safeSize,
    height: safeSize,
  };
};
