import { useEffect, useMemo, useState } from "react";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";

export function useBirdSoundDurations(urls: string[]): Record<string, number> {
  const [durationsSec, setDurationsSec] = useState<Record<string, number>>({});
  const uniqueUrls = useMemo(
    () =>
      [...new Set(urls.filter((url) => typeof url === "string" && url.trim()))],
    [urls]
  );
  const urlsKey = uniqueUrls.join("\n");

  useEffect(() => {
    const unique = urlsKey ? urlsKey.split("\n") : [];

    if (unique.length === 0) {
      setDurationsSec({});
      return;
    }

    const initial: Record<string, number> = {};
    for (const url of unique) {
      const cached = soundRecordingService.getCachedDurationSec(url);
      if (cached != null) initial[url] = cached;
    }
    setDurationsSec(initial);

    const unsubscribe = soundRecordingService.subscribeDuration((uri, sec) => {
      if (!unique.includes(uri)) return;
      setDurationsSec((prev) =>
        prev[uri] === sec ? prev : { ...prev, [uri]: sec }
      );
    });

    let cancelled = false;
    void (async () => {
      for (const url of unique) {
        if (cancelled) return;
        if (initial[url] != null) continue;
        const sec = await soundRecordingService.probeDurationSec(url);
        if (cancelled) return;
        if (sec != null && sec > 0) {
          setDurationsSec((prev) => ({ ...prev, [url]: sec }));
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [urlsKey]);

  return durationsSec;
}
