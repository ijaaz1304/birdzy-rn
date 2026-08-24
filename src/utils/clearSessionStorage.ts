/**
 * Clears session/user data from AsyncStorage on logout or delete account.
 * Preserves device-level preferences (e.g. appearance theme) that should
 * survive account changes.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { UI_STATE_KEYS } from "../constants/storageConstants";

/** Keys kept when clearing session storage (not tied to a user account). */
export const PRESERVED_STORAGE_KEYS_ON_LOGOUT = [
  UI_STATE_KEYS.THEME,
] as const;

const preservedKeySet = new Set<string>(PRESERVED_STORAGE_KEYS_ON_LOGOUT);

/**
 * Remove all AsyncStorage entries except preserved preference keys.
 * Prefer this over AsyncStorage.clear() so appearance / theme survives logout.
 */
export async function clearSessionStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const keysToRemove = keys.filter((key) => !preservedKeySet.has(key));
  if (keysToRemove.length > 0) {
    await AsyncStorage.multiRemove(keysToRemove);
  }
}
