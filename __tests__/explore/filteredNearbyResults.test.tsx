import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@/features/explore/services/explore.service", () => ({
  exploreService: { fetchExploreNearYou: jest.fn() },
}));

import { exploreService } from "@/features/explore/services/explore.service";
import type {
  ExploreArchetypeCard,
  ExploreMapGeoJSON,
} from "@/features/explore/services/explore.api.types";
import {
  birdsLifeIdsFromGeoJSON,
  countFilterValues,
  filteredNearbyCards,
  withoutFilterValue,
} from "../../src/features/explore/utils/filteredNearbyResults";
import {
  MAX_FILTER_RESULT_PAGES,
  useNearbyBirdsForFilters,
} from "../../src/features/explore/hooks/useNearbyBirdsForFilters";

const fetchNearby = jest.mocked(exploreService.fetchExploreNearYou);
const card = (id: string, name = `Bird ${id}`): ExploreArchetypeCard => ({
  archetypeId: `a-${id}`,
  birdsLifeId: id,
  scientificName: `Avis ${id}`,
  commonName: name,
  imageUrls: [],
  defaultImageUrl: "",
  isWishlisted: false,
  isSpottedNow: false,
  distanceFromUser: 1,
});
const page = (ids: string[], pageNo: number, totalCount: number) => ({
  data: ids.map((id) => card(id)),
  tabs: { spottedNowCount: 0, yearRoundCount: totalCount },
  pagination: { pageNo, pageSize: 20, totalCount },
});
const geo = (ids: (string | undefined)[]): ExploreMapGeoJSON => ({
  type: "FeatureCollection",
  features: ids.map((birdsLifeId, i) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: { id: `obs-${i}`, birdsLifeId: birdsLifeId as string },
  })),
});

describe("filtered nearby helpers", () => {
  test("collects unique species IDs from map features", () => {
    expect([
      ...birdsLifeIdsFromGeoJSON(geo(["1", "2", "1", undefined])),
    ]).toEqual(["1", "2"]);
  });

  test("keeps only matching species and applies the name search", () => {
    const cards = [card("1", "Blue Tit"), card("2", "Great Tit"), card("3")];
    const ids = new Set(["1", "2"]);
    expect(
      filteredNearbyCards(cards, ids, "").map((c) => c.birdsLifeId)
    ).toEqual(["1", "2"]);
    expect(
      filteredNearbyCards(cards, ids, " blue ").map((c) => c.birdsLifeId)
    ).toEqual(["1"]);
    expect(
      filteredNearbyCards(cards, ids, "avis 2").map((c) => c.birdsLifeId)
    ).toEqual(["2"]);
  });

  test("removing the last value drops the filter key", () => {
    const filters = { habitat: ["Forest", "Wetland"], birdSize: ["Small"] };
    expect(withoutFilterValue(filters, "habitat", "Forest")).toEqual({
      habitat: ["Wetland"],
      birdSize: ["Small"],
    });
    expect(withoutFilterValue(filters, "birdSize", "Small")).toEqual({
      habitat: ["Forest", "Wetland"],
    });
    expect(countFilterValues(filters)).toBe(3);
  });
});

describe("useNearbyBirdsForFilters", () => {
  let latest: ReturnType<typeof useNearbyBirdsForFilters>;
  const Probe = ({ ids }: { ids: ReadonlySet<string> | null }) => {
    latest = useNearbyBirdsForFilters({ lat: 1, lng: 2 }, ids);
    return null;
  };
  const settle = async () => {
    for (let i = 0; i < MAX_FILTER_RESULT_PAGES + 2; i++)
      await act(async () => {
        await Promise.resolve();
      });
  };

  beforeEach(() => fetchNearby.mockReset());

  test("reads year-round pages until every filtered species is found", async () => {
    fetchNearby
      .mockResolvedValueOnce(page(["1", "2"], 1, 6))
      .mockResolvedValueOnce(page(["3", "4"], 2, 6));
    await act(async () => {
      TestRenderer.create(<Probe ids={new Set(["2", "4"])} />);
    });
    await settle();
    expect(fetchNearby).toHaveBeenCalledTimes(2);
    expect(fetchNearby.mock.calls[1][1]).toEqual({
      pageNo: 2,
      pageSize: 20,
      tab: "yearRound",
    });
    expect(fetchNearby.mock.calls[0][0]).toEqual({
      location: { lat: 1, lng: 2 },
    });
    expect(latest.complete).toBe(true);
    expect(latest.cards.map((c) => c.birdsLifeId)).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  test("stops when the list ends without finding every species", async () => {
    fetchNearby.mockResolvedValueOnce(page(["1"], 1, 1));
    await act(async () => {
      TestRenderer.create(<Probe ids={new Set(["9"])} />);
    });
    await settle();
    expect(fetchNearby).toHaveBeenCalledTimes(1);
    expect(latest.complete).toBe(true);
    expect(latest.truncated).toBe(false);
  });

  test("does not request the list when no species match the filters", async () => {
    await act(async () => {
      TestRenderer.create(<Probe ids={new Set()} />);
    });
    await settle();
    expect(fetchNearby).not.toHaveBeenCalled();
    expect(latest.complete).toBe(true);
  });

  test("waits for map results before reading the list", async () => {
    await act(async () => {
      TestRenderer.create(<Probe ids={null} />);
    });
    await settle();
    expect(fetchNearby).not.toHaveBeenCalled();
  });

  test("an error pauses loading until retry", async () => {
    fetchNearby
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(page(["1"], 1, 1));
    await act(async () => {
      TestRenderer.create(<Probe ids={new Set(["1"])} />);
    });
    await settle();
    expect(latest.error).toBe("offline");
    expect(fetchNearby).toHaveBeenCalledTimes(1);
    await act(async () => latest.retry());
    await settle();
    expect(fetchNearby).toHaveBeenCalledTimes(2);
    expect(fetchNearby.mock.calls[1][1]?.pageNo).toBe(1);
    expect(latest.cards).toHaveLength(1);
  });
});

test("changing location resets the imperative page snapshot before the next resolver starts", async () => {
  fetchNearby
    .mockReset()
    .mockResolvedValueOnce(page(["old"], 1, 40))
    .mockResolvedValueOnce(page(["new"], 1, 1));
  let current!: ReturnType<typeof useNearbyBirdsForFilters>;
  function Place({ lat, id }: { lat: number; id: string }) {
    const ids = React.useMemo(() => new Set([id]), [id]);
    current = useNearbyBirdsForFilters({ lat, lng: 2 }, ids);
    return null;
  }
  let tree!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = TestRenderer.create(<Place lat={1} id="old" />);
  });
  await act(async () => tree.update(<Place lat={2} id="new" />));
  expect(fetchNearby.mock.calls.map(([, query]) => query?.pageNo)).toEqual([
    1, 1,
  ]);
  expect(current.cards.map((card) => card.birdsLifeId)).toEqual(["new"]);
  await act(async () => tree.unmount());
});
