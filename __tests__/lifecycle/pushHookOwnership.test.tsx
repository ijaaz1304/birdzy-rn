import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
const mockHandlers = new Set<() => void>();
let mockSession = { token: "token-a", user: { id: "user-a" } };
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: Object.assign(() => mockSession, {
    getState: () => mockSession,
  }),
}));
jest.mock("../../src/features/notifications/device.store", () => ({
  useDeviceManage: () => ({ manageDeviceData: jest.fn() }),
}));
jest.mock("../../src/utils/deviceUtil", () => ({
  getFirebaseId: async () => "device",
  getDeviceId: async () => "device",
}));
jest.mock("@react-native-firebase/messaging", () => ({
  __esModule: true,
  default: Object.assign(
    () => ({
      hasPermission: async () => 0,
      onTokenRefresh: (handler: () => void) => {
        mockHandlers.add(handler);
        return () => mockHandlers.delete(handler);
      },
    }),
    { AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 } }
  ),
}));
jest.mock("../../src/services/permissions", () => ({
  checkNotificationPermission: async () => ({ granted: false }),
}));
import { usePushNotifications } from "../../src/hooks/usePushNotifications";
function Owner() {
  usePushNotifications();
  return null;
}
it("keeps one token listener through overlapping screens and JWT rotation, then releases it", async () => {
  let first!: ReactTestRenderer, second!: ReactTestRenderer;
  try {
    await act(async () => {
      first = create(<Owner />);
      second = create(<Owner />);
    });
    expect(mockHandlers.size).toBe(1);
    await act(async () => {
      second.unmount();
    });
    expect(mockHandlers.size).toBe(1);
    mockSession = { ...mockSession, token: "token-b" };
    await act(async () => {
      first.update(<Owner />);
    });
    expect(mockHandlers.size).toBe(1);
    await act(async () => {
      first.unmount();
    });
    expect(mockHandlers.size).toBe(0);
  } finally {
    await act(async () => {
      first?.unmount();
      second?.unmount();
    });
  }
});
