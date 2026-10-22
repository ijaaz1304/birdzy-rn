import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createScanAllowance,
  FREE_SCAN_LIMIT,
} from "../src/services/session/scanAllowance";
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));
const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;
let storage: Map<string, string>;
let identity: { accountId?: string; guestId?: string; isGuest: boolean };
let legacy: number;
const build = () =>
  createScanAllowance({
    getIdentity: () => identity,
    readLegacyUsage: async () => legacy,
    chargeSuccessfulScans: true,
  });
let quota: ReturnType<typeof build>;
let id = 0;
async function complete(outcome: "success" | "failure", premium = false) {
  const start = await quota.begin(`attempt-${++id}`, premium);
  if (start.status !== "ready") throw new Error(start.status);
  return quota.complete(start.attempt, outcome, premium);
}
beforeEach(() => {
  storage = new Map();
  identity = { accountId: "A", isGuest: false };
  legacy = 0;
  id = 0;
  getItem.mockImplementation(async (key: string) => storage.get(key) ?? null);
  setItem.mockImplementation(async (key: string, value: string) => {
    storage.set(key, value);
  });
  quota = build();
});
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});
it("gives a fresh account 30 scans", async () => {
  expect((await quota.get()).remaining).toBe(30);
});
it("keeps failures 1–5 free, then deducts from failures 6 and 7", async () => {
  for (let i = 0; i < 5; i++)
    expect((await complete("failure")).remaining).toBe(30);
  expect((await complete("failure")).remaining).toBe(29);
  expect((await complete("failure")).remaining).toBe(28);
});
it("charges every success without consuming the five-failure grace", async () => {
  expect((await complete("success")).remaining).toBe(29);
  for (let i = 0; i < 5; i++)
    expect((await complete("failure")).remaining).toBe(29);
  expect((await complete("failure")).remaining).toBe(28);
});
it("exhausts the allowance after 35 confirmed failures and blocks further attempts", async () => {
  for (let i = 0; i < 35; i++) await complete("failure");
  expect((await quota.get()).remaining).toBe(0);
  expect((await quota.begin("extra", false)).status).toBe("blocked");
});
it("blocks scan 31 after 30 successes and never returns a negative count", async () => {
  for (let i = 0; i < FREE_SCAN_LIMIT; i++) await complete("success");
  expect((await quota.get()).remaining).toBe(0);
  expect((await quota.begin("31", false)).status).toBe("blocked");
});
it("does not charge a cancelled, interrupted or transport-failed request", async () => {
  const start = await quota.begin("network-failure", false);
  if (start.status !== "ready") throw Error();
  quota.cancel(start.attempt);
  await quota.complete(start.attempt, "failure");
  expect(await quota.get()).toEqual(
    expect.objectContaining({ used: 0, failures: 0, remaining: 30 })
  );
});
it("serializes duplicate completions and persists their idempotency key", async () => {
  const start = await quota.begin("same", false);
  if (start.status !== "ready") throw Error();
  await Promise.all([
    quota.complete(start.attempt, "success"),
    quota.complete(start.attempt, "success"),
  ]);
  expect((await quota.get()).remaining).toBe(29);
  quota = build();
  expect((await quota.begin("same", false)).status).toBe("busy");
});
it("allows only one pending request per account", async () => {
  const [a, b] = await Promise.all([
    quota.begin("one", false),
    quota.begin("two", false),
  ]);
  expect(a.status).toBe("ready");
  expect(b.status).toBe("busy");
  if (a.status === "ready") quota.cancel(a.attempt);
  expect((await quota.begin("two", false)).status).toBe("ready");
});
it("serializes the final remaining scan under rapid requests", async () => {
  legacy = 29;
  const [a, b] = await Promise.all([
    quota.begin("last", false),
    quota.begin("overlap", false),
  ]);
  expect(a.status).toBe("ready");
  expect(b.status).toBe("busy");
  if (a.status === "ready") await quota.complete(a.attempt, "success");
  expect((await quota.begin("extra", false)).status).toBe("blocked");
});
it("keeps different accounts independent, including after switching back", async () => {
  await complete("success");
  identity = { accountId: "B", isGuest: false };
  expect((await quota.get()).remaining).toBe(30);
  await complete("success");
  await complete("success");
  identity = { accountId: "A", isGuest: false };
  expect((await quota.get()).remaining).toBe(29);
});
it("does not charge the previous or next account after a mid-request account switch", async () => {
  const start = await quota.begin("old-session", false);
  if (start.status !== "ready") throw Error();
  identity = { accountId: "B", isGuest: false };
  await quota.complete(start.attempt, "success");
  expect((await quota.get()).remaining).toBe(30);
  identity = { accountId: "A", isGuest: false };
  expect((await quota.get()).remaining).toBe(30);
});
it("retains counts and failure grace over restarts and date changes", async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-20T12:00:00Z"));
  for (let i = 0; i < 6; i++) await complete("failure");
  quota = build();
  jest.setSystemTime(new Date("2030-01-01T00:00:00Z"));
  expect((await quota.get()).remaining).toBe(29);
  expect((await complete("failure")).remaining).toBe(28);
});
it("assigns legacy device usage once rather than giving it to every account", async () => {
  legacy = 12;
  expect((await quota.get()).remaining).toBe(18);
  identity = { accountId: "B", isGuest: false };
  expect((await quota.get()).remaining).toBe(30);
  identity = { accountId: "A", isGuest: false };
  expect((await quota.get()).remaining).toBe(18);
});
it("transfers guest usage exactly once and prevents returning to that guest from bypassing the limit", async () => {
  await complete("success");
  identity = { guestId: "G", accountId: "guest-user", isGuest: true };
  await complete("success");
  await complete("success");
  identity = { accountId: "A", isGuest: false };
  expect((await quota.get()).remaining).toBe(27);
  expect((await quota.get()).remaining).toBe(27);
  identity = { guestId: "G", accountId: "guest-user", isGuest: true };
  expect((await quota.get()).remaining).toBe(27);
  await complete("success");
  identity = { accountId: "A", isGuest: false };
  expect((await quota.get()).remaining).toBe(26);
  identity = { accountId: "B", isGuest: false };
  expect((await quota.get()).remaining).toBe(30);
});
it("merges the five-failure grace correctly instead of granting it twice after guest promotion", async () => {
  for (let i = 0; i < 4; i++) await complete("failure");
  identity = { guestId: "G", isGuest: true };
  for (let i = 0; i < 4; i++) await complete("failure");
  identity = { accountId: "A", isGuest: false };
  expect(await quota.get()).toEqual(
    expect.objectContaining({ failures: 8, used: 3, remaining: 27 })
  );
});
it("gives premium users unlimited access without consuming the free allowance", async () => {
  legacy = 30;
  const start = await quota.begin("premium", true);
  expect(start.status).toBe("ready");
  if (start.status === "ready")
    await quota.complete(start.attempt, "failure", true);
  expect(await quota.get()).toEqual(
    expect.objectContaining({ used: 30, failures: 0 })
  );
});
it("retries a failed guest-transfer write without deducting twice", async () => {
  identity = { guestId: "G", isGuest: true };
  await complete("success");
  identity = { accountId: "A", isGuest: false };
  const original = setItem.getMockImplementation()!;
  let failed = false;
  setItem.mockImplementation(async (key: string, value: string) => {
    if (
      !failed &&
      key.includes("guest%3AG") &&
      value.includes("transferredTo")
    ) {
      failed = true;
      throw Error("disk");
    }
    return original(key, value);
  });
  await expect(quota.get()).rejects.toThrow("disk");
  expect((await quota.get()).remaining).toBe(29);
});

