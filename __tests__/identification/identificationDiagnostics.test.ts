import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useIdentificationDiagnosticsStore as store,
  IDENTIFICATION_DIAGNOSTICS_KEY,
} from "../../src/features/camera/identificationDiagnostics.store";
beforeEach(async () => {
  await store.persist.rehydrate();
  store.getState().clear();
  jest.clearAllMocks();
});
it("bounds saved summaries and stores only public names/counts", () => {
  for (let i = 0; i < 25; i++)
    store.getState().record(Array(7).fill("x".repeat(200)), { totalCount: 7 });
  const logs = store.getState().logs;
  expect(logs).toHaveLength(20);
  expect(logs[0].metadata).toEqual({
    totalCount: 7,
    resolvedCount: 7,
    displayedCount: 5,
    matches: Array.from({ length: 5 }, (_, i) => ({
      rank: i + 1,
      name: "x".repeat(160),
    })),
  });
  expect(Object.keys(logs[0]).sort()).toEqual([
    "id",
    "level",
    "message",
    "metadata",
    "timestamp",
  ]);
});
it("rehydrates saved entries and clears persisted summaries", async () => {
  store.getState().record(["Ladybug"], { totalCount: 1 });
  const saved = await AsyncStorage.getItem(IDENTIFICATION_DIAGNOSTICS_KEY);
  store.setState({ logs: [] });
  await AsyncStorage.setItem(IDENTIFICATION_DIAGNOSTICS_KEY, saved!);
  await store.persist.rehydrate();
  expect(store.getState().logs[0].metadata.matches[0].name).toBe("Ladybug");
  store.getState().clear();
  expect(
    JSON.parse((await AsyncStorage.getItem(IDENTIFICATION_DIAGNOSTICS_KEY))!)
      .state.logs
  ).toEqual([]);
});
it("does not interrupt results when storage fails", async () => {
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("Storage full"));
  expect(() =>
    store.getState().record(["Bee"], { totalCount: 1 })
  ).not.toThrow();
  await Promise.resolve();
  expect(store.getState().logs).toHaveLength(1);
});
