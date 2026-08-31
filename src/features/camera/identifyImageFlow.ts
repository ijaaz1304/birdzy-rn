import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PhotoFile } from "react-native-vision-camera";
import { InteractionManager, Platform } from "react-native";
import { CameraStackParamList } from "../../navigation/types";
import { cropToCameraFrame } from "./cropToCameraFrame";
import type { CaptureFrameLayout } from "./captureFrameLayout";
import {
  cropImageAndReturnObject,
  CroppedImageObject,
} from "./cropImageAndReturnObject";
import { openInteractiveCropper } from "./interactiveCrop";
import { canIdentifyPhoto } from "../../services/session/usageLimit.service";
import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";
import { identifyFlowLog } from "./identifyFlowLog";

/** Native cropper dismiss can drop navigate; InteractionManager can also hang on iOS. */
const navigateAfterNativeUi = (navigate: () => void) =>
  new Promise<void>((resolve) => {
    const delayMs = Platform.OS === "ios" ? 250 : 50;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        navigate();
      } finally {
        resolve();
      }
    };
    const hardTimer = setTimeout(finish, delayMs + 450);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        clearTimeout(hardTimer);
        finish();
      }, delayMs);
    });
  });

const asReadyImage = async (
  inputUri: string
): Promise<CroppedImageObject | null> =>
  cropImageAndReturnObject(inputUri, { crop: false });

/** Manual crop only — no auto-crop / background removal. */
export const processImageForIdentify = async (
  inputUri: string
): Promise<CroppedImageObject | null> => {
  return openInteractiveCropper(inputUri);
};

/** Pass through the already-cropped (or framed) image with no extra processing. */
export const asIdentifyImage = asReadyImage;

export const processCameraCaptureForIdentify = async (
  photo: PhotoFile,
  layout: CaptureFrameLayout
): Promise<CroppedImageObject | null> => {
  const framed = await cropToCameraFrame(photo, layout);
  return asReadyImage(framed.uri);
};

/** Fast path after shutter: crop to viewfinder frame only. */
export const processCameraCapturePreview = async (
  photo: PhotoFile,
  layout: CaptureFrameLayout
): Promise<CroppedImageObject | null> => {
  const framed = await cropToCameraFrame(photo, layout);
  const previewUri = `${framed.uri}${
    framed.uri.includes("?") ? "&" : "?"
  }t=${Date.now()}`;
  return {
    uri: framed.uri,
    previewUri,
    fileName: `capture_${Date.now()}.jpg`,
    type: "image/jpeg",
    width: framed.width,
    height: framed.height,
  };
};

export const processGalleryImageForIdentify = async (
  inputUri: string
): Promise<CroppedImageObject | null> => {
  return openInteractiveCropper(inputUri, {
    fallbackToOriginal: true,
  });
};

type SubmitNavigation = NativeStackNavigationProp<
  CameraStackParamList,
  "CameraMain" | "GalleryPicker"
>;

export const submitProcessedImageForIdentify = async (params: {
  image: CroppedImageObject;
  /** Optional second image for multi-photo identify (max 2). */
  extraImages?: CroppedImageObject[];
  displayImage?: CroppedImageObject;
  navigation: SubmitNavigation;
  isPremium: boolean;
  onLimitReached: () => void;
  returnImageToAskAI?: boolean;
  /** Prefer replace when leaving GalleryPicker so back skips the picker. */
  replace?: boolean;
}): Promise<void> => {
  const {
    image,
    extraImages = [],
    displayImage,
    navigation,
    isPremium,
    onLimitReached,
    returnImageToAskAI,
    replace = false,
  } = params;

  if (returnImageToAskAI) {
    const rootNav = navigation.getParent()?.getParent()?.getParent();
    if (rootNav && typeof (rootNav as any).navigate === "function") {
      (rootNav as any).navigate("AskAIStack", {
        screen: "AskAIMain",
        params: { selectedImageUri: image.uri },
      });
    }
    return;
  }

  if (!isPremium) {
    const allowed = await canIdentifyPhoto();
    if (!allowed) {
      analyticsService.logEvent(EVENTS.identification_limit_reached, {
        source: "image_pipeline",
      });
      analyticsService.logEvent(EVENTS.identification_limit_exceeded);
      onLimitReached();
      return;
    }
  }

  const allImages = [image, ...extraImages].slice(0, 2);
  const paramsForLoading = {
    image: {
      uri: image.uri,
      width: image.width,
      height: image.height,
    },
    images:
      allImages.length > 1
        ? allImages.map((img) => ({
            uri: img.uri,
            width: img.width,
            height: img.height,
          }))
        : undefined,
    displayImage: displayImage
      ? {
          uri: displayImage.previewUri ?? displayImage.uri,
          width: displayImage.width,
          height: displayImage.height,
        }
      : undefined,
  };

  analyticsService.logEvent(EVENTS.photo_submitted);
  identifyFlowLog("navigation_to_analysis_started", { replace });
  await navigateAfterNativeUi(() => {
    if (replace && typeof (navigation as any).replace === "function") {
      (navigation as any).replace("DiagnosisLoading", paramsForLoading);
    } else {
      navigation.navigate("DiagnosisLoading", paramsForLoading);
    }
  });
  identifyFlowLog("navigation_to_analysis_completed");
};

export type CropReturnTarget = "camera" | "analysis" | "askAi";

type CropResultNavigation = NativeStackNavigationProp<
  CameraStackParamList,
  "IdentifyImageCrop" | "CameraMain" | "GalleryPicker"
>;

/** Route cropped image after IdentifyImageCrop. */
export function navigateProcessedImageResult(
  navigation: CropResultNavigation,
  processed: CroppedImageObject,
  options: { returnTarget: CropReturnTarget }
): void {
  const displayUri = processed.previewUri ?? processed.uri;
  const { returnTarget } = options;

  if (returnTarget === "analysis") {
    identifyFlowLog("diagnosis_navigation_started", { source: "crop_host" });
    navigation.replace("DiagnosisLoading", {
      image: {
        uri: processed.uri,
        width: processed.width,
        height: processed.height,
      },
      displayImage: {
        uri: displayUri,
        width: processed.width,
        height: processed.height,
      },
    });
    identifyFlowLog("diagnosis_navigation_completed", { source: "crop_host" });
    return;
  }

  if (returnTarget === "askAi") {
    const rootNav = navigation.getParent()?.getParent()?.getParent();
    if (typeof navigation.popTo === "function") {
      navigation.popTo("CameraMain", { resetCapture: true });
    } else {
      navigation.navigate({
        name: "CameraMain",
        params: { resetCapture: true },
        merge: true,
      });
    }
    if (rootNav && typeof (rootNav as any).navigate === "function") {
      (rootNav as any).navigate("AskAIStack", {
        screen: "AskAIMain",
        params: { selectedImageUri: processed.uri },
      });
    }
    return;
  }

  if (typeof navigation.popTo === "function") {
    navigation.popTo("CameraMain", {
      pendingCrop: {
        uri: processed.uri,
        displayUri,
        width: processed.width,
        height: processed.height,
      },
    });
  } else {
    navigation.navigate({
      name: "CameraMain",
      params: {
        pendingCrop: {
          uri: processed.uri,
          displayUri,
          width: processed.width,
          height: processed.height,
        },
      },
      merge: true,
    });
  }
  identifyFlowLog("returned_to_camera");
  identifyFlowLog("preview_ready", { uriPrefix: processed.uri.slice(0, 32) });
}
