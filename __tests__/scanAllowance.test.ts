import { newScanAttemptId } from "../src/services/session/scanAllowance";
it("generates distinct request attempt handles without a local ledger", () => {
  expect(newScanAttemptId()).not.toBe(newScanAttemptId());
});
