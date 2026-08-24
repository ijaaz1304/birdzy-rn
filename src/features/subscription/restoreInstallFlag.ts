import AsyncStorage from "@react-native-async-storage/async-storage";

/** Persisted so we only auto-restore once per app install (optional; see restorePurchases.ts). */
export const IAP_AUTO_RESTORE_DONE_KEY = "iap_auto_restore_done_v1";

export async function hasCompletedAutoRestoreThisInstall(): Promise<boolean> {
  const v = await AsyncStorage.getItem(IAP_AUTO_RESTORE_DONE_KEY);
  return v === "true";
}

export async function markAutoRestoreCompletedThisInstall(): Promise<void> {
  await AsyncStorage.setItem(IAP_AUTO_RESTORE_DONE_KEY, "true");
}
