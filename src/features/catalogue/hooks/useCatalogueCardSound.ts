import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { soundRecordingService } from "../../../services/audio/soundRecording.service";

/** Play / stop the first bird sound on a catalogue card (Figma 8609:40912 speaker). */
export function useCatalogueCardSound() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void soundRecordingService.stopPlayback();
        setPlayingId(null);
      };
    }, [])
  );

  const toggleSound = useCallback(
    async (id: string, urls?: string[]) => {
      if (playingId === id) {
        setPlayingId(null);
        void soundRecordingService.stopPlayback();
        return;
      }
      const url = urls?.find(
        (u) => typeof u === "string" && u.trim().length > 0
      );
      if (!url) return;
      setPlayingId(id);
      try {
        await soundRecordingService.play(url, {
          onEnd: () => {
            setPlayingId((current) => (current === id ? null : current));
          },
        });
      } catch {
        setPlayingId((current) => (current === id ? null : current));
      }
    },
    [playingId]
  );

  return { playingId, toggleSound };
}
