import { Platform } from "react-native";
import ImagePicker, { type Options } from "react-native-image-crop-picker";
import { AI_CROPPER_OPTIONS } from "../../constants/imagePipeline.constants";
import { normalizeFileUri } from "../../utils/imageProcessing/normalizeFileUri";
import {
  CroppedImageObject,
  getMimeType,
  isImageCropPickerCancelError,
  resolvePathsForOpenCropper,
} from "./cropImageAndReturnObject";
import {
  deferAfterNativeDismiss,
  releaseVisionCameraForNativeUi,
  settleBeforeNativeCropper,
  waitForAppActive,
} from "./camera.utils";
import { identifyFlowError, identifyFlowLog } from "./identifyFlowLog";

const ensureFilePrefix = (pathOrUri: string) => normalizeFileUri(pathOrUri);

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

const buildCroppedObject = (
  path: string,
  size?: { width?: number; height?: number },
  mime?: string
): CroppedImageObject => {
  const rawUri = ensureFilePrefix(path);
  const type = mime || getMimeType(rawUri);
  const fileName = getFileName(rawUri, type);
  const previewUri = `${rawUri}${
    rawUri.includes("?") ? "&" : "?"
  }t=${Date.now()}`;
  return {
    uri: rawUri,
    previewUri,
    fileName,
    type,
    width: size?.width,
    height: size?.height,
  };
};

const yieldToMainThread = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, Platform.OS === "ios" ? 32 : 16);
    });
  });

export type OpenInteractiveCropperOptions = {
  /** Extra settle time after navigation — use on IdentifyImageCrop host. */
  fromCropHost?: boolean;
  /** Capture path already unmounted VisionCamera — skip second release wait. */
  cameraAlreadyReleased?: boolean;
  /** Fixed crop output dimensions (e.g. feed square). */
  width?: number;
  height?: number;
  /** Merge over AI_CROPPER_OPTIONS for flow-specific tweaks. */
  cropperOverrides?: Partial<Options>;
  /** When cropper fails, return the original normalized image instead of null. */
  fallbackToOriginal?: boolean;
};

/** Single native modal: system gallery + crop (use instead of grid + openCropper). */
export async function openPickerWithCrop(): Promise<CroppedImageObject | null> {
  try {
    identifyFlowLog("picker_with_crop_started");
    const picked = await ImagePicker.openPicker({
      ...AI_CROPPER_OPTIONS,
      cropping: true,
      multiple: false,
    });
    if (!picked?.path) return null;
    identifyFlowLog("picker_with_crop_success", {
      pathPrefix: picked.path.slice(0, 32),
    });
    return buildCroppedObject(
      picked.path,
      { width: picked.width, height: picked.height },
      picked.mime
    );
  } catch (err) {
    if (isImageCropPickerCancelError(err)) {
      identifyFlowLog("picker_with_crop_cancelled");
      return null;
    }
    identifyFlowError("IFLOW-003", "Pick and crop failed", {
      message: String((err as Error)?.message ?? err),
    });
    return null;
  }
}

export const openInteractiveCropper = async (
  inputUriOrPath: string,
  options?: OpenInteractiveCropperOptions
): Promise<CroppedImageObject | null> => {
  try {
    if (!inputUriOrPath) return null;

    if (
      inputUriOrPath.startsWith("ph://") ||
      inputUriOrPath.startsWith("assets-library://")
    ) {
      identifyFlowError(
        "IFLOW-009",
        "Unresolved Photos URI (ph://) passed to cropper",
        { pathPrefix: inputUriOrPath.slice(0, 32) }
      );
      return null;
    }

    await waitForAppActive();

    if (options?.fromCropHost) {
      identifyFlowLog("cropper_settle_start", {
        cameraAlreadyReleased: options.cameraAlreadyReleased ?? false,
      });
      if (!options?.cameraAlreadyReleased) {
        await releaseVisionCameraForNativeUi();
      }
      await settleBeforeNativeCropper({
        afterCameraRelease: options?.cameraAlreadyReleased ?? false,
      });
      identifyFlowLog("cropper_settle_done");
    } else {
      await deferAfterNativeDismiss();
    }

    identifyFlowLog("cropper_started", {
      pathPrefix: inputUriOrPath.slice(0, 32),
      fromCropHost: options?.fromCropHost ?? false,
    });

    const { primary, secondary } = await resolvePathsForOpenCropper(
      inputUriOrPath
    );
    identifyFlowLog("cropper_paths_resolved", {
      primaryPrefix: primary.slice(0, 40),
      secondaryPrefix: secondary.slice(0, 40),
    });

    await yieldToMainThread();

    const openCropper = (path: string, label: "primary" | "secondary") => {
      identifyFlowLog("cropper_open_attempt", {
        label,
        pathPrefix: path.slice(0, 40),
      });
      return ImagePicker.openCropper({
        path,
        cropping: true,
        ...AI_CROPPER_OPTIONS,
        mediaType: "photo",
        ...options?.cropperOverrides,
        ...(options?.width && options?.height
          ? { width: options.width, height: options.height }
          : null),
        cropperToolbarTitle:
          (options?.cropperOverrides as { cropperToolbarTitle?: string })
            ?.cropperToolbarTitle ?? "Crop Image",
        ...(Platform.OS === "ios"
          ? {
              forceJpg: true,
              compressImageQuality:
                (options?.cropperOverrides as { compressImageQuality?: number })
                  ?.compressImageQuality ?? 0.92,
            }
          : null),
      } as unknown as Parameters<typeof ImagePicker.openCropper>[0]);
    };

    let cropped: Awaited<ReturnType<typeof ImagePicker.openCropper>> | null =
      null;
    const cropPaths: Array<{ path: string; label: "primary" | "secondary" }> = [
      { path: primary, label: "primary" },
      { path: secondary, label: "secondary" },
    ];

    for (const { path, label } of cropPaths) {
      if (label === "secondary" && path === primary) continue;
      try {
        cropped = await openCropper(path, label);
        break;
      } catch (err) {
        if (isImageCropPickerCancelError(err)) {
          identifyFlowLog("cropper_cancelled");
          return null;
        }
        identifyFlowLog("cropper_attempt_failed", {
          label,
          message: String((err as Error)?.message ?? err),
        });
      }
    }

    if (!cropped?.path) {
      if (options?.fallbackToOriginal) {
        identifyFlowLog("cropper_fallback_to_original");
        return buildCroppedObject(inputUriOrPath);
      }
      identifyFlowError("IFLOW-003", "Cropper failed to open", {
        reason: "empty_crop_result",
      });
      return null;
    }

    identifyFlowLog("cropper_success", {
      pathPrefix: cropped.path.slice(0, 32),
    });
    return buildCroppedObject(
      cropped.path,
      {
        width: cropped.width,
        height: cropped.height,
      },
      cropped.mime
    );
  } catch (err) {
    if (isImageCropPickerCancelError(err)) {
      identifyFlowLog("cropper_cancelled");
      return null;
    }
    identifyFlowError("IFLOW-003", "Cropper failed to open", {
      message: String((err as Error)?.message ?? err),
    });
    return null;
  }
};
