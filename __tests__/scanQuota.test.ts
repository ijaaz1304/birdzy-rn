let mockSessionChange: (state: any, previous: any) => void = () => {};
let mockPremium = false;
let mockState: any;
jest.mock("../src/features/auth/auth.store", () => ({
  useAuthStore: {
    getState: () => mockState,
    subscribe: jest.fn((listener) => {
      mockSessionChange = listener;
      return () => {};
    }),
  },
}));
jest.mock("../src/features/subscription/subscription.store", () => ({
  selectIsPremium: () => mockPremium,
  useSubscriptionStore: {
    getState: () => ({}),
    subscribe: jest.fn(() => () => {}),
  },
}));
import {
  scanQuota,
  beginFreeScanAttempt,
  completeFreeScanAttempt,
  cancelFreeScanAttempt,
  recordUnsuccessfulScan,
} from "../src/services/session/scanQuota";
import {
  clearBackendAiUsage,
  updateBackendAiUsage,
  nextAiUsageRequest,
} from "../src/services/session/backendAiUsage";
import { withBackendScanUsage } from "../src/services/session/backendScanRequest";
const usage = (count = 7, threshold = 30) => ({
  successCount: count,
  errorCount: 2,
  successThreshold: threshold,
  errorThreshold: 5,
});
const receive = (value: unknown) =>
  updateBackendAiUsage(mockState.user.id, value, nextAiUsageRequest());
beforeEach(() => {
  mockPremium = false;
  mockState = {
    user: { id: "account-a" },
    token: "token-a",
    refreshProfileSilent: jest.fn(async () => {}),
  };
  clearBackendAiUsage();
});
it("allows unknown usage through to the backend and coalesces duplicate submissions", async () => {
  expect((await scanQuota.get()).known).toBe(false);
  const start = await beginFreeScanAttempt("one");
  expect(start.status).toBe("ready");
  expect((await beginFreeScanAttempt("two")).status).toBe("busy");
  if (start.status === "ready") cancelFreeScanAttempt(start.attempt);
});
it("uses returned thresholds, never charges successes, failures or popups locally", async () => {
  receive(usage(4, 12));
  const start = await beginFreeScanAttempt();
  if (start.status !== "ready") throw Error(start.status);
  expect(
    (await completeFreeScanAttempt(start.attempt, "success")).remaining
  ).toBe(8);
  const failed = await beginFreeScanAttempt();
  if (failed.status !== "ready") throw Error(failed.status);
  await completeFreeScanAttempt(failed.attempt, "failure");
  for (let index = 0; index < 10; index++)
    await recordUnsuccessfulScan(String(index));
  expect(await scanQuota.get()).toMatchObject({
    used: 4,
    failures: 2,
    limit: 12,
    remaining: 8,
    known: true,
  });
});
it("blocks known exhaustion including zero thresholds, exempts subscribed and rewarded accounts", async () => {
  receive(usage(0, 0));
  expect((await beginFreeScanAttempt()).status).toBe("blocked");
  for (const flag of ["isSubscribed", "isRewarded"]) {
    mockState.user[flag] = true;
    const start = await beginFreeScanAttempt();
    expect(start.status).toBe("ready");
    if (start.status === "ready") cancelFreeScanAttempt(start.attempt);
    mockState.user[flag] = false;
  }
  mockPremium = true;
  const start = await beginFreeScanAttempt();
  expect(start.status).toBe("ready");
  if (start.status === "ready") cancelFreeScanAttempt(start.attempt);
});
it("isolates accounts and does not migrate a guest or device allowance", async () => {
  receive(usage(30));
  mockState = {
    ...mockState,
    user: { id: "guest-b", isGuest: true },
    token: "guest-token",
  };
  expect((await scanQuota.get()).known).toBe(false);
  const start = await beginFreeScanAttempt();
  expect(start.status).toBe("ready");
  if (start.status === "ready") cancelFreeScanAttempt(start.attempt);
});
it("updates successful and rejected operations using backend payloads; E004 stays a business error", async () => {
  await withBackendScanUsage(async () => usage(9));
  expect((await scanQuota.get()).remaining).toBe(21);
  const error = { data: { ...usage(30), aiErrorCode: "E004" } };
  await expect(
    withBackendScanUsage(async () => {
      throw error;
    })
  ).rejects.toBe(error);
  expect((await scanQuota.get()).remaining).toBe(0);
  await expect(
    withBackendScanUsage(async () => ({ ...usage(30), aiErrorCode: "E004" }))
  ).rejects.toMatchObject({ aiErrorCode: "E004" });
});
it("ignores a late response after an account or token change", async () => {
  let resolve!: (value: ReturnType<typeof usage>) => void;
  const request = withBackendScanUsage(
    () =>
      new Promise<ReturnType<typeof usage>>((done) => {
        resolve = done;
      })
  );
  mockState = { ...mockState, user: { id: "account-b" }, token: "token-b" };
  resolve(usage(30));
  await request;
  expect((await scanQuota.get()).known).toBe(false);
});

it("accepts usage after automatic JWT refresh within the same account session", async () => {
  await withBackendScanUsage(async () => {
    mockState = { ...mockState, token: "refreshed-token" };
    return usage(8);
  });
  expect((await scanQuota.get()).remaining).toBe(22);
});

it("clears usage on logout and ignores a late result after signing back into the same account", async () => {
  receive(usage(30));
  let resolve!: (value: ReturnType<typeof usage>) => void;
  const pending = withBackendScanUsage(
    () =>
      new Promise<ReturnType<typeof usage>>((done) => {
        resolve = done;
      })
  );
  const previous = mockState;
  mockState = { ...mockState, user: null, token: null };
  mockSessionChange(mockState, previous);
  const loggedOut = mockState;
  mockState = { ...previous, token: "new-login-token" };
  mockSessionChange(mockState, loggedOut);
  resolve(usage(30));
  await pending;
  expect((await scanQuota.get()).known).toBe(false);
});
