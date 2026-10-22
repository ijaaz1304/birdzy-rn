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
jest.mock("../src/services/freeScanLimitFlow", () => ({
  requestFreeScanLimitIfBlocked: async () => {
    if (mockUsed < 30 || mockPremium) return false;
    require("../src/services/freeScanLimitPrompt").requestFreeScanLimitPrompt();
    return true;
  },
}));
jest.mock("../src/features/subscription/subscription.store", () => ({
  selectIsPremium: () => mockPremium,
  useSubscriptionStore: { getState: () => ({}) },
}));
beforeEach(() => {
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
it("shows exhaustion instead of introduction at zero", async () => {
  mockUsed = 30;
  await requestFreeScanCameraEntry();
  expect(getFreeScanLimitPrompt()).toBe(true);
  expect(getFreeScanLimitIntroduction()).toBe(false);
});
it("coalesces simultaneous entry checks", async () => {
  await Promise.all([
    requestFreeScanCameraEntry(),
    requestFreeScanCameraEntry(),
  ]);
  expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
});
