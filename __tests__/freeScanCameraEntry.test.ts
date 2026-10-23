import { activateFreeScanPromptSurface } from "../src/services/freeScanLimitPrompt";
let releasePromptSurface: () => void;
afterEach(() => releasePromptSurface?.());
import AsyncStorage from "@react-native-async-storage/async-storage";
import { requestFreeScanCameraEntry } from "../src/services/freeScanCameraEntry";
import {
  dismissFreeScanLimitPrompt,
  getFreeScanLimitPrompt,
  getFreeScanLimitIntroduction,
} from "../src/services/freeScanLimitPrompt";
let mockPremium = false;
let mockUsed = 0;
let mockScope = "account:one";
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));
jest.mock("../src/services/session/scanQuota", () => ({
  scanQuota: { currentScope: () => mockScope },
}));
jest.mock("../src/services/session/usageLimit.service", () => ({
  canIdentify: async () => mockPremium || mockUsed < 30,
}));
jest.mock("../src/features/subscription/subscription.store", () => ({
  selectIsPremium: () => mockPremium,
  useSubscriptionStore: { getState: () => ({}) },
}));
beforeEach(() => {
  releasePromptSurface = activateFreeScanPromptSurface();
  jest.clearAllMocks();
  mockPremium = false;
  mockUsed = 0;
  mockScope = "account:one";
  const data = new Map<string, string>();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async (key) => data.get(key) ?? null
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    data.set(key, value);
  });
  dismissFreeScanLimitPrompt();
});
it("introduces the free allowance once per account on camera entry", async () => {
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(true);
  expect(getFreeScanLimitIntroduction()).toBe(true);
  dismissFreeScanLimitPrompt();
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(false);
  mockScope = "account:two";
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(true);
});
it("does not show for premium or inactive camera entries", async () => {
  mockPremium = true;
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(false);
  mockPremium = false;
  await requestFreeScanCameraEntry(() => false);
  expect(getFreeScanLimitPrompt()).toBe(false);
});
it("does not show the limit popup on camera entry after 30 scans", async () => {
  mockUsed = 30;
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(false);
});
it("coalesces simultaneous entry checks", async () => {
  await Promise.all([
    requestFreeScanCameraEntry(),
    requestFreeScanCameraEntry(),
  ]);
  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
});

it("leaves the introduction pending if the camera becomes inactive during storage access", async () => {
  let active = true;
  (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(async () => {
    active = false;
    return null;
  });
  await requestFreeScanCameraEntry(() => active);
  expect(getFreeScanLimitPrompt()).toBe(false);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitIntroduction()).toBe(true);
  expect(getFreeScanLimitPrompt()).toBe(true);
});
it("does not show a stale introduction after an account switch", async () => {
  (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(async () => {
    mockScope = "account:two";
    return null;
  });
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(false);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(true);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    "freeScanIntroduction_v1:account:two",
    "true"
  );
});
it("suppresses the introduction if the user upgrades while storage is loading", async () => {
  (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(async () => {
    mockPremium = true;
    return null;
  });
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(false);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
it("retries the introduction on the next visit after a storage read fails", async () => {
  (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
    new Error("Storage unavailable")
  );
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(false);
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(true);
});
