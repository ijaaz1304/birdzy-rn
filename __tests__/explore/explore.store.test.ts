jest.mock("@/features/explore/services/explore.service", () => ({
  exploreService: {
    fetchExploreNearYou: jest.fn(),
    fetchExploreMap: jest.fn(),
  },
}));
jest.mock("@/features/explore/content/explore.config", () => ({
  ...jest.requireActual("@/features/explore/content/explore.config"),
  EXPLORE: { SEARCH_RADIUS_KM: 5 },
}));
import { useExploreStore } from "../../src/features/explore/explore.store";
import { exploreService } from "@/features/explore/services/explore.service";

const fetchExplore = jest.mocked(exploreService.fetchExploreNearYou);
type Result = Awaited<ReturnType<typeof exploreService.fetchExploreNearYou>>;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const result = (id = "one", pageNo = 1): Result => ({
  data: [{ archetypeId: id, isWishlisted: false } as Result["data"][number]],
  tabs: { spottedNowCount: 40, yearRoundCount: 40 },
  pagination: { pageNo, pageSize: 20, totalCount: 40 },
});
const flush = () => jest.advanceTimersByTimeAsync(0);
async function prime() {
  fetchExplore.mockResolvedValueOnce(result());
  const request = useExploreStore.getState().searchLocation({ lat: 1, lng: 1 });
  await flush();
  await request;
}

beforeEach(() => {
  jest.useFakeTimers();
  useExploreStore.getState().reset();
  fetchExplore.mockReset();
  jest
    .mocked(exploreService.fetchExploreMap)
    .mockReset()
    .mockResolvedValue({ type: "FeatureCollection", features: [] });
});
afterEach(() => {
  useExploreStore.getState().reset();
  jest.useRealTimers();
});

test("location changes invalidate a pending tab and settle its caller", async () => {
  await prime();
  const tab = useExploreStore.getState().setTab("yearRound");
  fetchExplore.mockResolvedValueOnce(result("new-location"));
  const search = useExploreStore.getState().searchLocation({ lat: 2, lng: 2 });
  await flush();
  await search;
  await tab;
  await jest.advanceTimersByTimeAsync(300);
  expect(fetchExplore).toHaveBeenCalledTimes(2);
  expect(fetchExplore.mock.calls[1][0].location).toEqual({ lat: 2, lng: 2 });
  expect(useExploreStore.getState().data[0].archetypeId).toBe("new-location");
});

test("reset rejects late completions and aborts transport", async () => {
  const old = deferred<Result>();
  fetchExplore.mockReturnValueOnce(old.promise);
  const search = useExploreStore.getState().searchLocation({ lat: 1, lng: 1 });
  await flush();
  const signal = fetchExplore.mock.calls[0][2]!;
  useExploreStore.getState().reset();
  old.resolve(result("old-account"));
  await search;
  expect(signal.aborted).toBe(true);
  expect(useExploreStore.getState().searchedLocation).toBeNull();
  expect(useExploreStore.getState().data).toEqual([]);
});
test("tab debounce immediately blocks pagination and old-tab completions", async () => {
  await prime();
  const old = deferred<Result>();
  fetchExplore.mockReturnValueOnce(old.promise);
  const search = useExploreStore.getState().retry();
  await flush();
  const tab = useExploreStore.getState().setTab("yearRound");
  expect(useExploreStore.getState().isLoading).toBe(true);
  await useExploreStore.getState().loadMore();
  old.resolve(result("old-tab"));
  await search;
  expect(useExploreStore.getState().data).toEqual([]);
  fetchExplore.mockResolvedValueOnce(result("year-round"));
  await jest.advanceTimersByTimeAsync(300);
  await tab;
  expect(fetchExplore.mock.calls[2][1]).toMatchObject({
    tab: "yearRound",
    pageNo: 1,
  });
});
test("rapid tab callers all settle and only final query is sent", async () => {
  await prime();
  const first = useExploreStore.getState().setTab("yearRound");
  const second = useExploreStore.getState().setTab("growingNow");
  fetchExplore.mockResolvedValueOnce(result());
  await jest.advanceTimersByTimeAsync(300);
  await Promise.all([first, second]);
  expect(fetchExplore).toHaveBeenCalledTimes(2);
});
test("identical locations, active tabs and equivalent filters do not refetch", async () => {
  await prime();
  await useExploreStore.getState().searchLocation({ lat: 1, lng: 1 });
  await useExploreStore.getState().setTab("growingNow");
  await useExploreStore.getState().applyFilters({ birdSize: [] });
  expect(fetchExplore).toHaveBeenCalledTimes(1);
});
test("a failed replacement cannot display old cards or sightings", async () => {
  await prime();
  fetchExplore.mockRejectedValueOnce(new Error("Network unavailable"));
  const search = useExploreStore.getState().searchLocation({ lat: 2, lng: 2 });
  await flush();
  await search;
  expect(useExploreStore.getState()).toMatchObject({
    data: [],
    isLoading: false,
    hasSearched: true,
    error: "Network unavailable",
  });
});
test("pagination deduplicates overlapping archetypes", async () => {
  await prime();
  fetchExplore.mockResolvedValueOnce(result("one", 2));
  await useExploreStore.getState().loadMore();
  expect(useExploreStore.getState().data).toHaveLength(1);
});
test("invalid coordinates never reach the API and genuine 0,0 is accepted", async () => {
  await useExploreStore.getState().searchLocation({ lat: 100, lng: 1 });
  expect(fetchExplore).not.toHaveBeenCalled();
  fetchExplore.mockResolvedValueOnce(result());
  const request = useExploreStore.getState().searchLocation({ lat: 0, lng: 0 });
  await flush();
  await request;
  expect(fetchExplore).toHaveBeenCalledTimes(1);
});

