import {
  formatDailyLimitResetCountdown,
  getMsUntilDailyLimitReset,
} from "../../src/features/camera/utils/identificationLimitDisplay";

describe("identificationLimitDisplay", () => {
  it("formats reset countdown as hours and zero-padded minutes", () => {
    expect(formatDailyLimitResetCountdown(23 * 60 * 60_000 + 59 * 60_000)).toBe(
      "23h:59m"
    );
    expect(formatDailyLimitResetCountdown(90 * 60_000)).toBe("1h:30m");
  });

  it("returns milliseconds until next local midnight", () => {
    const now = new Date("2026-08-31T22:00:00");
    const ms = getMsUntilDailyLimitReset(now);
    expect(ms).toBe(2 * 60 * 60_000);
  });
});
