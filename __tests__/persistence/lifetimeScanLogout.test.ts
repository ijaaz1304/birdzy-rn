import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearSessionStorage } from "../../src/utils/clearSessionStorage";
it("retains the exhausted free-scan allowance when clearing a session", async () => {
  await AsyncStorage.clear();
  await AsyncStorage.multiSet([
    ["identificationUsageCount", "30"],
    ["old-user-session", "secret"],
  ]);
  await clearSessionStorage();
  await expect(AsyncStorage.getItem("identificationUsageCount")).resolves.toBe(
    "30"
  );
  await expect(AsyncStorage.getItem("old-user-session")).resolves.toBeNull();
});

it("retains the account ledger including its failure grace", async () => {
  const ledger = JSON.stringify({ used: 24, failures: 8, completed: ["one"] });
  await AsyncStorage.setItem("@scan-allowance:v2:account%3AA", ledger);
  await clearSessionStorage();
  expect(await AsyncStorage.getItem("@scan-allowance:v2:account%3AA")).toBe(
    ledger
  );
});
