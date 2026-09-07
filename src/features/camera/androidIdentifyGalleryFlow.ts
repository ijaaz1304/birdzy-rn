/**
 * Android identify gallery — system photo picker only (no crop here).
 * After pick, GalleryPickerScreen shows review UI + location footer → crop → identify.
 */

import { Platform } from "react-native";
import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";
import { pickImageFromGallery, resolvePreviewImageUri } from "./camera.utils";
import { identifyFlowLog } from "./identifyFlowLog";
import {
  resolveIdentifyGalleryAccess,
  runIdentifyGalleryNativeRequest,
} from "./identifyGalleryAccessFlow";
import type { GalleryPhoto } from "./galleryPhoto.types";

export type AndroidGalleryPickResult =
  | { status: "success"; photo: GalleryPhoto }
  | { status: "cancelled" }
  | { status: "blocked" }
  | { status: "limit" };

type PickAndroidGalleryImageParams = {
  onGalleryBlocked?: () => void;
};

export async function pickAndroidGalleryImageForIdentify(
  params: PickAndroidGalleryImageParams = {}
): Promise<AndroidGalleryPickResult> {
  if (Platform.OS !== "android") {
    return { status: "cancelled" };
  }

  const { onGalleryBlocked } = params;

  const access = await resolveIdentifyGalleryAccess();
  if (access.status === "blocked") {
    onGalleryBlocked?.();
    return { status: "blocked" };
  }
  if (access.status === "needs_native_prompt") {
    const requested = await runIdentifyGalleryNativeRequest();
    if (requested.status === "granted") {
      // continue
    } else if (requested.status === "blocked") {
      onGalleryBlocked?.();
      return { status: "blocked" };
    } else {
      identifyFlowLog("gallery_android_permission_denied");
      return { status: "cancelled" };
    }
  }

  analyticsService.logEvent(EVENTS.identify_photo, { source: "gallery" });
  identifyFlowLog("gallery_android_system_picker_started");

  try {
    const response = await pickImageFromGallery();
    const asset = response.assets?.[0];
    if (!asset?.uri) {
      identifyFlowLog("gallery_android_system_picker_empty");
      return { status: "cancelled" };
    }

    identifyFlowLog("gallery_android_system_picker_selected", {
      pathPrefix: asset.uri.slice(0, 32),
    });

    const previewUri = await resolvePreviewImageUri(asset.uri);
    const photo: GalleryPhoto = {
      id: asset.uri,
      uri: previewUri,
      width: asset.width,
      height: asset.height,
      filename: asset.fileName ?? undefined,
    };

    return { status: "success", photo };
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    if (message.toLowerCase().includes("cancel")) {
      identifyFlowLog("gallery_android_system_picker_cancelled");
      return { status: "cancelled" };
    }
    identifyFlowLog("gallery_android_flow_error", { message });
    throw error;
  }
}
