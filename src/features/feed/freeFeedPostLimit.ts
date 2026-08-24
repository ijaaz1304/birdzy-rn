import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRemoteConfigValue } from "../../services/remoteConfig/remoteConfig.service";

const FEED_POST_DATE_KEY = (userId: string) => `free_feed_post_date_${userId}`;
const FEED_POST_COUNT_KEY = (userId: string) => `free_feed_post_count_${userId}`;
/** Legacy lifetime count from previous implementation. */
const LEGACY_CREATED_COUNT_KEY = (userId: string) =>
  `free_feed_posts_created_${userId}`;
const LEGACY_LAST_DATE_KEY = (userId: string) => `free_post_last_date_${userId}`;

const getTodayKey = () => new Date().toISOString().slice(0, 10);

/** Max feed posts for a free user per UTC day. Default 1. */
export function getFreeFeedPostLimit(): number {
  return Math.max(
    1,
    Number(getRemoteConfigValue("freeUserDailyFeedPostLimit")) || 1
  );
}

async function getTodayPostCount(userId: string): Promise<number> {
  const today = getTodayKey();
  const date = await AsyncStorage.getItem(FEED_POST_DATE_KEY(userId));
  if (date !== today) return 0;
  return Number(await AsyncStorage.getItem(FEED_POST_COUNT_KEY(userId))) || 0;
}

/** Posts created today (free-tier tracking). */
export async function getFreeUserFeedPostCount(userId: string): Promise<number> {
  return getTodayPostCount(userId);
}

export async function hasReachedFreeFeedPostLimit(
  userId: string
): Promise<boolean> {
  const count = await getTodayPostCount(userId);
  return count >= getFreeFeedPostLimit();
}

export async function recordFreeFeedPostCreated(userId: string): Promise<void> {
  const today = getTodayKey();
  const prevDate = await AsyncStorage.getItem(FEED_POST_DATE_KEY(userId));
  const prevCount =
    prevDate === today
      ? Number(await AsyncStorage.getItem(FEED_POST_COUNT_KEY(userId))) || 0
      : 0;
  await AsyncStorage.setItem(FEED_POST_DATE_KEY(userId), today);
  await AsyncStorage.setItem(
    FEED_POST_COUNT_KEY(userId),
    String(prevCount + 1)
  );
  await AsyncStorage.removeItem(LEGACY_CREATED_COUNT_KEY(userId));
  await AsyncStorage.removeItem(LEGACY_LAST_DATE_KEY(userId));
}
