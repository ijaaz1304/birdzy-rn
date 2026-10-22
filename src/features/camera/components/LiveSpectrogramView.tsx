/** High-resolution spectrogram rendered as one lossless native bitmap. */
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, PixelRatio, StyleSheet, View } from "react-native";
import { AppImage } from "../../../components/AppImage";
import {
  SPECTROGRAM_DISPLAY_MAX_COLUMNS,
  SPECTROGRAM_RECORDED_MAX_COLUMNS,
  SPECTROGRAM_DISPLAY_MEL_BANDS,
} from "../constants/soundRecording.constants";
import { logSoundRenderCount } from "../utils/soundRecordLog";
import { SPECTROGRAM_BG, spectrogramBitmap } from "../utils/spectrogramBitmap";
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
  const [slot0, setSlot0] = useState<string | undefined>();
  const [slot1, setSlot1] = useState<string | undefined>();
  const [visible, setVisible] = useState<0 | 1>(0);
  const visibleRef = useRef<0 | 1>(0);
  const shownUriRef = useRef<string | undefined>();
  const pendingUriRef = useRef<string | undefined>();

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
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

  const nextUri = useMemo(() => {
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
    return uri;
  }, [bitmapWidth, columns, playheadCenter]);

  useLayoutEffect(() => {
    if (!nextUri) return;
    if (shownUriRef.current == null) {
      shownUriRef.current = nextUri;
      visibleRef.current = 0;
      setSlot0(nextUri);
      setVisible(0);
      return;
    }
    if (nextUri === shownUriRef.current || nextUri === pendingUriRef.current) {
      return;
    }
    pendingUriRef.current = nextUri;
    if (visibleRef.current === 0) setSlot1(nextUri);
    else setSlot0(nextUri);
  }, [nextUri]);

  const promote = useCallback((slot: 0 | 1, uri: string) => {
    if (pendingUriRef.current !== uri || visibleRef.current === slot) return;
    shownUriRef.current = uri;
    pendingUriRef.current = undefined;
    visibleRef.current = slot;
    setVisible(slot);
  }, []);

  const source0 = useMemo(() => (slot0 ? { uri: slot0 } : undefined), [slot0]);
  const source1 = useMemo(() => (slot1 ? { uri: slot1 } : undefined), [slot1]);

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={onLayout}
      pointerEvents="none"
      collapsable={false}
    >
      {source0 ? (
        <AppImage
          source={source0}
          style={[styles.layer, visible === 0 ? styles.front : styles.back]}
          resizeMode="stretch"
          preferRNImage
          fadeDuration={0}
          onLoad={() => promote(0, slot0!)}
        />
      ) : null}
      {source1 ? (
        <AppImage
          source={source1}
          style={[styles.layer, visible === 1 ? styles.front : styles.back]}
          resizeMode="stretch"
          preferRNImage
          fadeDuration={0}
          onLoad={() => promote(1, slot1!)}
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
    backgroundColor: SPECTROGRAM_BG,
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPECTROGRAM_BG,
  },
  front: {
    zIndex: 1,
  },
  back: {
    zIndex: 0,
  },
  playhead: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    zIndex: 2,
    backgroundColor: "#EF4444",
  },
});
