import type { Feature, Point } from "geojson";
import type {
  ExploreLocation,
  ExploreMapGeoJSON,
  ExploreMapProperties,
  ExploreMapQueryParams,
  ExploreNearYouRequestBody,
} from "./explore.api.types";
import { isValidCoordinate } from "@/features/explore/utils/locationCoordinates";

const EARTH_RADIUS_KM = 6371.0088;
const RAD = Math.PI / 180;
const DEGREES = 180 / Math.PI;
const MULTI_FILTERS = ["birdSize", "birdType", "conservationStatus"] as const;

/** A radius query may cross the date line; this GET contract requires ordered SW/NE boxes. */
export function radiusBoundingBoxes(
  location: ExploreLocation,
  radiusKm: number
): string[] {
  if (
    !isValidCoordinate(location.lat, location.lng) ||
    !Number.isFinite(radiusKm) ||
    radiusKm <= 0 ||
    radiusKm >= Math.PI * EARTH_RADIUS_KM
  )
    throw new Error("Invalid map search area.");
  const angle = radiusKm / EARTH_RADIUS_KM;
  const lat = location.lat * RAD;
  const minLat = Math.max(-90, location.lat - angle * DEGREES);
  const maxLat = Math.min(90, location.lat + angle * DEGREES);
  const crossesPole = minLat === -90 || maxLat === 90;
  const deltaLng = crossesPole
    ? 180
    : Math.asin(Math.min(1, Math.sin(angle) / Math.cos(lat))) * DEGREES;
  const west = location.lng - deltaLng;
  const east = location.lng + deltaLng;
  const box = (minLng: number, maxLng: number) =>
    [minLng, minLat, maxLng, maxLat].join(",");
  if (crossesPole) return [box(-180, 180)];
  if (west < -180) return [box(west + 360, 180), box(-180, east)];
  if (east > 180) return [box(west, 180), box(-180, east - 360)];
  return [box(west, east)];
}

export function distanceKm(
  location: ExploreLocation,
  longitude: number,
  latitude: number
): number {
  const dLat = (latitude - location.lat) * RAD;
  const dLng = (longitude - location.lng) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(location.lat * RAD) *
      Math.cos(latitude * RAD) *
      Math.sin(dLng / 2) ** 2;
  return (
    2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))))
  );
}

/** Metadata for habitat is missing in the supplied examples, so union scalar habitat requests. */
export function mapQueries(
  body: ExploreNearYouRequestBody
): ExploreMapQueryParams[] {
  const habitats = body.habitat?.length
    ? [...new Set(body.habitat)]
    : [undefined];
  return radiusBoundingBoxes(body.location, body.radius ?? 100).flatMap(
    (bbox) =>
      habitats.map((habitat) => {
        const query: ExploreMapQueryParams = { bbox };
        for (const key of MULTI_FILTERS)
          if (body[key]?.length === 1) query[key] = body[key]![0];
        if (habitat) query.habitat = habitat;
        return query;
      })
  );
}

/** Validate the wire shape once; Mapbox consumes the retained server features directly. */
export function validateMapGeoJSON(value: unknown): ExploreMapGeoJSON {
  const collection = value as Partial<ExploreMapGeoJSON> | null;
  if (
    collection?.type !== "FeatureCollection" ||
    !Array.isArray(collection.features)
  ) {
    throw new Error("Unable to load map activity: invalid GeoJSON response.");
  }
  const features: Feature<Point, ExploreMapProperties>[] = [];
  for (const feature of collection.features) {
    const coordinates =
      feature?.geometry?.type === "Point" ? feature.geometry.coordinates : null;
    if (
      feature?.type !== "Feature" ||
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !coordinates.every(
        (coordinate) =>
          typeof coordinate === "number" && Number.isFinite(coordinate)
      ) ||
      !isValidCoordinate(coordinates[1], coordinates[0])
    )
      continue;
    const hasId =
      typeof feature.id === "string"
        ? !!feature.id.trim()
        : typeof feature.id === "number" && Number.isFinite(feature.id);
    if (
      !hasId ||
      typeof feature.properties?.birdsLifeId !== "string" ||
      !feature.properties.birdsLifeId.trim()
    ) {
      throw new Error(
        "Unable to load map activity: missing observation or species identifiers."
      );
    }
    features.push(feature);
  }
  return { type: "FeatureCollection", features };
}

/** Match the legacy radius (not its surrounding rectangle), and keep OR within each trait. */
export function mergeMapGeoJSON(
  collections: ExploreMapGeoJSON[],
  body: ExploreNearYouRequestBody
): ExploreMapGeoJSON {
  const features = new Map<
    string | number,
    ExploreMapGeoJSON["features"][number]
  >();
  for (const collection of collections)
    for (const feature of collection.features) {
      const [lng, lat] = feature.geometry.coordinates;
      if (distanceKm(body.location, lng, lat) > (body.radius ?? 100) + 1e-6)
        continue;
      let matches = true;
      let missingMetadata = false;
      for (const key of MULTI_FILTERS) {
        const values = body[key];
        if (!values || values.length <= 1) continue; // A scalar predicate was applied by the server.
        const actual = feature.properties[key];
        if (typeof actual !== "string" && !Array.isArray(actual)) {
          missingMetadata = true;
          continue;
        }
        if (
          !(Array.isArray(actual)
            ? actual.some((value) => values.includes(value))
            : values.includes(actual as string))
        ) {
          matches = false;
          break;
        }
      }
      if (matches && missingMetadata)
        throw new Error(
          "Map activity is missing filter metadata. Please retry or select one value for this filter."
        );
      if (matches) features.set(feature.id!, feature);
    }
  return { type: "FeatureCollection", features: [...features.values()] };
}
