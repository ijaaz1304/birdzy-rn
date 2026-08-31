import { COLLECTION_STRINGS } from "../../../config/strings/collection.strings";

export type BirdSoundListItem = {
  id: string;
  url: string;
  title: string;
  durationLabel?: string;
  isUserRecording?: boolean;
  metaLine?: string;
};

function formatRecordingTimestamp(iso?: string): string | undefined {
  if (!iso?.trim()) return undefined;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  const d = new Date(t);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hh}:${mm}`;
}

export function formatBirdSoundDuration(seconds?: number): string | undefined {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return undefined;
  }
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function catalogSoundTitle(url: string): string {
  const strings = COLLECTION_STRINGS.birdDetails.sounds;
  const lower = url.toLowerCase();
  if (lower.includes("song")) {
    return strings.songsPrefix;
  }
  if (lower.includes("call")) {
    return strings.callsPrefix;
  }
  return strings.callPrefix;
}

function asUrlList(value?: string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((url) => typeof url === "string" && url.trim().length > 0);
}

export function buildBirdSoundListItems(input: {
  soundUrls?: string[];
  userCapturedSounds?: string[];
  customLocation?: string;
  createdAt?: string;
  updatedAt?: string;
  durationsSec?: Record<string, number>;
}): BirdSoundListItem[] {
  const strings = COLLECTION_STRINGS.birdDetails.sounds;
  const userUrls = asUrlList(input.userCapturedSounds);
  const catalogUrls = asUrlList(input.soundUrls).filter(
    (url) => !userUrls.includes(url)
  );
  const items: BirdSoundListItem[] = [];
  const metaParts = [
    formatRecordingTimestamp(input.createdAt ?? input.updatedAt),
    input.customLocation?.trim(),
  ].filter(Boolean);

  userUrls.forEach((url, index) => {
    items.push({
      id: `user-${url}-${index}`,
      url,
      title: strings.sampleTitle,
      isUserRecording: true,
      metaLine: metaParts.length ? metaParts.join(" • ") : undefined,
      durationLabel: formatBirdSoundDuration(input.durationsSec?.[url]),
    });
  });

  let songIndex = 0;
  let callIndex = 0;
  catalogUrls.forEach((url, index) => {
    const lower = url.toLowerCase();
    let title: string;
    if (lower.includes("song")) {
      songIndex += 1;
      title = `${catalogSoundTitle(url)} ${songIndex}`;
    } else if (lower.includes("call")) {
      callIndex += 1;
      title = `${catalogSoundTitle(url)} ${callIndex}`;
    } else {
      callIndex += 1;
      title = `${catalogSoundTitle(url)} ${callIndex}`;
    }

    items.push({
      id: `catalog-${url}-${index}`,
      url,
      title,
      durationLabel: formatBirdSoundDuration(input.durationsSec?.[url]),
    });
  });

  return items;
}
