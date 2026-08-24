/**
 * Persist hidden and reported post IDs per user on device.
 * Feed uses backend JWT (not Firebase Auth), so Firestore feedPreferences writes
 * are best-effort only — local storage is the source of truth.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { FEED_STORAGE_KEYS } from "../../constants/storageConstants";

type PostIdListener = (ids: Set<string>) => void;

const hiddenListenersByUser = new Map<string, Set<PostIdListener>>();
const reportedListenersByUser = new Map<string, Set<PostIdListener>>();

function hiddenStorageKey(userId: string): string {
  return `${FEED_STORAGE_KEYS.HIDDEN_POST_IDS_PREFIX}${userId}`;
}

function reportedStorageKey(userId: string): string {
  return `${FEED_STORAGE_KEYS.REPORTED_POST_IDS_PREFIX}${userId}`;
}

function parseStoredIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function notifyListeners(
  listenersByUser: Map<string, Set<PostIdListener>>,
  userId: string,
  ids: Set<string>
): void {
  const listeners = listenersByUser.get(userId);
  if (!listeners) return;
  listeners.forEach((listener) => listener(ids));
}

async function persistIds(key: string, ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify([...ids]));
}

export async function loadHiddenPostIds(userId: string): Promise<Set<string>> {
  try {
    return parseStoredIds(await AsyncStorage.getItem(hiddenStorageKey(userId)));
  } catch {
    return new Set();
  }
}

export async function loadReportedPostIds(
  userId: string
): Promise<Set<string>> {
  try {
    return parseStoredIds(
      await AsyncStorage.getItem(reportedStorageKey(userId))
    );
  } catch {
    return new Set();
  }
}

export async function addHiddenPostId(
  userId: string,
  postId: string
): Promise<Set<string>> {
  const ids = await loadHiddenPostIds(userId);
  if (!ids.has(postId)) {
    ids.add(postId);
    await persistIds(hiddenStorageKey(userId), ids);
    notifyListeners(hiddenListenersByUser, userId, ids);
  }
  return ids;
}

export async function addReportedPostId(
  userId: string,
  postId: string
): Promise<Set<string>> {
  const ids = await loadReportedPostIds(userId);
  if (!ids.has(postId)) {
    ids.add(postId);
    await persistIds(reportedStorageKey(userId), ids);
    notifyListeners(reportedListenersByUser, userId, ids);
  }
  return ids;
}

function subscribeToLocalPostIds(
  userId: string,
  listenersByUser: Map<string, Set<PostIdListener>>,
  loadIds: (userId: string) => Promise<Set<string>>,
  callback: (ids: Set<string>) => void
): () => void {
  let active = true;
  const listener: PostIdListener = (ids) => {
    if (active) callback(ids);
  };

  if (!listenersByUser.has(userId)) {
    listenersByUser.set(userId, new Set());
  }
  listenersByUser.get(userId)!.add(listener);

  void loadIds(userId).then((ids) => {
    if (active) callback(ids);
  });

  return () => {
    active = false;
    const set = listenersByUser.get(userId);
    if (!set) return;
    set.delete(listener);
    if (set.size === 0) {
      listenersByUser.delete(userId);
    }
  };
}

export function subscribeToLocalHiddenPostIds(
  userId: string,
  callback: (ids: Set<string>) => void
): () => void {
  return subscribeToLocalPostIds(
    userId,
    hiddenListenersByUser,
    loadHiddenPostIds,
    callback
  );
}

export function subscribeToLocalReportedPostIds(
  userId: string,
  callback: (ids: Set<string>) => void
): () => void {
  return subscribeToLocalPostIds(
    userId,
    reportedListenersByUser,
    loadReportedPostIds,
    callback
  );
}

export function mergeHiddenPostIdSets(...sets: Set<string>[]): Set<string> {
  const merged = new Set<string>();
  sets.forEach((set) => set.forEach((id) => merged.add(id)));
  return merged;
}

export async function loadExcludedPostIds(
  userId: string
): Promise<Set<string>> {
  const [hidden, reported] = await Promise.all([
    loadHiddenPostIds(userId),
    loadReportedPostIds(userId),
  ]);
  return mergeHiddenPostIdSets(hidden, reported);
}
