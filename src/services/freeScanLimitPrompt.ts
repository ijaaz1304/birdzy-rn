/** A navigation-independent request: the 30th scan can finish before the dialog mounts. */
let pending = false;
let introduction = false;
export const getFreeScanLimitIntroduction = () => introduction;
const listeners = new Set<() => void>();
export const getFreeScanLimitPrompt = () => pending;
export function subscribeFreeScanLimitPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function requestFreeScanLimitPrompt(isIntroduction = false): void {
  if (pending && (isIntroduction || !introduction)) return;
  introduction = isIntroduction;
  pending = true;
  listeners.forEach((listener) => listener());
}
export function dismissFreeScanLimitPrompt(): void {
  if (!pending) return;
  pending = false;
  listeners.forEach((listener) => listener());
}
