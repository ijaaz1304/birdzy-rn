import { getDiagnosisPreviewSize } from "../../src/features/camera/diagnosisLoadingLayout";

it("keeps the Figma frame on the standard phone when text is default", () => {
  expect(getDiagnosisPreviewSize(393, 852, 47, 34, 1)).toBe(280);
});

it("keeps the frame inside a 360-wide window", () => {
  const size = getDiagnosisPreviewSize(360, 800, 24, 16, 1);
  expect(size).toBeLessThanOrEqual(360 - 48);
  expect(size).toBe(280);
});

it("shrinks the preview on a short window at the largest font", () => {
  const size = getDiagnosisPreviewSize(360, 568, 24, 16, 2);
  expect(size).toBeLessThan(280);
  expect(size).toBeGreaterThanOrEqual(120);
});
