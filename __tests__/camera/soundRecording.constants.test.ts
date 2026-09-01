import {
  MIN_SOUND_RECORDING_SECONDS,
  MAX_SOUND_RECORDING_SECONDS,
  formatMinRecordingLengthMessage,
  meetsMinRecordingDuration,
} from "../../src/features/camera/constants/soundRecording.constants";

describe("soundRecording.constants", () => {
  it("derives minimum duration from shortest crop chip", () => {
    expect(MIN_SOUND_RECORDING_SECONDS).toBe(9);
  });

  it("formats guidance copy from the configured minimum", () => {
    expect(formatMinRecordingLengthMessage()).toBe(
      "Please record at least 9 seconds"
    );
    expect(formatMinRecordingLengthMessage(12)).toBe(
      "Please record at least 12 seconds"
    );
  });

  it("validates minimum recording duration", () => {
    expect(meetsMinRecordingDuration(8)).toBe(false);
    expect(meetsMinRecordingDuration(9)).toBe(true);
    expect(meetsMinRecordingDuration(MAX_SOUND_RECORDING_SECONDS)).toBe(true);
  });
});
