/**
 * iOS gallery selection via PHPicker (react-native-image-picker).
 * Does not request broad Photos-library authorization — PHPicker is the selection boundary.
 */

import { Platform } from "react-native";
import {
  launchImageLibrary,
  type Asset,
  type ImageLibraryOptions,
} from "react-native-image-picker";
import { normalizeFileUri } from "../../utils/imageProcessing/normalizeFileUri";
import { ensureLoadableUri } from "./camera.utils";

export type IosGalleryPickResult =
  | { status: "success"; uri: string; asset: Asset }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export type LaunchIosGalleryImageOptions = Pick<
  ImageLibraryOptions,
  "maxWidth" | "maxHeight" | "quality"
>;

const DEFAULT_OPTIONS: Required<LaunchIosGalleryImageOptions> = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.8,
};

export function usesIosPhpPickerGallery(): boolean {
  return Platform.OS === "ios";
}

/**
 * Normalize a picked asset URI to a local filesystem-compatible `file://` URI.
 * Rejects unresolved `ph://` / `assets-library://` references.
 */
export async function normalizeIosGalleryAssetUri(
  asset: Pick<Asset, "uri">
): Promise<string> {
  const raw = asset.uri?.trim();
  if (!raw) {
    throw new Error("No image selected");
  }

  const normalized = normalizeFileUri(raw);
  const loadable = await ensureLoadableUri(normalized);

  if (
    loadable.startsWith("ph://") ||
    loadable.startsWith("assets-library://")
  ) {
    throw new Error(
      "Unable to load the selected photo. Try another image or download it from iCloud first."
    );
  }

  return loadable;
}

/**
 * Launch PHPicker on iOS and return a normalized local `file://` URI.
 * No Photos permission is requested before presentation.
 */
export async function launchIosGalleryImage(
  options: LaunchIosGalleryImageOptions = {}
): Promise<IosGalleryPickResult> {
  if (!usesIosPhpPickerGallery()) {
    return {
      status: "error",
      message: "launchIosGalleryImage is iOS-only",
    };
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve) => {
    launchImageLibrary(
      {
        mediaType: "photo",
        selectionLimit: 1,
        quality: opts.quality,
        maxWidth: opts.maxWidth,
        maxHeight: opts.maxHeight,
      },
      (response) => {
        if (response.didCancel) {
          resolve({ status: "cancelled" });
          return;
        }
        if (response.errorCode) {
          resolve({
            status: "error",
            message: response.errorMessage || response.errorCode,
          });
          return;
        }

        const asset = response.assets?.[0];
        if (!asset?.uri) {
          resolve({ status: "cancelled" });
          return;
        }

        void normalizeIosGalleryAssetUri(asset)
          .then((uri) => resolve({ status: "success", uri, asset }))
          .catch((err) =>
            resolve({
              status: "error",
              message: String((err as Error)?.message ?? err),
            })
          );
      }
    );
  });
}
