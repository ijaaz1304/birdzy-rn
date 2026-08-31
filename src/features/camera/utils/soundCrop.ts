export const SOUND_CROP_DURATIONS = [9, 18, 27] as const;
export type SoundCropDuration = (typeof SOUND_CROP_DURATIONS)[number];

export function clampSoundCropStart(
  startSec: number,
  windowSec: number,
  totalSec: number
): number {
  const window = Math.min(Math.max(windowSec, 0), Math.max(totalSec, 0));
  const maxStart = Math.max(0, totalSec - window);
  return Math.min(Math.max(startSec, 0), maxStart);
}

export function resolveSoundCropWindow(
  chipSec: SoundCropDuration,
  totalSec: number,
  startSec = 0
): { startSec: number; windowSec: number } {
  const windowSec = Math.min(chipSec, Math.max(totalSec, 0));
  return {
    startSec: clampSoundCropStart(startSec, windowSec, totalSec),
    windowSec,
  };
}

export function isSoundCropChipAvailable(
  chipSec: SoundCropDuration,
  totalSec: number
): boolean {
  return totalSec >= chipSec;
}

export function formatSoundHms(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatSoundClipLabel(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}s`;
}

export function formatSoundStamp(date: Date): string {
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hh}:${mm}`;
}

export function isFullSoundCrop(windowSec: number, totalSec: number): boolean {
  return windowSec >= Math.max(totalSec, 0) - 0.05;
}

export function defaultSoundCropChip(
  totalSec: number
): SoundCropDuration | null {
  return (
    SOUND_CROP_DURATIONS.find((chip) =>
      isSoundCropChipAvailable(chip, totalSec)
    ) ?? null
  );
}

export function formatSoundCropActionLabel(
  windowSec: number,
  totalSec: number,
  fullPrefix: string,
  croppedPrefix: string
): string {
  const usingFull = isFullSoundCrop(windowSec, totalSec);
  const label = formatSoundClipLabel(usingFull ? totalSec : windowSec);
  return usingFull ? `${fullPrefix} ${label}` : `${croppedPrefix} ${label}`;
}
