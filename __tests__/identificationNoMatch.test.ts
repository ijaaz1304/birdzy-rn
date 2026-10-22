import AsyncStorage from "@react-native-async-storage/async-storage";
import { isIdentificationNoMatch } from "../src/services/session/identificationNoMatch";
import { createScanAllowance } from "../src/services/session/scanAllowance";

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
});

it.each([
  { response: { status: 422, data: { message: "No match for this image" } } },
  {
    status: 422,
    message: "Identification failed",
    data: { code: "NO_MATCH_FOUND" },
  },
  { status: 200, data: { reason: "No insects detected" } },
  { error: true, reason: "No matches found" },
  { status: 404, reason: "No matches found for this image" },
  new Error("We couldn't identify the mineral from your input"),
  { status: 400, message: "Unable to identify this image" },
  { statusCode: 422, reason: "No matching insects found" },
  { response: { status: 400, data: { reason: "No plants found" } } },
])("recognizes a completed no-match response: %p", (error) => {
  expect(isIdentificationNoMatch(error)).toBe(true);
});

it.each([
  { status: 503, data: { code: "NO_MATCH_FOUND" } },
  { status: 401, message: "Unable to identify" },
  { status: 403, message: "Unable to identify" },
  { status: 429, message: "Unable to identify" },
  { status: 500, message: "Unable to identify" },
  { statusCode: 503, reason: "No matches found" },
  { response: { status: 504, data: { reason: "Unable to identify" } } },
  { name: "NetworkException", message: "Unable to identify" },
  { name: "TimeoutException", message: "Unable to identify" },
  { name: "AbortError", message: "Unable to identify" },
  { code: "ERR_CANCELED", message: "Unable to identify" },
  new Error("Identification failed: image URI is missing"),
  new Error("Internal Server Error"),
])(
  "does not count operational or invalid-input errors as a no-match: %p",
  (error) => {
    expect(isIdentificationNoMatch(error)).toBe(false);
  }
);

it("deducts no-match error responses from attempt six and publishes the updated allowance", async () => {
  const quota = createScanAllowance({
    getIdentity: () => ({ accountId: "free-user", isGuest: false }),
    readLegacyUsage: async () => 0,
  });
  const changed = jest.fn();
  quota.subscribe(changed);
  for (let attempt = 1; attempt <= 7; attempt++) {
    const start = await quota.begin(`scan-${attempt}`, false);
    if (start.status !== "ready") throw new Error(start.status);
    const error = { error: true, reason: "No matches found" };
    expect(isIdentificationNoMatch(error)).toBe(true);
    const allowance = await quota.complete(start.attempt, "failure");
    expect(allowance.remaining).toBe(30 - Math.max(0, attempt - 5));
    expect((await quota.get()).remaining).toBe(allowance.remaining);
  }
  expect(changed).toHaveBeenCalledTimes(7);
  expect((await quota.get()).remaining).toBe(28);
});
