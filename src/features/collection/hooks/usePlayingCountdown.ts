import { useEffect, useState } from "react";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";

/**
 * Remaining seconds for the clip that is playing.
 * Restarts from the full length whenever playback starts again.
 */
export function usePlayingCountdown(
  isPlaying: boolean,
  durationSec?: number,
  uri?: string
): number | undefined {
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    if (!isPlaying) {
      setRemaining(durationSec);
      return;
    }

    const startedAt = Date.now();
    let total = Math.max(0, durationSec ?? 0);
    let usingPlayerClock = false;
    setRemaining(total > 0 ? total : undefined);

    const tick = () => {
      if (usingPlayerClock || total <= 0) return;
      const elapsed = (Date.now() - startedAt) / 1000;
      setRemaining(Math.max(0, total - elapsed));
    };
    tick();
    const interval = setInterval(tick, 250);
    const unsubscribe = soundRecordingService.subscribePlayback((progress) => {
      if (!progress || progress.durationSec <= 0) return;
      if (uri && progress.uri !== uri) return;
      usingPlayerClock = true;
      total = progress.durationSec;
      setRemaining(Math.max(0, progress.durationSec - progress.positionSec));
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isPlaying, durationSec, uri]);

  return isPlaying ? remaining : durationSec;
}
