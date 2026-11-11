const mockHandlers = new Set<(message: unknown) => Promise<void>>();
const mockDisplay = jest.fn(async (_notification: unknown) => undefined);
const mockInitial = jest.fn(async () => ({
  messageId: "initial-1",
  data: { type: "post_liked", postId: "post-1" },
}));
const mockOnMessage = jest.fn((callback) => {
  mockHandlers.add(callback);
  return () => {
    mockHandlers.delete(callback);
  };
});
jest.mock("@react-native-firebase/messaging", () => ({
  __esModule: true,
  default: () => ({
    onMessage: mockOnMessage,
    onNotificationOpenedApp: jest.fn(() => () => {}),
    getInitialNotification: mockInitial,
  }),
}));
jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    displayNotification: (notification: unknown) => mockDisplay(notification),
  },
  AndroidImportance: { HIGH: 4 },
  EventType: { PRESS: 1 },
}));
jest.mock("../../src/services/analytics/analytics.service", () => ({
  analyticsService: { logEvent: jest.fn() },
  EVENTS: {},
}));
jest.mock("../../src/features/notifications/notifications.store", () => ({
  useNotificationsStore: { getState: () => ({ addNotification: jest.fn() }) },
}));
import {
  setupForegroundNotificationListener,
  setupInitialNotificationHandler,
  setNotificationPressHandler,
} from "../../src/services/notifications/pushNotification.service";
let releases: Array<() => void> = [];
beforeEach(() => {
  jest.clearAllMocks();
});
afterEach(() => {
  releases.forEach((stop) => stop());
  releases = [];
  setNotificationPressHandler(null);
});
it("registers one FCM listener and displays one banner across repeated bootstrap calls", async () => {
  releases.push(
    setupForegroundNotificationListener(),
    setupForegroundNotificationListener()
  );
  await Promise.resolve();
  expect(mockOnMessage).toHaveBeenCalledTimes(1);
  await Promise.all(
    Array.from(mockHandlers, (handler) =>
      handler({
        messageId: "m",
        notification: { title: "Hello", body: "One banner" },
        data: {},
      })
    )
  );
  expect(mockDisplay).toHaveBeenCalledTimes(1);
});
it("does not attach a native listener after its owner has cleaned up", async () => {
  setupForegroundNotificationListener()();
  await Promise.resolve();
  expect(mockOnMessage).not.toHaveBeenCalled();
  expect(mockHandlers.size).toBe(0);
  releases.push(setupForegroundNotificationListener());
  await Promise.resolve();
  expect(mockOnMessage).toHaveBeenCalledTimes(1);
});
it("delivers the cold-start notification once when App and navigator both request it", async () => {
  const press = jest.fn();
  setNotificationPressHandler(press);
  await Promise.all([
    setupInitialNotificationHandler(),
    setupInitialNotificationHandler(),
  ]);
  expect(press).toHaveBeenCalledTimes(1);
});

it("retains the foreground listener until the final owner cleans up", async () => {
  const first = setupForegroundNotificationListener();
  const second = setupForegroundNotificationListener();
  await Promise.resolve();
  first();
  first();
  expect(mockHandlers.size).toBe(1);
  second();
  expect(mockHandlers.size).toBe(0);
});
