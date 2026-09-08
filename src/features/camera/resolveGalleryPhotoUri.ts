import type { GalleryPhoto } from "./galleryPhoto.types";
import { normalizeFileUri } from "../../utils/imageProcessing/normalizeFileUri";
import { ensureLoadableUri } from "./camera.utils";
import { identifyFlowLog } from "./identifyFlowLog";

const ensureFilePrefix = (pathOrUri: string) => normalizeFileUri(pathOrUri);

/**
 * Resolve a gallery pick to a uri/path suitable for crop + upload.
 * Expects PHPicker / system picker to yield a local file path; rejects unresolved `ph://`.
 */
export async function resolveGalleryPhotoUri(
  photo: GalleryPhoto
): Promise<string> {
  identifyFlowLog("gallery_export_started", {
    internalId: (photo.id || photo.uri).slice(0, 24),
  });

  const resolved = await ensureLoadableUri(ensureFilePrefix(photo.uri));

  if (
    resolved.startsWith("ph://") ||
    resolved.startsWith("assets-library://")
  ) {
    identifyFlowLog("gallery_export_failed", {
      message: "unresolved_photos_uri",
    });
    throw new Error(
      "Unable to load the selected photo. Try another image or download it from iCloud first."
    );
  }

  identifyFlowLog("gallery_export_success", {
    pathPrefix: resolved.slice(0, 32),
  });
  return resolved;
}

/** @deprecated Use {@link resolveGalleryPhotoUri} — kept for call-site compatibility. */
export async function getPathForNativeCropper(
  photo: GalleryPhoto
): Promise<string> {
  return resolveGalleryPhotoUri(photo);
}
