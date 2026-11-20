/** Figma identifying preview. Shrinks only when the window cannot keep the status copy and Go back on screen. */
export const DIAGNOSIS_FRAME_MAX = 280;
export const DIAGNOSIS_FRAME_MIN = 120;

export function getDiagnosisPreviewSize(
  width: number,
  height: number,
  topInset: number,
  bottomInset: number,
  fontScale: number
): number {
  const horizontal = Math.max(0, width - 48);
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const textBlock = Math.round(72 * scale);
  const chrome = topInset + bottomInset + textBlock + 56 + 48 + 72;
  const available = height - chrome;
  return Math.max(
    DIAGNOSIS_FRAME_MIN,
    Math.min(DIAGNOSIS_FRAME_MAX, horizontal, Math.max(0, available))
  );
}
