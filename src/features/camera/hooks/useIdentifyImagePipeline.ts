import { useCallback, useState } from "react";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PhotoFile } from "react-native-vision-camera";
import { CameraStackParamList } from "../../../navigation/types";
import type { CaptureFrameLayout } from "../captureFrameLayout";
import type { CroppedImageObject } from "../cropImageAndReturnObject";
import {
  processCameraCapturePreview,
  processGalleryImageForIdentify,
  submitProcessedImageForIdentify,
} from "../identifyImageFlow";
import { identifyFlowLog } from "../identifyFlowLog";

type IdentifyPipelineNavigation = NativeStackNavigationProp<
  CameraStackParamList,
  "CameraMain" | "GalleryPicker"
>;

export function useIdentifyImagePipeline(params: {
  navigation: IdentifyPipelineNavigation;
  isPremium: boolean;
  onLimitReached: () => void;
  onError?: (message: string) => void;
}) {
  const { navigation, isPremium, onLimitReached, onError } = params;
  const [isProcessing, setIsProcessing] = useState(false);

  const processCameraCapture = useCallback(
    async (
      photo: PhotoFile,
      previewLayout: CaptureFrameLayout
    ): Promise<CroppedImageObject | null> => {
      try {
        return await processCameraCapturePreview(photo, previewLayout);
      } catch (error) {
        console.error("Camera capture failed:", error);
        onError?.("Could not process that photo. Please try another.");
        return null;
      }
    },
    [onError]
  );

  const processAndSubmit = useCallback(
    async (
      pathOrUri: string,
      options?: { returnImageToAskAI?: boolean; navigate?: boolean }
    ): Promise<CroppedImageObject | null> => {
      setIsProcessing(true);
      try {
        const processed = await processGalleryImageForIdentify(pathOrUri);
        if (!processed) return null;

        if (options?.navigate !== false) {
          await submitProcessedImageForIdentify({
            image: processed,
            navigation,
            isPremium,
            onLimitReached,
            returnImageToAskAI: options?.returnImageToAskAI,
          });
        }

        return processed;
      } catch (error) {
        console.error("Gallery image failed:", error);
        onError?.("Could not process that photo. Please try another.");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [isPremium, navigation, onError, onLimitReached]
  );

  const submitProcessed = useCallback(
    async (
      image: CroppedImageObject,
      options?: { returnImageToAskAI?: boolean }
    ) => {
      setIsProcessing(true);
      try {
        if (options?.returnImageToAskAI) {
          await submitProcessedImageForIdentify({
            image,
            navigation,
            isPremium,
            onLimitReached,
            returnImageToAskAI: true,
          });
          return;
        }

        await submitProcessedImageForIdentify({
          image,
          displayImage: image,
          navigation,
          isPremium,
          onLimitReached,
        });
        identifyFlowLog("submit_processed_complete");
      } catch (error) {
        console.error("Submit processed image failed:", error);
        onError?.("Could not process that photo. Please try another.");
      } finally {
        setIsProcessing(false);
      }
    },
    [isPremium, navigation, onError, onLimitReached]
  );

  return {
    isProcessing,
    processCameraCapture,
    processAndSubmit,
    submitProcessed,
  };
}
