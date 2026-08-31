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
        await soundRecordingService.stopPlayback();
        setPlayingId(null);
        return;
      }
      const url = urls?.find(
        (u) => typeof u === "string" && u.trim().length > 0
      );
      if (!url) return;
      try {
        await soundRecordingService.stopPlayback();
        await soundRecordingService.play(url);
        setPlayingId(id);
      } catch {
        setPlayingId(null);
      }
    },
    [playingId]
  );

  return { playingId, toggleSound };
}
