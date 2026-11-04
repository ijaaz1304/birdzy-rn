jest.mock("@/utils/birdDiscoveryLocation.helpers", () => ({
  resolveBirdDiscoveryLocation: async () => ({
    coords: [19, 72],
    source: "gps",
    regionId: "auto",
  }),
}));
jest.mock("@/utils/mushroomCardUtils", () => ({
  resolveMushroomImageUrlsForDisplay: (_name: string, images: string[]) =>
    images,
}));
jest.mock("@/utils/mushroomDisplayUtils", () => ({
  getPrimaryCommonName: () => "Sparrow",
}));
jest.mock("@/services/api/features/core.api", () => ({
  coreApi: { stepByStep: jest.fn(), addSpecimen: jest.fn() },
}));
jest.mock("@/utils/mushroomApiMappers", () => ({
  normalizeArchetypeListResponse: (response: unknown) => response,
  normalizeArchetypeStats: (data: unknown) => data,
  normalizeMushroomDetail: (data: unknown) => data,
  normalizeArchetypeListItem: (data: unknown) => data,
}));
jest.mock("@/features/app-logs/app-logs.store", () => ({
  useAppLogsStore: {
    getState: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
  },
}));
import { coreApi } from "@/services/api/features/core.api";
import { archetypeService } from "@/services/archetype/archetype.service";
import { mushroomSpecimenService } from "@/services/specimen/mushroomSpecimen.service";
test("service forwards real user location, date and size instead of the old fixed test payload", async () => {
  jest.mocked(coreApi.stepByStep).mockResolvedValue({
    error: false,
    data: [],
    pagination: { pageNo: 1, pageSize: 20, totalCount: 0 },
  });
  const answers = {
    location: { lat: 19.07, lng: 72.87 },
    seenDate: "2026-11-02T00:00:00Z",
    birdSize: ["Very Large"],
  };
  await archetypeService.stepByStep(answers, { pageNo: 1, pageSize: 20 });
  expect(coreApi.stepByStep).toHaveBeenCalledWith(answers, {
    pageNo: 1,
    pageSize: 20,
  });
});
test("specimen service does not silently discard documented flightPattern data", async () => {
  jest
    .mocked(coreApi.addSpecimen)
    .mockResolvedValue({ error: false, data: {} } as Awaited<
      ReturnType<typeof coreApi.addSpecimen>
    >);
  const specimen = {
    scientificName: "Passer domesticus",
    imageUrls: ["https://example.com/bird.jpg"],
    _collections: [],
    flightPattern: ["Flapping"],
  };
  await mushroomSpecimenService.addSpecimen(specimen);
  expect(coreApi.addSpecimen).toHaveBeenCalledWith(specimen);
});

import { fetchNearYouCollectionPreview } from "@/features/collection/collection.utils";
test("nearby collection shows the backend total rather than the four preview images", async () => {
  jest
    .mocked(coreApi.stepByStep)
    .mockResolvedValue({
      error: false,
      data: [
        {
          archetypeId: "a",
          scientificName: "Passer domesticus",
          imageUrls: ["https://example.com/bird.jpg"],
        },
      ],
      pagination: { pageNo: 1, pageSize: 4, totalCount: 82 },
    } as Awaited<ReturnType<typeof coreApi.stepByStep>>);
  const preview = await fetchNearYouCollectionPreview();
  expect(preview).toEqual({
    count: 82,
    images: ["https://example.com/bird.jpg"],
  });
  expect(coreApi.stepByStep).toHaveBeenLastCalledWith(
    expect.objectContaining({ location: { lat: 19, lng: 72 } }),
    { pageNo: 1, pageSize: 4 }
  );
});
