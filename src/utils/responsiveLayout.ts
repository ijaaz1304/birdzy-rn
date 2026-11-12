/** Logical layout policy shared by card grids. Native text measurement still owns row height. */
export function getResponsiveGridColumns(
  width: number,
  fontScale: number
): 1 | 2 {
  return width < 360 || fontScale > 1.2 ? 1 : 2;
}

/** Available popup/sheet height must not reserve a phone minimum larger than the window. */
export function getAvailableOverlayHeight(
  height: number,
  topInset: number,
  bottomInset = 0
): number {
  return Math.max(1, height - topInset - bottomInset);
}
