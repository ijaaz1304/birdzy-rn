import {
  getAccessibilityFontScale,
  scaleFigmaFontSize,
} from "../../src/common/typography";

describe("Figma font scale (Build A)", () => {
  test("default font scale keeps the Figma size", () => {
    expect(getAccessibilityFontScale(1)).toBe(1);
    expect(scaleFigmaFontSize(16, 1)).toBe(16);
    expect(scaleFigmaFontSize(20, 1)).toBe(20);
  });

  test("the system font scale is applied and not capped", () => {
    expect(scaleFigmaFontSize(14, 1.15)).toBe(16);
    expect(scaleFigmaFontSize(14, 2)).toBe(28);
    expect(scaleFigmaFontSize(14, 3)).toBe(42);
    expect(getAccessibilityFontScale(0.85)).toBe(0.85);
  });

  test("a missing font scale stays on the Figma size", () => {
    expect(getAccessibilityFontScale(Number.NaN)).toBe(1);
    expect(scaleFigmaFontSize(20, 0)).toBe(20);
  });
});
