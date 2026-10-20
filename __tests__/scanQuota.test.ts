import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  scanQuota,
  beginFreeScanAttempt,
  completeFreeScanAttempt,
} from "../src/services/session/scanQuota";
let mockPremium = false;
let mockAuth: {
  user: { id: string; isGuest?: boolean } | null;
  guestId: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
};
jest.mock("../src/features/auth/auth.store", () => ({
  useAuthStore: {
    getState: () => mockAuth,
    subscribe: jest.fn(() => () => {}),
  },
}));
jest.mock("../src/features/subscription/subscription.store", () => ({
  useSubscriptionStore: { getState: () => ({}) },
  selectIsPremium: () => mockPremium,
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));
beforeEach(() => {
  const storage = new Map<string, string>();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async (key) => storage.get(key) ?? null
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    storage.set(key, value);
  });
  mockPremium = false;
  mockAuth = {
    user: { id: "A" },
    guestId: null,
    isAuthenticated: true,
    isGuest: false,
  };
});
async function success(id: string) {
  const start = await beginFreeScanAttempt(id);
  if (start.status !== "ready") throw Error(start.status);
  return completeFreeScanAttempt(start.attempt, "success");
}
it("uses independent backend account IDs and retains usage on switching back", async () => {
  expect((await success("A1")).remaining).toBe(29);
  mockAuth.user = { id: "B" };
  expect((await scanQuota.get()).remaining).toBe(30);
  mockAuth.user = { id: "A" };
  expect((await scanQuota.get()).remaining).toBe(29);
});
it("keeps one guest allowance even if the server issues a new guest ID", async () => {
  mockAuth = {
    user: { id: "guest1", isGuest: true },
    guestId: "guest1",
    isAuthenticated: true,
    isGuest: true,
  };
  expect((await success("guest-scan")).remaining).toBe(29);
  mockAuth.user = { id: "guest2", isGuest: true };
  mockAuth.guestId = "guest2";
  expect((await scanQuota.get()).remaining).toBe(29);
  mockAuth = {
    user: { id: "A" },
    guestId: null,
    isAuthenticated: true,
    isGuest: false,
  };
  expect((await scanQuota.get()).remaining).toBe(29);
});
it("does not consume free scans when Premium activates during the request", async () => {
  const start = await beginFreeScanAttempt("upgrade");
  if (start.status !== "ready") throw Error(start.status);
  mockPremium = true;
  await completeFreeScanAttempt(start.attempt, "success");
  expect((await scanQuota.get()).remaining).toBe(30);
});

it("migrates photo and sound usage without counting the legacy photo mirror twice", async () => {
  await AsyncStorage.setItem("identificationUsageCount", "4");
  await AsyncStorage.setItem("photoIdentificationUsageCount", "4");
  await AsyncStorage.setItem("soundIdentificationUsageCount", "3");
  expect((await scanQuota.get()).used).toBe(7);
});

it("charges one attempt for a two-photo identification and shares the allowance with sound", async () => {
  const first = await beginFreeScanAttempt("two-photo-request");
  if (first.status !== "ready") throw Error(first.status);
  await completeFreeScanAttempt(first.attempt, "success");
  await completeFreeScanAttempt(first.attempt, "success");
  expect((await scanQuota.get()).remaining).toBe(29);
  expect((await success("sound-request")).remaining).toBe(28);
});
