jest.mock("../../src/features/explore/services/explore.api", () => ({
  exploreApi: { fetchMapGeoJSON: jest.fn(), fetchExploreNearYou: jest.fn() },
}));
jest.mock("../../src/services/archetype/archetype.service", () => ({
  archetypeService: { getFilterItems: jest.fn() },
}));
import { exploreService } from "../../src/features/explore/services/explore.service";
import { exploreApi } from "../../src/features/explore/services/explore.api";
const map = jest.mocked(exploreApi.fetchMapGeoJSON);
const empty = { type: "FeatureCollection" as const, features: [] };
beforeEach(() => map.mockReset());
test("independent date-line map reads start together and preserve the Bird radius", async () => {
  let finish!: (value: typeof empty) => void;
  map
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    )
    .mockResolvedValueOnce(empty);
  const request = exploreService.fetchExploreMap({
    location: { lat: 0, lng: 179.9 },
    radius: 100,
  });
  expect(map).toHaveBeenCalledTimes(2);
  finish(empty);
  await expect(request).resolves.toEqual(empty);
});
test("one failed map read aborts the rest of its group", async () => {
  map
    .mockRejectedValueOnce(new Error("offline"))
    .mockReturnValueOnce(new Promise(() => {}));
  const request = exploreService.fetchExploreMap({
    location: { lat: 0, lng: 179.9 },
    radius: 100,
  });
  const sibling = map.mock.calls[1][1]!;
  await expect(request).rejects.toThrow("offline");
  expect(sibling.aborted).toBe(true);
});
