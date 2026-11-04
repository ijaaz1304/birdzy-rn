jest.mock("../../src/constants/env", () => ({
  GEOCODING_API_BASE_URL: "https://geocode.maps.co",
  GEOCODING_API_KEY: "",
  MAPBOX_ACCESS_TOKEN: "pk.test",
}));
jest.mock("../../src/utils/locationDebug", () => ({
  logLocation: jest.fn(),
  logLocationError: jest.fn(),
}));
import { searchAddressSuggestions } from "../../src/features/explore/utils/geocodingApi";
const fetchMock = jest.fn();
const originalFetch = global.fetch;
let testTime = Date.now();
beforeEach(() => {
  jest.useFakeTimers({ now: (testTime += 60000) });
  global.fetch = fetchMock;
  fetchMock.mockReset();
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
});
const response = (data: unknown, status = 200) => ({
  ok: status === 200,
  status,
  headers: { get: () => null },
  json: async () => data,
});
async function search(query = "Chennai") {
  const promise = searchAddressSuggestions(query, { throwOnError: true });
  await jest.advanceTimersByTimeAsync(10000);
  return promise;
}
test("uses configured Mapbox when the separate geocoding key is absent, mapping longitude/latitude correctly", async () => {
  fetchMock.mockResolvedValue(
    response({
      features: [
        {
          properties: {
            mapbox_id: "place.1",
            name: "Chennai",
            place_formatted: "Tamil Nadu, India",
          },
          geometry: { coordinates: [80.27, 13.08] },
        },
      ],
    })
  );
  expect(await search()).toEqual([
    {
      placeId: "place.1",
      name: "Chennai, Tamil Nadu, India",
      formattedAddress: "Chennai, Tamil Nadu, India",
      location: { latitude: 13.08, longitude: 80.27 },
    },
  ]);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain("api.mapbox.com/search/geocode/v6/forward?");
  expect(url).toContain("q=Chennai");
  expect(options.headers.Authorization).toBeUndefined();
});
test("rejects malformed coordinates and does not cache temporary Mapbox results", async () => {
  fetchMock.mockResolvedValue(
    response({
      features: [
        {
          properties: { name: "Invalid" },
          geometry: { coordinates: [500, 500] },
        },
      ],
    })
  );
  expect(await search()).toEqual([]);
  expect(await search()).toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
test("canceled requests never reach the provider", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    searchAddressSuggestions("London", {
      signal: controller.signal,
      throwOnError: true,
    })
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(fetchMock).not.toHaveBeenCalled();
});
test("short searches do not reach the provider", async () => {
  expect(await searchAddressSuggestions("ab")).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("provider failures are surfaced instead of appearing as no matches", async () => {
  fetchMock.mockResolvedValue(response({}, 401));
  const pending = searchAddressSuggestions("London", { throwOnError: true });
  await Promise.all([
    expect(pending).rejects.toThrow("Unable to search locations"),
    jest.advanceTimersByTimeAsync(10000),
  ]);
});

test("malformed provider responses are surfaced instead of appearing as no matches", async () => {
  fetchMock.mockResolvedValue(response({ message: "bad response" }));
  const pending = searchAddressSuggestions("Mumbai", { throwOnError: true });
  await Promise.all([
    expect(pending).rejects.toThrow("Unable to search locations"),
    jest.advanceTimersByTimeAsync(10000),
  ]);
});