const mapResult = (id: string) => ({
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      id,
      geometry: { type: "Point" as const, coordinates: [1, 1] },
      properties: { id, birdsLifeId: "123" },
    },
  ],
});
test("map failure does not hide successful cards; map retry leaves pagination alone", async () => {
  jest
    .mocked(exploreService.fetchExploreMap)
    .mockRejectedValueOnce(new Error("Map offline"));
  await prime();
  expect(useExploreStore.getState().error).toBeNull();
  expect(useExploreStore.getState().data).toHaveLength(1);
  expect(useExploreStore.getState().mapDataError).toBe("Map offline");
  jest
    .mocked(exploreService.fetchExploreMap)
    .mockResolvedValueOnce(mapResult("retry"));
  await useExploreStore.getState().retryMap();
  expect(useExploreStore.getState().geoJSON.features[0].id).toBe("retry");
  expect(fetchExplore).toHaveBeenCalledTimes(1);
  expect(useExploreStore.getState().mapDataError).toBeNull();
});
test("map is unpaginated and does not refetch or change on seasonal tab switches", async () => {
  jest
    .mocked(exploreService.fetchExploreMap)
    .mockResolvedValueOnce(mapResult("all-activity"));
  await prime();
  const before = useExploreStore.getState().geoJSON;
  fetchExplore.mockResolvedValueOnce(result("next", 2));
  await useExploreStore.getState().loadMore();
  fetchExplore.mockResolvedValueOnce(result("year"));
  const tab = useExploreStore.getState().setTab("yearRound");
  await jest.advanceTimersByTimeAsync(300);
  await tab;
  expect(exploreService.fetchExploreMap).toHaveBeenCalledTimes(1);
  expect(useExploreStore.getState().geoJSON).toBe(before);
});
test("late map results cannot overwrite a new location or repopulate a reset session", async () => {
  const old = deferred<ReturnType<typeof mapResult>>();
  jest
    .mocked(exploreService.fetchExploreMap)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(mapResult("new"));
  await prime();
  const signal = jest.mocked(exploreService.fetchExploreMap).mock.calls[0][1]!;
  fetchExplore.mockResolvedValueOnce(result("new"));
  const search = useExploreStore.getState().searchLocation({ lat: 2, lng: 2 });
  await flush();
  await search;
  expect(signal.aborted).toBe(true);
  old.resolve(mapResult("old"));
  await flush();
  expect(useExploreStore.getState().geoJSON.features[0].id).toBe("new");
  const after = deferred<ReturnType<typeof mapResult>>();
  jest
    .mocked(exploreService.fetchExploreMap)
    .mockReturnValueOnce(after.promise);
  const request = useExploreStore.getState().retryMap();
  useExploreStore.getState().reset();
  after.resolve(mapResult("after-reset"));
  await request;
  expect(useExploreStore.getState().geoJSON.features).toEqual([]);
});
test("filter changes invalidate map data and retain strict filter arrays for the service", async () => {
  await prime();
  jest
    .mocked(exploreService.fetchExploreMap)
    .mockResolvedValueOnce(mapResult("filtered"));
  fetchExplore.mockResolvedValueOnce(result());
  const request = useExploreStore
    .getState()
    .applyFilters({ birdSize: ["toxic", "edible"] });
  await flush();
  await request;
  expect(
    jest.mocked(exploreService.fetchExploreMap).mock.calls[1][0]
  ).toMatchObject({ radius: 5, birdSize: ["edible", "toxic"] });
});

test("map filters preserve card pagination and retry retains committed map filters", async () => {
  await prime();
  const before = useExploreStore.getState().data;
  await useExploreStore.getState().applyFilters({ birdType: ["Seabird"] });
  expect(fetchExplore).toHaveBeenCalledTimes(1);
  expect(useExploreStore.getState().data).toBe(before);
  await useExploreStore.getState().retryMap();
  expect(exploreService.fetchExploreMap).toHaveBeenLastCalledWith(
    expect.objectContaining({ birdType: ["Seabird"] }),
    expect.anything()
  );
});
test("duplicate-only pages stop pagination even if the page number advances", async () => {
  await prime();
  fetchExplore.mockResolvedValueOnce(result("one", 2));
  await useExploreStore.getState().loadMore();
  await useExploreStore.getState().loadMore();
  expect(fetchExplore).toHaveBeenCalledTimes(2);
});
