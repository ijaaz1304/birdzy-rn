
import { cropperOptionsForFontScale } from "../../src/features/camera/cropperFontScale";

describe("native cropper at large font sizes (Android)", () => {
  test("default and slightly larger fonts keep the aspect-ratio bar", () => {
    expect(cropperOptionsForFontScale(1, "android")).toEqual({});
    expect(cropperOptionsForFontScale(1.15, "android")).toEqual({});
  });

  test("large fonts hide the bar whose labels would overlap; corner cropping still works", () => {
    expect(cropperOptionsForFontScale(1.3, "android")).toEqual({ hideBottomControls: true });
    expect(cropperOptionsForFontScale(2, "android")).toEqual({ hideBottomControls: true });
  });

  test("iOS is unchanged", () => {
    expect(cropperOptionsForFontScale(2, "ios")).toEqual({});
  });
});
