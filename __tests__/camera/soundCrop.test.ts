import {
  clampSoundCropStart,
  defaultSoundCropChip,
  formatSoundClipLabel,
  formatSoundCropActionLabel,
  formatSoundHms,
  isSoundCropChipAvailable,
  resolveSoundCropWindow,
} from "../../src/features/camera/utils/soundCrop";

describe("sound crop window", () => {
  it("defaults the 9s window to the start of the recording", () => {
    expect(resolveSoundCropWindow(9, 59)).toEqual({
      startSec: 0,
      windowSec: 9,
    });
  });

  it("keeps a fixed duration while dragging", () => {
    expect(clampSoundCropStart(12, 9, 59)).toBe(12);
    expect(clampSoundCropStart(80, 9, 59)).toBe(50);
    expect(clampSoundCropStart(-4, 9, 59)).toBe(0);
  });

  it("clamps chips longer than the recording", () => {
    expect(resolveSoundCropWindow(27, 14)).toEqual({
      startSec: 0,
      windowSec: 14,
    });
    expect(isSoundCropChipAvailable(18, 14)).toBe(false);
    expect(isSoundCropChipAvailable(9, 14)).toBe(true);
  });

  it("formats clocks for the recording pill and crop labels", () => {
    expect(formatSoundHms(14)).toBe("00:00:14");
    expect(formatSoundClipLabel(9)).toBe("00:09s");
    expect(formatSoundClipLabel(59)).toBe("00:59s");
  });

  it("picks the shortest available chip and labels the identify action", () => {
    expect(defaultSoundCropChip(59)).toBe(9);
    expect(defaultSoundCropChip(12)).toBe(9);
    expect(defaultSoundCropChip(8)).toBeNull();
    expect(
      formatSoundCropActionLabel(9, 59, "Use full recording", "Use cropped-recording")
    ).toBe("Use cropped-recording 00:09s");
    expect(
      formatSoundCropActionLabel(59, 59, "Use full recording", "Use cropped-recording")
    ).toBe("Use full recording 00:59s");
  });
});
