import {
  computeElapsedRecordingSeconds,
  isRecordingOverMaxDuration,
} from "../../src/features/camera/utils/recordingTimer";

describe("recordingTimer", () => {
  const startedAt = 1_000_000;

  it("returns zero when not started", () => {
    expect(
      computeElapsedRecordingSeconds({
        recordingStartedAt: null,
        pausedAt: null,
        pausedAccumMs: 0,
        now: startedAt + 5000,
      })
    ).toBe(0);
  });

  it("counts elapsed time from timestamps", () => {
    expect(
      computeElapsedRecordingSeconds({
        recordingStartedAt: startedAt,
        pausedAt: null,
        pausedAccumMs: 0,
        now: startedAt + 14_250,
      })
    ).toBeCloseTo(14.25, 2);
  });

  it("excludes completed pause intervals", () => {
    expect(
      computeElapsedRecordingSeconds({
        recordingStartedAt: startedAt,
        pausedAt: null,
        pausedAccumMs: 4000,
        now: startedAt + 20_000,
      })
    ).toBeCloseTo(16, 2);
  });

  it("excludes active pause time", () => {
    expect(
      computeElapsedRecordingSeconds({
        recordingStartedAt: startedAt,
        pausedAt: startedAt + 10_000,
        pausedAccumMs: 0,
        now: startedAt + 15_000,
      })
    ).toBeCloseTo(10, 2);
  });

  it("detects max duration", () => {
    expect(isRecordingOverMaxDuration(59)).toBe(false);
    expect(isRecordingOverMaxDuration(60)).toBe(true);
  });
});
