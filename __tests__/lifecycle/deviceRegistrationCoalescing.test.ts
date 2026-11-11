const mockPost = jest.fn();
let mockToken = "session-A";
jest.mock("axios", () => ({
  create: () => ({
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    post: mockPost,
  }),
}));
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: { getState: () => ({ token: mockToken }) },
}));
import { notificationApi } from "../../src/services/api/features/notification.api";
const payload = {
  userId: "A",
  platform: "android" as const,
  deviceId: "device",
  deviceToken: "push-token",
};
beforeEach(() => {
  jest.clearAllMocks();
  mockToken = "session-A";
});
it("shares an identical device registration then allows a later retry", async () => {
  let finish!: (response: { data: { success: boolean } }) => void;
  mockPost.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const first = notificationApi.registerDevice(payload);
  const second = notificationApi.registerDevice(payload);
  expect(mockPost).toHaveBeenCalledTimes(1);
  finish({ data: { success: true } });
  await Promise.all([first, second]);
  mockPost.mockResolvedValueOnce({ data: { success: true } });
  await notificationApi.registerDevice(payload);
  expect(mockPost).toHaveBeenCalledTimes(2);
});
it("keeps different auth sessions independent", async () => {
  let finish!: (response: { data: { success: boolean } }) => void;
  mockPost
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    )
    .mockResolvedValueOnce({ data: { success: true } });
  const first = notificationApi.registerDevice(payload);
  mockToken = "session-B";
  await notificationApi.registerDevice({ ...payload, userId: "B" });
  expect(mockPost).toHaveBeenCalledTimes(2);
  finish({ data: { success: true } });
  await first;
});
