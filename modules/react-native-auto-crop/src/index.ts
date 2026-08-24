import { NativeModules, Platform } from "react-native";

export type CropBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropImageResult = {
  uri: string;
  originalUri: string;
  applied: boolean;
  reason: string;
  paddingRatio?: number;
  boundingBox?: CropBoundingBox;
  paddedBoundingBox?: CropBoundingBox;
  cropWidth?: number;
  cropHeight?: number;
  durationMs?: number;
};

export type FlattenCutoutResult = {
  uri: string;
  applied: boolean;
};

const LINKING_ERROR =
  `The package 'react-native-auto-crop' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n";

const AutoCrop = NativeModules.AutoCrop
  ? NativeModules.AutoCrop
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const parseCropResult = (raw: CropImageResult): CropImageResult => ({
  uri: raw?.uri ?? raw?.originalUri ?? "",
  originalUri: raw?.originalUri ?? raw?.uri ?? "",
  applied: !!raw?.applied,
  reason: raw?.reason ?? (raw?.applied ? "applied" : "unknown"),
  paddingRatio: raw?.paddingRatio,
  boundingBox: raw?.boundingBox,
  paddedBoundingBox: raw?.paddedBoundingBox,
  cropWidth: raw?.cropWidth,
  cropHeight: raw?.cropHeight,
  durationMs: raw?.durationMs,
});

/**
 * Native subject segmentation + auto-crop.
 * Always resolves — returns original URI with applied: false on failure.
 */
export async function cropImage(
  imageURI: string,
  paddingRatio = 0.04
): Promise<CropImageResult> {
  const raw = await AutoCrop.cropImage(imageURI, paddingRatio);
  return parseCropResult(raw);
}

/**
 * Flatten transparent PNG cutout onto white JPEG (native).
 */
export async function flattenCutoutOnWhite(
  imageURI: string,
  quality = 0.92
): Promise<FlattenCutoutResult> {
  const raw = await AutoCrop.flattenCutoutOnWhite(imageURI, quality);
  return {
    uri: raw?.uri ?? imageURI,
    applied: !!raw?.applied,
  };
}

/** @deprecated Use cropImage — kept for existing callers */
export async function cropSubjectImage(
  imageURI: string,
  options: { paddingRatio?: number } = {}
): Promise<string> {
  const result = await cropImage(imageURI, options.paddingRatio ?? 0.04);
  return result.uri;
}
