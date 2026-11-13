import {
  clearBackendAiUsage,
  getBackendAiUsage,
  updateBackendAiUsage,
  parseBackendAiUsage,
  isAiLifetimeLimitError,
} from "../src/services/session/backendAiUsage";
const usage = {
  successCount: 4,
  errorCount: 1,
  successThreshold: 30,
  errorThreshold: 5,
};
beforeEach(clearBackendAiUsage);
it("rejects incomplete, negative, fractional and nonnumeric policy fields", () => {
  for (const value of [
    null,
    {},
    { ...usage, errorCount: -1 },
    { ...usage, successThreshold: 0.5 },
    { ...usage, successCount: "4" },
  ])
    expect(parseBackendAiUsage(value)).toBeNull();
  expect(parseBackendAiUsage({ ...usage, successThreshold: 0 })).not.toBeNull();
});
it("keeps newer responses and account snapshots independent", () => {
  updateBackendAiUsage("a", usage, 2);
  updateBackendAiUsage("a", { ...usage, successCount: 0 }, 1);
  updateBackendAiUsage("b", { ...usage, successCount: 8 }, 3);
  expect(getBackendAiUsage("a")?.usage.successCount).toBe(4);
  expect(getBackendAiUsage("b")?.usage.successCount).toBe(8);
});
it("recognizes E004 from all app transports without guessing from text", () => {
  for (const value of [
    { aiErrorCode: "E004" },
    { data: { aiErrorCode: "E004" } },
    { payload: { aiErrorCode: "E004" } },
    { response: { data: { aiErrorCode: "E004" } } },
  ])
    expect(isAiLifetimeLimitError(value)).toBe(true);
  expect(isAiLifetimeLimitError(new Error("Network failed"))).toBe(false);
});
