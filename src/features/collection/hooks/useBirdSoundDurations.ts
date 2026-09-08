import { useEffect, useMemo, useState } from "react";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";

export function useBirdSoundDurations(urls: string[]): Record<string, number> {
  const [durationsSec, setDurationsSec] = useState<Record<string, number>>({});
  const urlsKey = useMemo(
    () =>
      [...new Set(urls.filter((url) => typeof url === "string" && url.trim()))]
        .sort()
        .join("\n"),
    [urls]
  );

  useEffect(() => {
    let cancelled = false;
    const unique = urlsKey ? urlsKey.split("\n") : [];

    if (unique.length === 0) {
      setDurationsSec({});
      return;
    }

    void (async () => {
      const next: Record<string, number> = {};
      for (const url of unique) {
        if (cancelled) return;
        const sec = await soundRecordingService.probeDurationSec(url);
        if (sec != null && sec > 0) {
          next[url] = sec;
        }
      }
      if (!cancelled) {
        setDurationsSec(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [urlsKey]);

  return durationsSec;
}
