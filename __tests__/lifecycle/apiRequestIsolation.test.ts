const mockGet = jest.fn();
const mockPost = jest.fn();
let mockToken = "A";
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  }),
}));
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: { getState: () => ({ token: mockToken }) },
}));
jest.mock("../../src/constants/env", () => ({
  API_BASE_URL: "https://api.invalid",
  API_TIMEOUT: 1000,
}));
jest.mock("../../src/services/remoteConfig", () => ({
  getRemoteConfigValue: () => undefined,
}));
jest.mock("../../src/services/api/logger", () => ({
  logRequest: jest.fn(),
  logResponse: jest.fn(),
  logError: jest.fn(),
}));
import { api } from "../../src/services/api/axios";
beforeEach(() => {
  jest.clearAllMocks();
  mockToken = "A";
});
it("shares a read within a session while keeping another account independent", async () => {
  let finish!: (response: unknown) => void;
  mockGet
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    )
    .mockResolvedValue({ data: "B" });
  const first = api.get("/isolation");
  const second = api.get("/isolation");
  expect(mockGet).toHaveBeenCalledTimes(1);
  mockToken = "B";
  await expect(api.get("/isolation")).resolves.toBe("B");
  expect(mockGet).toHaveBeenCalledTimes(2);
  finish({ data: "A" });
  await expect(Promise.all([first, second])).resolves.toEqual(["A", "A"]);
});
it("keeps cancellable requests independent", async () => {
  mockGet.mockResolvedValue({ data: true });
  const first = api.get("/cancel", {
    signal: new AbortController().signal,
  } as any);
  const second = api.get("/cancel", {
    signal: new AbortController().signal,
  } as any);
  await Promise.all([first, second]);
  expect(mockGet).toHaveBeenCalledTimes(2);
});
it("does not merge distinct multipart uploads with the same endpoint", async () => {
  mockPost.mockResolvedValue({ data: true });
  const first = new FormData();
  first.append("image", "photo-a");
  const second = new FormData();
  second.append("image", "photo-b");
  await Promise.all([api.post("/upload", first), api.post("/upload", second)]);
  expect(mockPost).toHaveBeenCalledTimes(2);
});
