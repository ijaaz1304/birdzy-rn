/**
 * Crop host — holds a freeze-frame of the capture while VisionCamera is released
 * and the native cropper presents.
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { AppImage } from "@/components/AppImage";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraStackParamList } from "../../../navigation/types";
import { openInteractiveCropper } from "../interactiveCrop";
import { isImageCropPickerCancelError } from "../cropImageAndReturnObject";
import {
  ensureLoadableUri,
  normalizeImageUriForCrop,
} from "../camera.utils";
import { identifyFlowError, identifyFlowLog } from "../identifyFlowLog";
import { navigateProcessedImageResult } from "../identifyImageFlow";
import { showAlert } from "../../../store/alert.store";
import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../subscription/subscription.store";
import { canIdentifyPhoto } from "../../../services/session/usageLimit.service";
import { analyticsService } from "../../../services/analytics/analytics.service";
import { EVENTS } from "../../../services/analytics/analytics.events";

type Nav = NativeStackNavigationProp<
  CameraStackParamList,
  "IdentifyImageCrop"
>;
type Route = RouteProp<CameraStackParamList, "IdentifyImageCrop">;

export const IdentifyImageCropScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const { imageUri, returnTarget, returnImageToAskAI, cameraAlreadyReleased } =
    route.params;
  const normalizedUri = useMemo(
    () => normalizeImageUriForCrop(imageUri),
    [imageUri]
  );
  const mountedRef = useRef(true);
  const startedUriRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!normalizedUri) {
        identifyFlowError("IFLOW-008", "Invalid crop input URI");
        showAlert("Unable to load photo", "Please try another image.");
        navigation.goBack();
        return;
      }
      if (startedUriRef.current === normalizedUri) return;
      startedUriRef.current = normalizedUri;

          identifyFlowLog("crop_host_opened", {
        returnTarget,
        pathPrefix: normalizedUri.slice(0, 32),
        screen: "IdentifyImageCrop",
      });
      analyticsService.logEvent(EVENTS.photo_cropping_screen);

      void (async () => {
        try {
          let cropInput = normalizedUri;
          try {
            cropInput = await ensureLoadableUri(normalizedUri);
          } catch {
            cropInput = normalizedUri;
          }
          if (!mountedRef.current) return;

          const cropped = await openInteractiveCropper(cropInput, {
            fromCropHost: true,
            cameraAlreadyReleased: cameraAlreadyReleased === true,
          });
          if (!mountedRef.current) return;

          if (!cropped) {
            identifyFlowLog("crop_host_cancelled");
            navigation.goBack();
            return;
          }

          analyticsService.logEvent(EVENTS.photo_crop_tick);
          analyticsService.logEvent(EVENTS.photo_submit_button);
          analyticsService.logEvent(EVENTS.photo_submitted);

          const target =
            returnImageToAskAI || returnTarget === "askAi"
              ? "askAi"
              : returnTarget;

          if (target === "analysis") {
            if (!isPremium) {
              const allowed = await canIdentifyPhoto();
              if (!allowed) {
                identifyFlowError("IFLOW-011", "Identification limit reached");
                navigation.goBack();
                return;
              }
            }
            navigateProcessedImageResult(navigation, cropped, {
              returnTarget: "analysis",
            });
            return;
          }

          if (target === "askAi") {
            navigateProcessedImageResult(navigation, cropped, {
              returnTarget: "askAi",
            });
            return;
          }

          navigateProcessedImageResult(navigation, cropped, {
            returnTarget: "camera",
          });
        } catch (error) {
          if (!mountedRef.current) return;
          if (isImageCropPickerCancelError(error)) {
            navigation.goBack();
            return;
          }
          identifyFlowError("IFLOW-003", "Cropper failed to open", {
            message: String((error as Error)?.message ?? error),
          });
          navigation.goBack();
        }
      })();

      return () => {
        startedUriRef.current = null;
      };
    }, [
      imageUri,
      isPremium,
      navigation,
      normalizedUri,
      returnImageToAskAI,
      returnTarget,
      cameraAlreadyReleased,
    ])
  );

  return (
    <View style={[styles.host, { backgroundColor: "#111111" }]} pointerEvents="none">
      {normalizedUri ? (
        <AppImage
          source={{ uri: normalizedUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          preferRNImage
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: "#111111",
  },
});
