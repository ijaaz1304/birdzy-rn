import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createScanAllowance } from "../src/services/session/scanAllowance";
import { useUnsuccessfulScanPopup } from "../src/hooks/useUnsuccessfulScanPopup";
let mockAccount = "A";
let mockPremium = false;
let mockQuota: ReturnType<typeof createScanAllowance>;
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));
jest.mock("../src/services/session/scanQuota", () => ({
  scanQuota: { currentScope: () => `account:${mockAccount}` },
  recordUnsuccessfulScan: (id: string, identity: string) =>
    mockQuota.recordFailure(id, () => mockPremium, identity),
}));
const onRemaining = jest.fn();
function CannotIdentifyPopup({
  visible,
  attemptId,
}: {
  visible: boolean;
  attemptId: string;
}) {
  useUnsuccessfulScanPopup(visible, attemptId, onRemaining);
  return null;
}
let renderer: ReactTestRenderer;
beforeEach(() => {
  jest.clearAllMocks();
  mockAccount = "A";
  mockPremium = false;
  const storage = new Map<string, string>();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async (key) => storage.get(key) ?? null
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    storage.set(key, value);
  });
  mockQuota = createScanAllowance({
    getIdentity: () => ({ accountId: mockAccount, isGuest: false }),
    readLegacyUsage: async () => 0,
  });
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
it("records all ten visible failures and updates the displayed count from the sixth", async () => {
  await act(async () => {
    renderer = create(
      <CannotIdentifyPopup visible={false} attemptId="scan-0" />
    );
  });
  for (let failure = 1; failure <= 10; failure++) {
    await act(async () => {
      renderer.update(
        <CannotIdentifyPopup visible={false} attemptId={`scan-${failure}`} />
      );
    });
    await act(async () => {
      renderer.update(
        <CannotIdentifyPopup visible attemptId={`scan-${failure}`} />
      );
    });
    expect((await mockQuota.get()).remaining).toBe(
      30 - Math.max(0, failure - 5)
    );
    expect(onRemaining).toHaveBeenLastCalledWith(30 - Math.max(0, failure - 5));
  }
});
it("deduplicates a popup for a no-match already counted by the request", async () => {
  const start = await mockQuota.begin("same-scan", false);
  if (start.status !== "ready") throw new Error(start.status);
  await mockQuota.complete(start.attempt, "failure");
  await act(async () => {
    renderer = create(<CannotIdentifyPopup visible attemptId="same-scan" />);
  });
  expect((await mockQuota.get()).failures).toBe(1);
});
it("does not count cancelled requests that never show the popup", async () => {
  await act(async () => {
    renderer = create(
      <CannotIdentifyPopup visible={false} attemptId="cancelled" />
    );
  });
  expect((await mockQuota.get()).failures).toBe(0);
});
it("keeps old popup failures out of a newly signed-in account", async () => {
  await act(async () => {
    renderer = create(
      <CannotIdentifyPopup visible={false} attemptId="old-scan" />
    );
  });
  mockAccount = "B";
  await act(async () => {
    renderer.update(<CannotIdentifyPopup visible attemptId="old-scan" />);
  });
  expect((await mockQuota.get()).failures).toBe(0);
});
