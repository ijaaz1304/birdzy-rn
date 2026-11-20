import { getMatchThumbnailSize } from "../../src/features/camera/matchThumbnailSize";

describe("possible-match photo size under font scaling", () => {
  test("Figma 120pt at default and slightly larger text", () => {
    expect(getMatchThumbnailSize(1)).toBe(120);
    expect(getMatchThumbnailSize(1.15)).toBe(120);
  });

  test("shrinks proportionally as text grows so the name column widens", () => {
    expect(getMatchThumbnailSize(1.3)).toBe(111);
    expect(getMatchThumbnailSize(1.5)).toBe(96);
  });

  test("never below the 72pt minimum", () => {
    expect(getMatchThumbnailSize(2)).toBe(72);
    expect(getMatchThumbnailSize(3)).toBe(72);
  });
});
