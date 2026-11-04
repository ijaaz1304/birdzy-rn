jest.mock("@/services/api/axios", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock("@/constants/env", () => ({
  API_BASE_URL: "https://birds.example",
  API_TIMEOUT: 30000,
}));
jest.mock("@/features/auth/auth.store", () => ({
  useAuthStore: { getState: jest.fn() },
}));
import { coreApi } from "@/services/api/features/core.api";
import { apiClient } from "@/services/api/axios";
import { useAuthStore } from "@/features/auth/auth.store";
import { ApiException } from "@/services/api/errors";
const client = jest.mocked(apiClient);
const auth = {
  token: "jwt",
  user: { id: "account" },
  isLoading: false,
  refreshAuthToken: jest.fn(),
};
const fetchMock = jest.fn();
const originalFetch = global.fetch;
const json = {
  error: false,
  data: [],
  pagination: { pageNo: 0, pageSize: 20, totalCount: 0 },
};
const response = (status = 200, data: unknown = json) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: "Failure",
  json: async () => data,
});
beforeEach(() => {
  jest.clearAllMocks();
  auth.token = "jwt";
  auth.user = { id: "account" };
  jest
    .mocked(useAuthStore.getState)
    .mockReturnValue(
      auth as unknown as ReturnType<typeof useAuthStore.getState>
    );
  for (const method of [
    client.get,
    client.post,
    client.put,
    client.patch,
    client.delete,
  ])
    method.mockResolvedValue({ data: json });
  global.fetch = fetchMock;
  fetchMock.mockReset().mockResolvedValue(response());
});
afterAll(() => {
  global.fetch = originalFetch;
});
const specimen = {
  scientificName: "Passer domesticus",
  imageUrls: ["https://example.com/bird.jpg"],
  _collections: [],
};
const routes: Array<
  [
    string,
    "get" | "post" | "put" | "patch" | "delete",
    string,
    () => Promise<unknown>
  ]