it("rechecks identity when it changes while reading storage", async () => {
  let switched = false;
  getItem.mockImplementation(async (key: string) => {
    if (!switched) {
      switched = true;
      identity = { accountId: "B", isGuest: false };
    }
    return storage.get(key) ?? null;
  });
  const start = await quota.begin("switch-during-read", false);
  expect(start.status).toBe("ready");
  if (start.status !== "ready") throw Error();
  expect(start.attempt.identity).toBe("account:B");
  expect(start.attempt.scope).toBe("account:B");
  await quota.complete(start.attempt, "success");
  expect((await quota.get()).remaining).toBe(29);
  identity = { accountId: "A", isGuest: false };
  expect((await quota.get()).remaining).toBe(30);
});

it("ignores an old cancelled lease after the same request ID is restarted", async () => {
  const first = await quota.begin("retry-id", false);
  if (first.status !== "ready") throw Error();
  quota.cancel(first.attempt);
  const second = await quota.begin("retry-id", false);
  if (second.status !== "ready") throw Error();
  await quota.complete(first.attempt, "failure");
  expect((await quota.get()).failures).toBe(0);
  await quota.complete(second.attempt, "success");
  expect((await quota.get()).remaining).toBe(29);
});

it("counts every cannot-identify popup from failure six, including generic API failures", async () => {
  for (let failure = 1; failure <= 10; failure++) {
    const allowance = await quota.recordFailure(`popup-${failure}`, false);
    expect(allowance.failures).toBe(failure);
    expect(allowance.remaining).toBe(30 - Math.max(0, failure - 5));
  }
});
it("does not count the API no-match and its popup twice", async () => {
  const start = await quota.begin("no-match-and-popup", false);
  if (start.status !== "ready") throw new Error(start.status);
  await quota.complete(start.attempt, "failure");
  await quota.recordFailure(start.attempt.id, false);
  expect((await quota.get()).failures).toBe(1);
});
it("records a failed popup after request cleanup and ignores duplicate presentations", async () => {
  const start = await quota.begin("api-error", false);
  if (start.status !== "ready") throw new Error(start.status);
  quota.cancel(start.attempt);
  await Promise.all([
    quota.recordFailure(start.attempt.id, false),
    quota.recordFailure(start.attempt.id, false),
  ]);
  expect((await quota.get()).failures).toBe(1);
});
it("does not charge a popup to premium users or a different account", async () => {
  await quota.recordFailure("premium-error", true);
  await quota.recordFailure("old-account-error", false, "account:previous");
  expect((await quota.get()).failures).toBe(0);
});
