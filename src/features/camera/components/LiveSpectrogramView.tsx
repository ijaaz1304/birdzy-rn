/** High-resolution spectrogram rendered as one lossless native bitmap. */
import React, { useCallback, useMemo, useState } from "react";
import { LayoutChangeEvent, PixelRatio, StyleSheet, View } from "react-native";
import { AppImage } from "../../../components/AppImage";
import {
  SPECTROGRAM_DISPLAY_MAX_COLUMNS,
  SPECTROGRAM_RECORDED_MAX_COLUMNS,
  SPECTROGRAM_DISPLAY_MEL_BANDS,
} from "../constants/soundRecording.constants";
import { logSoundRenderCount } from "../utils/soundRecordLog";
import { spectrogramBitmap } from "../utils/spectrogramBitmap";
import {
  isSoundPerfEnabled,
  soundPerfNow,
  soundPerfRecordTiming,
} from "../utils/soundPerf";

type Props = {
  height?: number;
  /** Normalized band energies, high frequencies first. */
  columns: number[][];
  playheadCenter?: boolean;
};

function LiveSpectrogramViewComponent({
  height = 100,
  columns,
  playheadCenter = true,
}: Props) {
  logSoundRenderCount("LiveSpectrogramView");
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);
  const bitmapWidth =
    width > 0
      ? Math.max(
          1,
          Math.min(
            playheadCenter
              ? SPECTROGRAM_DISPLAY_MAX_COLUMNS
              : SPECTROGRAM_RECORDED_MAX_COLUMNS,
            Math.ceil(width * PixelRatio.get())
          )
        )
      : 0;
  const source = useMemo(() => {
    if (!bitmapWidth || !columns.length) return undefined;
    const perf = isSoundPerfEnabled();
    const start = perf ? soundPerfNow() : 0;
    const uri = spectrogramBitmap(
      columns,
      bitmapWidth,
      SPECTROGRAM_DISPLAY_MEL_BANDS,
      playheadCenter
    );
    if (perf) soundPerfRecordTiming("BitmapRender", soundPerfNow() - start);
    return { uri };
  }, [bitmapWidth, columns, playheadCenter]);
  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={onLayout}
      pointerEvents="none"
    >
      {source ? (
        <AppImage
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
          preferRNImage
          fadeDuration={0}
        />
      ) : null}
      {playheadCenter ? <View style={styles.playhead} /> : null}
    </View>
  );
}

export const LiveSpectrogramView = React.memo(
  LiveSpectrogramViewComponent,
  (prev, next) =>
    prev.height === next.height &&
    prev.playheadCenter === next.playheadCenter &&
    (prev.columns === next.columns ||
      (prev.columns.length === next.columns.length &&
        prev.columns.every((column, i) => column === next.columns[i])))
);

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
  },
  playhead: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: "#EF4444",
  },
});
