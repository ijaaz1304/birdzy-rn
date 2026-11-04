jest.mock("../../src/services/api/axios", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));
let api: typeof import("@/features/explore/services/explore.api").exploreApi;
let client: { get: jest.Mock; post: jest.Mock };
beforeEach(() => {
  jest.useFakeTimers();
  jest.isolateModules(() => {
    api = require("@/features/explore/services/explore.api").exploreApi;
    client = require("../../src/services/api/axios").apiClient;
  });
});
afterEach(() => jest.useRealTimers());
test("uses the Shroomzy-compatible POST route, standard authenticated client and raw GeoJSON response", async () => {
  const raw = { type: "FeatureCollection" as const, features: [] };
  client.post.mockResolvedValueOnce({ data: raw });
  const signal = new AbortController().signal;
  const params = {
    bbox: "77.5,12.9,77.7,13.1",
    birdSize: "edible",
    conservationStatus: "none",
    birdType: "no",
    habitat: "Forest",
  };
  expect(await api.fetchMapGeoJSON(params, signal)).toBe(raw);
  expect(client.post).toHaveBeenCalledWith(
    "/core/archetypes/explore-map-geojson",
    undefined,
    { params, signal }
  );
  expect(client.get).not.toHaveBeenCalled();
});
test("never issues an unbounded request or uses the implicit Dagestan default", async () => {
  await expect(api.fetchMapGeoJSON({ bbox: "" })).rejects.toThrow("bounds");
  expect(client.get).not.toHaveBeenCalled();
  expect(client.post).not.toHaveBeenCalled();
});
test("already canceled map requests never leave the client", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    api.fetchMapGeoJSON({ bbox: "1,1,2,2" }, controller.signal)
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(client.get).not.toHaveBeenCalled();
  expect(client.post).not.toHaveBeenCalled();
});
test("uses strict location-only bird body and preserves pagination, tab and cancellation", async () => {
  const response = {
    error: false,
    data: [],
    sightings: [],
    tabs: {},
    pagination: {},
  };
  client.post.mockResolvedValueOnce({ data: response });
  const body = {
    location: { lat: 1, lng: 2 },
    radius: 5,
    birdSize: ["edible", "toxic"],
  };
  const query = { pageNo: 2, pageSize: 20, tab: "yearRound" as const };
  const signal = new AbortController().signal;
  expect(await api.fetchExploreNearYou(body, query, signal)).toBe(response);
  expect(client.post).toHaveBeenCalledWith(
    "/core/archetypes/explore-near-you",
    { location: body.location },
    { params: query, signal }
  );
  expect(client.get).not.toHaveBeenCalled();
});

test("a map-specific rate limit does not put card queries into cooldown", async () => {
  const busy = { status: 429, retryAfter: "60" };
  client.post.mockRejectedValueOnce(busy);
  await expect(api.fetchMapGeoJSON({ bbox: "1,1,2,2" })).rejects.toBe(busy);
  const cards = {
    error: false,
    data: [],
    sightings: [],
    tabs: {},
    pagination: {},
  };
  client.post.mockResolvedValueOnce({ data: cards });
  expect(
    await api.fetchExploreNearYou({ location: { lat: 1, lng: 1 }, radius: 5 })
  ).toBe(cards);
  expect(client.post).toHaveBeenCalledTimes(2);
});
