/**
 * iOS identify gallery — PHPicker via react-native-image-picker (no Photos permission gate).
 * After pick, GalleryPickerScreen shows review UI + location footer → crop → identify.
 */

import { Platform } from "react-native";
import { analyticsService } from "../../services/analytics/analytics.service";
import { EVENTS } from "../../services/analytics/analytics.events";
import { resolvePreviewImageUri } from "./camera.utils";
import type { GalleryPhoto } from "./galleryPhoto.types";
import { identifyFlowLog } from "./identifyFlowLog";
import { launchIosGalleryImage } from "./iosGallerySelection";
import type { AndroidGalleryPickResult } from "./androidIdentifyGalleryFlow";

export async function pickIosGalleryImageForIdentify(): Promise<AndroidGalleryPickResult> {
  if (Platform.OS !== "ios") {
    return { status: "cancelled" };
  }

  analyticsService.logEvent(EVENTS.identify_photo, { source: "gallery" });
  identifyFlowLog("gallery_ios_system_picker_started");

  const result = await launchIosGalleryImage();

  if (result.status === "cancelled") {
    identifyFlowLog("gallery_ios_system_picker_cancelled");
    return { status: "cancelled" };
  }

  if (result.status === "error") {
    identifyFlowLog("gallery_ios_flow_error", { message: result.message });
    throw new Error(result.message);
  }

  identifyFlowLog("gallery_ios_system_picker_selected", {
    pathPrefix: result.uri.slice(0, 32),
  });

  const previewUri = await resolvePreviewImageUri(result.uri);
  const photo: GalleryPhoto = {
    id: result.uri,
    uri: previewUri,
    width: result.asset.width,
    height: result.asset.height,
    filename: result.asset.fileName ?? undefined,
  };

  return { status: "success", photo };
}
