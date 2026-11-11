let mockSession = { user: { id: "account-A" }, token: "token-A" };
jest.unmock("../../src/features/auth/services/auth.service");
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: { getState: () => mockSession },
}));
jest.mock("../../src/services/api/features/auth.api", () => ({
  authApi: { getProfile: jest.fn() },
}));
import { authService } from "../../src/features/auth/services/auth.service";
import { authApi } from "../../src/services/api/features/auth.api";

const response = {
  error: false,
  user: { id: "account-A", _id: "account-A", name: { full: "A" } },
};
beforeEach(() => {
  jest.clearAllMocks();
  mockSession = { user: { id: "account-A" }, token: "token-A" };
});
it("shares the complete profile result across startup, focus and purchase callers", async () => {
  let finish!: (value: typeof response) => void;
  (authApi.getProfile as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const first = authService.getProfile();
  const second = authService.getProfile();
  expect(authApi.getProfile).toHaveBeenCalledTimes(1);
  finish(response);
  const [a, b] = await Promise.all([first, second]);
  expect(a).toBe(b);
  (authApi.getProfile as jest.Mock).mockResolvedValueOnce(response);
  await authService.getProfile();
  expect(authApi.getProfile).toHaveBeenCalledTimes(2);
});
it("does not share a profile with a new account or token", async () => {
  let finish!: (value: typeof response) => void;
  (authApi.getProfile as jest.Mock)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    )
    .mockResolvedValueOnce(response);
  const old = authService.getProfile();
  mockSession = { user: { id: "account-B" }, token: "token-B" };
  await authService.getProfile();
  expect(authApi.getProfile).toHaveBeenCalledTimes(2);
  finish(response);
  await old;
});
it("releases failed requests so a user can retry", async () => {
  (authApi.getProfile as jest.Mock)
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(response);
  await expect(authService.getProfile()).rejects.toThrow();
  await expect(authService.getProfile()).resolves.toHaveProperty("user");
  expect(authApi.getProfile).toHaveBeenCalledTimes(2);
});
