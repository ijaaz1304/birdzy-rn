import { CAMERA_STRINGS } from "../../config/strings/camera.strings";
import type { IdentificationLocation } from "./identificationLocation.store";
import { useIdentificationLocationStore } from "./identificationLocation.store";

export type ChangeLocationSheetVariant = "add" | "custom";

/** True when GPS coords are present (not placeholder 0,0). */
export function hasValidDeviceCoords(
  location: IdentificationLocation | null | undefined
): boolean {
  if (!location) return false;
  const { latitude, longitude } = location;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return !(latitude === 0 && longitude === 0);
}

/** True when we should fetch GPS from the device (no usable coords yet). */
export function needsInitialDeviceLocationFetch(
  location: IdentificationLocation | null | undefined
): boolean {
  if (!hasValidDeviceCoords(location)) return true;
  const address = location?.address?.trim();
  if (!address) return true;
  if (address === CAMERA_STRINGS.location.setLocationFallback) return true;
  return false;
}

/** True when coords exist but the label still needs reverse geocoding. */
export function needsBackgroundGeocode(
  location: IdentificationLocation | null | undefined
): boolean {
  if (!hasValidDeviceCoords(location)) return false;
  const address = location?.address?.trim();
  if (!address) return true;
  if (address === CAMERA_STRINGS.location.detectingLocation) return true;
  // Coord labels are a valid resolved state — avoid re-geocoding in a loop.
  return false;
}

/** True when the user already has a meaningful location set (GPS or manual). */
export function hasIdentificationLocationSet(
  location: IdentificationLocation | null | undefined
): boolean {
  const address = location?.address?.trim();
  if (!address) return false;
  if (address === CAMERA_STRINGS.location.setLocationFallback) return false;
  if (address === CAMERA_STRINGS.location.detectingLocation) return false;
  return true;
}

/** Granted-style banner (place name row) — not the turn-on / tap-to-set prompts. */
export function shouldShowLocationBannerAsGranted(
  permissionGranted: boolean,
  location: IdentificationLocation | null | undefined
): boolean {
  if (permissionGranted) return true;
  const address = location?.address?.trim();
  if (!address) return false;
  if (address === CAMERA_STRINGS.location.setLocationFallback) return false;
  if (address === CAMERA_STRINGS.location.detectingLocation) return true;
  return hasIdentificationLocationSet(location);
}

export function resolveChangeLocationVariant(
  location: IdentificationLocation | null | undefined
): ChangeLocationSheetVariant {
  return hasIdentificationLocationSet(location) ? "custom" : "add";
}

/** True when the identify entry gate should prompt for location before the camera. */
export function shouldShowIdentificationLocationGate(): boolean {
  const { location, permissionGranted } =
    useIdentificationLocationStore.getState();
  if (permissionGranted) return false;
  return !hasIdentificationLocationSet(location);
}

/** Valid GPS/manual coords for POST /core/ai/identify `userLocation: [lat, lng]`. */
export function getIdentificationUserLocationForApi():
  | [number, number]
  | undefined {
  const { location, permissionGranted } =
    useIdentificationLocationStore.getState();
  if (!permissionGranted || !location) return undefined;

  const lat = location.latitude;
  const lng = location.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat === 0 && lng === 0) return undefined;

  return [lat, lng];
}
