import { CAMERA_STRINGS } from "../../config/strings/camera.strings";

/** Placeholder labels that should not pre-fill the change-location search field. */
export function sanitizeLocationSearchQuery(
  label?: string | null
): string {
  const trimmed = label?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed === CAMERA_STRINGS.location.setLocationFallback) return "";
  if (trimmed === CAMERA_STRINGS.location.detectingLocation) return "";
  return trimmed;
}
