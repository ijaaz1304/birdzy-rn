/** Limit prompts belong to the active camera/Submit surface, never to Home. */
let pending = false;
let introduction = false;
const surfaces = new Set<symbol>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
export const getFreeScanLimitIntroduction = () => introduction;
export const getFreeScanLimitPrompt = () => pending;
export const getFreeScanPromptSurfaceActive = () => surfaces.size > 0;
export function subscribeFreeScanLimitPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
/** Release on blur/unmount so delayed checks cannot follow the user to Home. */
export function activateFreeScanPromptSurface(): () => void {
  const token = Symbol("scan-submit-surface");
  surfaces.add(token);
  notify();
  return () => {
    if (!surfaces.delete(token)) return;
    if (!surfaces.size) {
      pending = false;
      introduction = false;
    }
    notify();
  };
}
export function requestFreeScanLimitPrompt(isIntroduction = false): void {
  if (!getFreeScanPromptSurfaceActive()) return;
  if (pending && (isIntroduction || !introduction)) return;
  introduction = isIntroduction;
  pending = true;
  notify();
}
export function dismissFreeScanLimitPrompt(): void {
  if (!pending) return;
  pending = false;
  notify();
}
