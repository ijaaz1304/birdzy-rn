import { CAMERA_STRINGS } from "../../config/strings/camera.strings";
import { reverseGeocodeAddress } from "../../utils/geocodingApi";
import { logLocation } from "../../utils/locationDebug";

const COORD_LABEL_PATTERN = /^-?\d+\.\d+,\s*-?\d+\.\d+$/;

export const formatCoords = (latitude: number, longitude: number) =>
  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

export function looksLikeCoordLabel(value?: string): boolean {
  if (!value?.trim()) return false;
  return COORD_LABEL_PATTERN.test(value.trim());
}

/** True when device GPS should be fetched to populate location. */
export function shouldResolveLocationName(address?: string): boolean {
  if (!address?.trim()) return true;
  if (address === CAMERA_STRINGS.location.setLocationFallback) return true;
  if (address === CAMERA_STRINGS.location.detectingLocation) return true;
  if (looksLikeCoordLabel(address)) return true;
  return false;
}

/** Resolve a human-readable place name from GPS coordinates. */
export async function resolveLocationAddress(
  latitude: number,
  longitude: number
): Promise<string> {
  const coordLabel = formatCoords(latitude, longitude);
  logLocation("resolveLocationAddress: start", { latitude, longitude });

  const label = await reverseGeocodeAddress(latitude, longitude);
  if (label) {
    logLocation("resolveLocationAddress: using geocoding provider", { label });
    return label;
  }

  logLocation("resolveLocationAddress: fallback to coords", { coordLabel });
  return coordLabel;
}
