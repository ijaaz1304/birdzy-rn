let mockUserId: string | null = "first";
const mockFetchDocuments = jest.fn();
jest.mock("../../src/features/auth/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ user: mockUserId ? { id: mockUserId } : null }),
  },
}));
jest.mock("../../src/services/firebase/feed.service", () => ({
  feedService: {
    fetchFeedNotificationDocuments: (...args: unknown[]) =>
      mockFetchDocuments(...args),
  },
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  },
}));
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotificationsStore } from "../../src/features/notifications/notifications.store";
beforeEach(() =>
  useNotificationsStore.setState({
    ownerUserId: null,
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  })
);
test("changing accounts clears the previous account's notifications and read state", () => {
  const store = useNotificationsStore.getState();
  store.setOwner("first");
  store.addNotification({
    title: "Private activity",
    body: "Only first",
    type: "info",
  });
  expect(useNotificationsStore.getState().unreadCount).toBe(1);
  store.setOwner("second");
  expect(useNotificationsStore.getState()).toMatchObject({
    ownerUserId: "second",
    notifications: [],
    unreadCount: 0,
  });
});
test("same account keeps existing notifications; sign out clears them", () => {
  const store = useNotificationsStore.getState();
  store.setOwner("first");
  store.addNotification({ title: "Activity", body: "First", type: "info" });
  store.setOwner("first");
  expect(useNotificationsStore.getState().notifications).toHaveLength(1);
  store.setOwner(null);
  expect(useNotificationsStore.getState().notifications).toEqual([]);
});

test("refresh loads real feed documents for the current account", async () => {
  mockUserId = "first";
  mockFetchDocuments.mockResolvedValueOnce([
    {
      id: "n1",
      type: "like",
      actorUserId: "actor",
      actorUserName: "Birder",
      postId: "post",
      createdAt: null,
    },
  ]);
  await useNotificationsStore.getState().fetchNotifications();
  expect(mockFetchDocuments).toHaveBeenCalledWith("first");
  expect(useNotificationsStore.getState().notifications[0].id).toBe("n1");
  expect(useNotificationsStore.getState().isLoading).toBe(false);
});
test("an old account's delayed refresh cannot repopulate notifications after sign out", async () => {
  mockUserId = "first";
  let resolve!: (docs: unknown[]) => void;
  mockFetchDocuments.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  const pending = useNotificationsStore.getState().fetchNotifications();
  expect(resolve).toBeDefined();
  mockUserId = null;
  useNotificationsStore.getState().setOwner(null);
  resolve([
    {
      id: "private",
      type: "like",
      actorUserId: "actor",
      actorUserName: "Private",
      createdAt: null,
    },
  ]);
  await pending;
  expect(useNotificationsStore.getState().notifications).toEqual([]);
  expect(useNotificationsStore.getState().isLoading).toBe(false);
});

test("late hydration cannot restore another account or a persisted loading flag", async () => {
  useNotificationsStore.getState().setOwner("second");
  (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
    JSON.stringify({
      state: {
        ownerUserId: "first",
        notifications: [{ id: "private" }],
        unreadCount: 1,
        isLoading: true,
      },
      version: 0,
    })
  );
  await useNotificationsStore.persist.rehydrate();
  expect(useNotificationsStore.getState()).toMatchObject({
    ownerUserId: "second",
    notifications: [],
    isLoading: false,
  });
});
