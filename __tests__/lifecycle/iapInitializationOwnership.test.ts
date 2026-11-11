const mockInit = jest.fn();
const mockEnd = jest.fn(async () => true);
jest.mock("react-native-iap", () => ({
  initConnection: (...args: unknown[]) => mockInit(...args),
  endConnection: () => mockEnd(),
}));
jest.mock("../../src/features/app-logs/app-logs.store", () => ({
  useAppLogsStore: {
    getState: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
  },
}));
import {
  ensureIapInitialized,
  disconnectIap,
} from "../../src/features/subscription/services/iap.service";
beforeEach(() => jest.clearAllMocks());
afterEach(async () => {
  await disconnectIap();
});
it("shares a failed connection attempt and permits recovery after false", async () => {
  mockInit.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  await expect(
    Promise.all([ensureIapInitialized(), ensureIapInitialized()])
  ).resolves.toEqual([false, false]);
  expect(mockInit).toHaveBeenCalledTimes(1);
  await expect(ensureIapInitialized()).resolves.toBe(true);
  expect(mockInit).toHaveBeenCalledTimes(2);
});
it("does not let an older failed attempt clear its replacement", async () => {
  let fail!: (error: Error) => void;
  let complete!: (value: boolean) => void;
  mockInit
    .mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          fail = reject;
        })
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        })
    );
  const old = ensureIapInitialized().catch(() => false);
  await disconnectIap();
  const next = ensureIapInitialized();
  fail(new Error("old connection failed"));
  await old;
  const same = ensureIapInitialized();
  expect(mockInit).toHaveBeenCalledTimes(2);
  complete(true);
  await expect(Promise.all([next, same])).resolves.toEqual([true, true]);
});
