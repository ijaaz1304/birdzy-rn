import { useCallback, useState } from "react";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AskAIStackParamList } from "../../../navigation/types";
import {
  asIdentifyImage,
  processGalleryImageForIdentify,
} from "../../camera/identifyImageFlow";
import type { CroppedImageObject } from "../../camera/cropImageAndReturnObject";

type AskAINavigation = NativeStackNavigationProp<
  AskAIStackParamList,
  "AskAIMain" | "AskAIImageSource"
>;

export function useAskAIImagePipeline(params: {
  navigation: AskAINavigation;
  onError?: (message: string) => void;
}) {
  const { navigation, onError } = params;
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = useCallback(
    async (
      pathOrUri: string,
      options?: { alreadyCropped?: boolean }
    ): Promise<CroppedImageObject | null> => {
      setIsProcessing(true);
      try {
        if (options?.alreadyCropped) {
          return await asIdentifyImage(pathOrUri);
        }
        return await processGalleryImageForIdentify(pathOrUri);
      } catch (error) {
        console.error("Ask AI image failed:", error);
        onError?.("Could not process that image. Please try another.");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [onError]
  );

  const processAndSend = useCallback(
    async (pathOrUri: string): Promise<CroppedImageObject | null> => {
      const processed = await processImage(pathOrUri);
      if (!processed) return null;

      navigation.navigate("AskAIMain", {
        selectedImageUri: processed.uri,
      });
      return processed;
    },
    [navigation, processImage]
  );

  return {
    isProcessing,
    processImage,
    processAndSend,
  };
}
