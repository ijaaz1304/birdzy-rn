/** Milliseconds until the next local midnight (daily limit reset). */
export function getMsUntilDailyLimitReset(now = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, midnight.getTime() - now.getTime());
}

/** Figma format: `23h:59m` */
export function formatDailyLimitResetCountdown(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h:${String(minutes).padStart(2, "0")}m`;
}

export const MAX_CAMERA_IDENTIFY_IMAGES = 2;
