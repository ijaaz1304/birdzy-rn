/**
 * Resolves coordinates for Near You catalogue and step-by-step wizard
 * from birding region preference + GPS fallback.
 */

import { getCurrentLocation } from "./locationService";
import { getIdentificationUserLocationForApi } from "../features/camera/locationToggle.helpers";
import {
  getBirdRegionLabel,
  getBirdRegionPreference,
  type BirdRegionId,
} from "../services/session/birdRegionPreference.service";

const REGION_CENTROIDS: Record<
  Exclude<BirdRegionId, "auto">,
  [number, number]
> = {
  global: [30, 0],
  "us-northeast": [42.5, -71.5],
  "us-southeast": [33.0, -84.0],
  "us-midwest": [41.5, -93.5],
  "us-west": [37.5, -119.5],
  "uk-ireland": [53.5, -2.5],
  europe: [50.0, 10.0],
};

export type BirdDiscoveryLocation = {
  coords: [number, number];
  source: "gps" | "preset" | "global";
  label: string;
  regionId: BirdRegionId;
};

export async function resolveBirdDiscoveryLocation(): Promise<BirdDiscoveryLocation | null> {
  const regionId = await getBirdRegionPreference();

  if (regionId === "global") {
    const coords = REGION_CENTROIDS.global;
    return {
      coords,
      source: "global",
      label: getBirdRegionLabel(regionId),
      regionId,
    };
  }

  if (regionId !== "auto") {
    const coords = REGION_CENTROIDS[regionId];
    return {
      coords,
      source: "preset",
      label: getBirdRegionLabel(regionId),
      regionId,
    };
  }

  let coords = getIdentificationUserLocationForApi();
  if (!coords) {
    try {
      const loc = await getCurrentLocation({ timeout: 12000 });
      if (loc?.latitude != null && loc?.longitude != null) {
        coords = [loc.latitude, loc.longitude];
      }
    } catch {
      // fall through
    }
  }

  if (!coords) return null;

  return {
    coords,
    source: "gps",
    label: `${coords[0].toFixed(2)}°, ${coords[1].toFixed(2)}°`,
    regionId,
  };
}