> = [
  [
    "specimen add",
    "post",
    "/core/specimen/add",
    () => coreApi.addSpecimen(specimen),
  ],
  [
    "specimen list",
    "post",
    "/core/specimen/fetchAll",
    () =>
      coreApi.fetchAllSpecimens(
        { birdType: ["Passerine"] },
        { pageNo: 0, pageSize: 20 }
      ),
  ],
  [
    "specimen details",
    "get",
    "/core/specimen/getDetails/id",
    () => coreApi.getSpecimenDetails("id"),
  ],
  [
    "specimen update",
    "patch",
    "/core/specimen/update/id",
    () =>
      coreApi.updateSpecimen("id", {
        "scientificClassification.family": "Passeridae",
      }),
  ],
  [
    "specimen delete",
    "delete",
    "/core/specimen/delete/id",
    () => coreApi.deleteSpecimen("id"),
  ],
  [
    "collection add",
    "post",
    "/core/collections/add",
    () =>
      coreApi.addCollection({
        name: "Birds",
        description: "Garden",
        imageUrl: "https://example.com/a.jpg",
      }),
  ],
  [
    "collection list",
    "get",
    "/core/collections/fetchAll",
    () => coreApi.fetchAllCollections({ pageNo: 0, search: "Garden" }),
  ],
  [
    "collection details",
    "get",
    "/core/collections/getDetails/id",
    () => coreApi.getCollectionDetails("id"),
  ],
  [
    "collection update",
    "patch",
    "/core/collections/update/id",
    () => coreApi.updateCollection("id", { name: "Renamed" }),
  ],
  [
    "collection delete",
    "delete",
    "/core/collections/delete/id",
    () => coreApi.deleteCollection("id"),
  ],
  [
    "collection stats",
    "get",
    "/core/collections/stats",
    () => coreApi.getCollectionStats(),
  ],
  [
    "archetype filters",
    "get",
    "/core/archetypes/filteritems",
    () => coreApi.getArchetypeFilterItems({ birdType: true, habitat: true }),
  ],
  [
    "archetype list",
    "post",
    "/core/archetypes/fetchAll",
    () =>
      coreApi.fetchAllArchetypes(
        { habitat: ["Forest"] },
        { pageNo: 0, search: "sparrow" }
      ),
  ],
  [
    "archetype details",
    "get",
    "/core/archetypes/getDetails/id",
    () => coreApi.getArchetypeDetails("id"),
  ],
  [
    "identified",
    "put",
    "/core/archetypes/identified/add/id",
    () => coreApi.addIdentifiedArchetype("id"),
  ],
  [
    "wishlist add",
    "put",
    "/core/archetypes/wishlist/add/id",
    () => coreApi.addWishlistArchetype("id"),
  ],
  [
    "wishlist remove",
    "delete",
    "/core/archetypes/wishlist/remove/id",
    () => coreApi.removeWishlistArchetype("id"),
  ],
  [
    "archetype stats",
    "get",
    "/core/archetypes/stats",
    () => coreApi.getArchetypeStats(),
  ],
  [
    "step-by-step",
    "post",
    "/core/archetypes/step-by-step",
    () => coreApi.stepByStep({ location: { lat: 12, lng: 77 } }),
  ],
  [
    "audio gallery",
    "get",
    "/core/gallery/audio",
    () => coreApi.getGalleryAudio(),
  ],
];
test.each(routes)(
  "%s uses the documented verb and route",
  async (_label, method, path, call) => {
    await expect(call()).resolves.toEqual(json);
    expect(client[method]).toHaveBeenCalledTimes(1);
    expect(jest.mocked(client[method]).mock.calls[0][0]).toBe(path);
  }
);
test("legacy filter entry uses Bird archetype fields and the working route", async () => {
  await coreApi.getFilterItems({ conservationStatus: true });
  expect(client.get).toHaveBeenCalledWith("/core/archetypes/filteritems", {
    params: { conservationStatus: true },
  });
});
test("step-by-step sends actual answers, strips client region, and starts at page 1", async () => {
  const body = {
    location: { lat: 51.5, lng: -0.1 },
    seenDate: "2026-11-02T00:00:00Z",
    birdSize: ["Large"],
    region: "europe",
  };
  await coreApi.stepByStep(body);
  expect(client.post).toHaveBeenCalledWith(
    "/core/archetypes/step-by-step",
    {
      location: body.location,
      seenDate: body.seenDate,
      birdSize: body.birdSize,
    },
    { params: { pageNo: 1, pageSize: 20 } }
  );
});
test("audio gallery falls back only on a missing route", async () => {
  client.get.mockRejectedValueOnce(new ApiException("Not found", 404));
  await coreApi.getGalleryAudio();
  expect(client.get).toHaveBeenLastCalledWith("/gallery/audio");
  client.get
    .mockClear()
    .mockRejectedValueOnce(new ApiException("Forbidden", 403));
  await expect(coreApi.getGalleryAudio()).rejects.toMatchObject({
    status: 403,
  });
  expect(client.get).toHaveBeenCalledTimes(1);
});
const image = {
  uri: "file:///photo.jpg",
  type: "image/jpeg",
  name: "photo.jpg",
};
test.each([
  [
    "image identification",
    "/core/ai/identify",
    () => coreApi.identify([image]),
  ],
  [
    "sound identification",
    "/core/ai/identify-sound",
    () =>
      coreApi.identifySound({
        uri: "file:///call.wav",
        type: "audio/wav",
        name: "call.wav",
        startTime: 0,
        duration: 5,
      }),
  ],
  ["chat", "/core/chat", () => coreApi.chat("What bird?", [image])],
  [
    "bite assistant",
    "/got-bitten",
    () => coreApi.gotBitten({ message: "What happened?", images: [image] }),
  ],
] as const)(
  "%s uses JWT and platform multipart boundaries",
  async (_label, path, call) => {
    await call();
    expect(fetchMock).toHaveBeenCalledWith(
      `https://birds.example${path}`,
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json", Authorization: "Bearer jwt" },
        body: expect.any(FormData),
      })
    );
  }
);
test("rejects excess images, oversized files, wrong media and empty assistant requests before transport", async () => {
  await expect(coreApi.identify([image, image, image])).rejects.toThrow(
    "Maximum 2"
  );
  await expect(coreApi.chat("", Array(6).fill(image))).rejects.toThrow(
    "Maximum 5"
  );
  await expect(coreApi.gotBitten({})).rejects.toThrow("At least one");
  await expect(
    coreApi.gotBitten({ images: [{ ...image, type: "audio/wav" }] })
  ).rejects.toThrow("Only image");
  await expect(
    coreApi.chat("", [{ ...image, fileSize: 5 * 1024 * 1024 }])
  ).rejects.toThrow("under 5MB");
  expect(fetchMock).not.toHaveBeenCalled();
});
test("multipart refreshes an expired JWT once and never retries quota errors", async () => {
  fetchMock.mockResolvedValueOnce(response(401));
  auth.refreshAuthToken.mockImplementationOnce(async () => {
    auth.token = "fresh-jwt";
    return auth.token;
  });
  await coreApi.chat("Hello");
  expect(auth.refreshAuthToken).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(
    "Bearer fresh-jwt"
  );
  fetchMock
    .mockClear()
    .mockResolvedValueOnce(response(403, { reason: "Daily quota reached" }));
  await expect(coreApi.chat("Hello")).rejects.toMatchObject({
    status: 403,
    message: "Daily quota reached",
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test("does not send unauthenticated uploads", async () => {
  auth.token = "";
  await expect(coreApi.chat("Hello")).rejects.toMatchObject({ status: 401 });
  expect(fetchMock).not.toHaveBeenCalled();
});
test("specimen transport flattens nested PATCH fields and excludes immutable image/identity fields", async () => {
  await coreApi.updateSpecimen("id", {
    scientificClassification: { kingdom: "Animalia" },
    isWishlisted: false,
    imageUrls: ["https://example.com/a.jpg"],
  });
  expect(client.patch).toHaveBeenCalledWith("/core/specimen/update/id", {
    "scientificClassification.kingdom": "Animalia",
    isWishlisted: false,
  });
});
test("unreadable successful multipart responses surface a retriable error", async () => {
  fetchMock.mockResolvedValueOnce({
    ...response(),
    json: async () => {
      throw new Error("bad json");
    },
  });
  await expect(coreApi.chat("Hello")).rejects.toMatchObject({ status: 502 });
});
test("recordings attached during identification remain in specimen updates", async () => {
  await coreApi.updateSpecimen("id", {
    userCapturedSounds: ["https://example.com/recording.mp3"],
  });
  expect(client.patch).toHaveBeenCalledWith("/core/specimen/update/id", {
    userCapturedSounds: ["https://example.com/recording.mp3"],
  });
});
