import { copyCaptureToStableCache } from "../camera/camera.utils";
import { getFirebaseStorageUrl } from "../../lib/firebase/storage";
import { storageService } from "../../services/firebase/storage.service";
import {
  isRemoteImageUrl,
  toPublicStorageDisplayUrl,
  USER_COLLECTION_PHOTO_STORAGE_PATH,
} from "./userCollectionPhoto";

/** Upload a local identification capture and return a public Storage URL. */
export async function uploadUserCaptureForCollection(
  captureUri: string
): Promise<string> {
  const trimmed = captureUri.trim();
  if (!trimmed) {
    throw new Error("Missing identification photo");
  }
  if (isRemoteImageUrl(trimmed)) return toPublicStorageDisplayUrl(trimmed);

  const stable = (await copyCaptureToStableCache(trimmed)) ?? trimmed;
  let uploadUri = stable;
  try {
    const { compressImageForUpload } =
      require("../../utils/imageProcessing/compressImageForUpload") as typeof import("../../utils/imageProcessing/compressImageForUpload");
    const compressed = await compressImageForUpload(stable);
    if (compressed.uri?.trim()) uploadUri = compressed.uri.trim();
  } catch {
    uploadUri = stable;
  }

  const fileName = `specimen-capture-${Date.now()}.jpg`;
  const result = await storageService.uploadImage({
    path: USER_COLLECTION_PHOTO_STORAGE_PATH,
    fileName,
    uri: uploadUri,
  });
  const url = getFirebaseStorageUrl(
    result.path || `${USER_COLLECTION_PHOTO_STORAGE_PATH}/${fileName}`
  );
  if (!isRemoteImageUrl(url)) {
    throw new Error("Upload did not return a photo URL");
  }
  return url;
}
