import {
  notifyFreeScanLimitAfterSuccess,
  requestFreeScanLimitIfBlocked,
  runWithFreeScanAccess,
} from "../../src/services/freeScanLimitFlow";
import {
  dismissFreeScanLimitPrompt,
  getFreeScanLimitPrompt,
  subscribeFreeScanLimitPrompt,
} from "../../src/services/freeScanLimitPrompt";
let mockPremium = false;
let mockUsed = 0;
jest.mock("../../src/features/subscription/subscription.store", () => ({
  selectIsPremium: () => mockPremium,
  useSubscriptionStore: { getState: () => ({}) },
}));
jest.mock("../../src/services/session/usageLimit.service", () => ({
  canIdentify: async () => mockPremium || mockUsed < 30,
  canIdentifyToday: async () => mockPremium || mockUsed < 30,
  getFreeIdentificationRemaining: async () => Math.max(0, 30 - mockUsed),
  getIdentificationLimitDisplay: async () => ({
    remaining: Math.max(0, 30 - mockUsed),
  }),
}));
describe("30 free scan limit flow", () => {
  beforeEach(() => {
    mockPremium = false;
    mockUsed = 0;
    dismissFreeScanLimitPrompt();
  });
  it("does not show an introduction before the allowance is exhausted", async () => {
    for (const count of [0, 1, 28, 29]) {
      mockUsed = count;
      await notifyFreeScanLimitAfterSuccess();
      expect(await requestFreeScanLimitIfBlocked()).toBe(false);
      expect(getFreeScanLimitPrompt()).toBe(false);
    }
  });
  it("shows the popup immediately after the 30th completed scan", async () => {
    mockUsed = 30;
    await notifyFreeScanLimitAfterSuccess();
    expect(getFreeScanLimitPrompt()).toBe(true);
  });
  it("blocks later camera entries and reopens the popup after Not Now", async () => {
    const enterCamera = jest.fn();
    mockUsed = 30;
    await notifyFreeScanLimitAfterSuccess();
    dismissFreeScanLimitPrompt();
    expect(await runWithFreeScanAccess(enterCamera)).toBe(false);
    expect(enterCamera).not.toHaveBeenCalled();
    expect(getFreeScanLimitPrompt()).toBe(true);
    dismissFreeScanLimitPrompt();
    mockUsed = 31;
    expect(await runWithFreeScanAccess(enterCamera)).toBe(false);
    expect(getFreeScanLimitPrompt()).toBe(true);
  });
  it("allows the 30th scan to start when 29 have already been used", async () => {
    mockUsed = 29;
    const enterCamera = jest.fn();
    expect(await runWithFreeScanAccess(enterCamera)).toBe(true);
    expect(enterCamera).toHaveBeenCalledTimes(1);
  });
  it("never gates premium users even when their old free allowance is exhausted", async () => {
    mockPremium = true;
    mockUsed = 30;
    await notifyFreeScanLimitAfterSuccess();
    expect(await requestFreeScanLimitIfBlocked()).toBe(false);
    expect(getFreeScanLimitPrompt()).toBe(false);
  });
  it("coalesces completion and camera requests while the popup is already open", async () => {
    mockUsed = 30;
    const listener = jest.fn();
    const unsubscribe = subscribeFreeScanLimitPrompt(listener);
    await notifyFreeScanLimitAfterSuccess();
    await requestFreeScanLimitIfBlocked();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
