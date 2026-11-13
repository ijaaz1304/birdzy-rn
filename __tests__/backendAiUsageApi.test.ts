const mockAuth = {
  user: { id: "account-api" },
  token: "test-token",
  refreshAuthToken: jest.fn(),
  logout: jest.fn(),
};
jest.mock("../src/features/auth/auth.store", () => ({
  useAuthStore: { getState: () => mockAuth, subscribe: () => () => {} },
}));
jest.mock("../src/services/api/axios", () => ({
  apiClient: { get: jest.fn() },
}));
jest.mock("../src/constants/env", () => ({
  API_BASE_URL: "https://example.test",
  API_TIMEOUT: 30000,
}));
import { apiClient } from "../src/services/api/axios";
import { authApi } from "../src/services/api/features/auth.api";
import {
  getBackendAiUsage,
  clearBackendAiUsage,
  isAiLifetimeLimitError,
} from "../src/services/session/backendAiUsage";
import { coreApi } from "../src/services/api/features/core.api";
const identifyPhoto = () =>
  coreApi.identify([
    { uri: "file:///test.jpg", type: "image/jpeg", name: "test.jpg" },
  ]);
const usage = {
  successCount: 7,
  errorCount: 2,
  successThreshold: 30,
  errorThreshold: 5,
};
const originalFetch = globalThis.fetch;
const respond = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: "Failure",
  json: async () => body,
  text: async () => JSON.stringify(body),
});
beforeEach(() => {
  clearBackendAiUsage();
  jest.clearAllMocks();
  globalThis.fetch = jest.fn() as typeof fetch;
});
afterAll(() => {
  globalThis.fetch = originalFetch;
});
it("loads backend usage from the real profile API wrapper", async () => {
  jest.mocked(apiClient.get).mockResolvedValue({
    data: { ...usage, error: false, user: { id: "account-api" } },
  });
  await authApi.getProfile();
  expect(getBackendAiUsage("account-api")?.usage.successCount).toBe(7);
});
it("reads returned usage from identification and does not invent a local increment", async () => {
  jest.mocked(globalThis.fetch).mockResolvedValue(
    respond({
      ...usage,
      error: false,
      data: { matches: [], matchesFoundCount: 0, imageUrls: [] },
    }) as Response
  );
  await identifyPhoto();
  expect(getBackendAiUsage("account-api")?.usage.successCount).toBe(7);
});
it("preserves E004 and counts without refreshing or retrying HTTP 403", async () => {
  jest.mocked(globalThis.fetch).mockResolvedValue(
    respond(
      {
        ...usage,
        successCount: 30,
        error: true,
        aiErrorCode: "E004",
        reason: "Allowance reached",
      },
      403
    ) as Response
  );
  let caught: unknown;
  try {
    await identifyPhoto();
  } catch (error) {
    caught = error;
  }
  expect(isAiLifetimeLimitError(caught)).toBe(true);
  expect(getBackendAiUsage("account-api")?.usage.successCount).toBe(30);
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(mockAuth.refreshAuthToken).not.toHaveBeenCalled();
  expect(mockAuth.logout).not.toHaveBeenCalled();
});
it("shares the backend snapshot with sound identification", async () => {
  jest.mocked(globalThis.fetch).mockResolvedValue(
    respond({
      ...usage,
      successCount: 11,
      error: false,
      data: { matches: [] },
    }) as Response
  );
  await coreApi.identifySound({
    uri: "file:///bird.wav",
    type: "audio/wav",
    name: "bird.wav",
    startTime: 0,
    duration: 5,
    userLocation: [1, 2],
  });
  expect(getBackendAiUsage("account-api")?.usage.successCount).toBe(11);
});
