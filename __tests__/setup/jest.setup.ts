/**
 * Shared Jest setup — navigation, AsyncStorage, and common native mocks.
 */

jest.mock("@react-navigation/native", () => ({
  CommonActions: {
    navigate: jest.fn((payload: unknown) => ({ type: "NAVIGATE", payload })),
    reset: jest.fn((payload: unknown) => ({ type: "RESET", payload })),
    goBack: jest.fn(() => ({ type: "GO_BACK" })),
  },
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    getParent: jest.fn(),
  })),
  useRoute: jest.fn(() => ({ params: {} })),
  useFocusEffect: jest.fn(),
  createNavigationContainerRef: jest.fn(() => ({
    isReady: jest.fn(() => false),
    dispatch: jest.fn(),
    canGoBack: jest.fn(() => false),
  })),
}));

jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

jest.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: () => null,
  }),
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    onForegroundEvent: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(async () => null),
  },
  EventType: { PRESS: 1 },
  AndroidImportance: { HIGH: 4 },
  TriggerType: { TIMESTAMP: 0 },
}));

jest.mock("react-native-vision-camera", () => ({
  Camera: {
    getCameraPermissionStatus: jest.fn(async () => "granted"),
    requestCameraPermission: jest.fn(async () => "granted"),
  },
  useCameraDevice: jest.fn(() => null),
}));

jest.mock("@react-native-firebase/app", () => ({
  getApps: jest.fn(() => [{ options: { projectId: "birdzy-app-dev" } }]),
  getApp: jest.fn(() => ({ options: { projectId: "birdzy-app-dev" } })),
  firebase: {
    app: jest.fn(() => ({ options: { projectId: "birdzy-app-dev" } })),
  },
}));

jest.mock("@react-native-firebase/analytics", () => () => ({
  logEvent: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
}));

jest.mock("@react-native-firebase/messaging", () => () => ({
  hasPermission: jest.fn(async () => 1),
  getToken: jest.fn(async () => "mock-fcm-token"),
  getAPNSToken: jest.fn(async () => "mock-apns-token"),
  registerDeviceForRemoteMessages: jest.fn(async () => undefined),
  onTokenRefresh: jest.fn(() => jest.fn()),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
}));

jest.mock("react-native-device-info", () => ({
  getUniqueId: jest.fn(async () => "test-device-id"),
  getVersion: jest.fn(() => "1.0.0"),
  getBuildNumber: jest.fn(() => "1"),
}));

jest.mock("react-native-fbsdk-next", () => ({
  Settings: { initializeSDK: jest.fn() },
  AppEventsLogger: { logEvent: jest.fn() },
}));

jest.mock("react-native-iap", () => ({
  fetchProducts: jest.fn(async () => []),
  initConnection: jest.fn(async () => true),
  endConnection: jest.fn(async () => undefined),
  getAvailablePurchases: jest.fn(async () => []),
  requestPurchase: jest.fn(),
  finishTransaction: jest.fn(),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});
