import {
  mapQueries,
  radiusBoundingBoxes,
  validateMapGeoJSON,
  mergeMapGeoJSON,
} from "@/features/explore/services/exploreGeoJSON";
import { cardsForMapSelection } from "@/features/explore/exploreSelection";
import type {
  ExploreArchetypeCard,
  ExploreMapGeoJSON,
} from "@/features/explore/services/explore.api.types";
const body = { location: { lat: 0, lng: 0 }, radius: 100 };
const point = (id: string, coordinates = [0, 0], birdType = ["Seabird"]) => ({
  type: "Feature" as const,
  id,
  geometry: { type: "Point" as const, coordinates },
  properties: { id, birdsLifeId: "123", birdType },
});
const collection = (
  ...features: ExploreMapGeoJSON["features"]
): ExploreMapGeoJSON => ({ type: "FeatureCollection", features });
test("rejects missing BirdLife identifiers and drops invalid coordinates", () => {
  expect(
    validateMapGeoJSON(collection(point("valid"), point("invalid", [200, 100])))
      .features
  ).toHaveLength(1);
  expect(() =>
    validateMapGeoJSON({
      type: "FeatureCollection",
      features: [{ ...point("a"), properties: { gbifId: "123" } }],
    })
  ).toThrow("identifiers");
});
test("handles the date line with two ordered bounding boxes", () => {
  const boxes = radiusBoundingBoxes({ lat: 0, lng: 179.99 }, 100);
  expect(boxes).toHaveLength(2);
  boxes.forEach((box) => {
    const [west, , east] = box.split(",").map(Number);
    expect(west).toBeLessThan(east);
  });
});
test("map trait filters preserve OR values for array bird types and deduplicate observations", () => {
  const a = point("a"),
    b = point("b", [0, 0], ["Owl"]),
    outside = point("far", [20, 20]);
  const merged = mergeMapGeoJSON([collection(a, b, outside), collection(a)], {
    ...body,
    birdType: ["Seabird", "Waterfowl"],
  });
  expect(merged.features.map((f) => f.id)).toEqual(["a"]);
});
test("habitat filters become scalar requests and always include explicit bounds", () => {
  const queries = mapQueries({ ...body, habitat: ["Forest", "Wetland"] });
  expect(queries).toHaveLength(2);
  expect(queries.map((q) => q.habitat)).toEqual(["Forest", "Wetland"]);
  queries.forEach((query) => expect(query.bbox).toBeTruthy());
});
test("map observations match list species by BirdLife ID rather than observation or archetype ID", () => {
  const cards = [
    { archetypeId: "123", birdsLifeId: "other" },
    { archetypeId: "archetype", birdsLifeId: "123" },
  ] as ExploreArchetypeCard[];
  expect(cardsForMapSelection(cards, new Set(["123"]))).toEqual([cards[1]]);
});
