/** High-resolution spectrogram rendered as one lossless native bitmap. */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PixelRatio,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { AppImage } from "../../../components/AppImage";
import {
  LIVE_SPECTROGRAM_WINDOW_COLUMNS,
  SPECTROGRAM_DISPLAY_MAX_COLUMNS,
  SPECTROGRAM_RECORDED_MAX_COLUMNS,
  SPECTROGRAM_DISPLAY_MEL_BANDS,
  SPECTROGRAM_UI_FPS,
  SPECTROGRAM_UI_FPS_ANDROID,
} from "../constants/soundRecording.constants";
import { logSoundRenderCount } from "../utils/soundRecordLog";
import { SPECTROGRAM_BG, spectrogramBitmap } from "../utils/spectrogramBitmap";
import {
  isSoundPerfEnabled,
  soundPerfNow,
  soundPerfRecordTiming,
} from "../utils/soundPerf";

const LIVE_SCROLL_MS =
  1000 /
  (Platform.OS === "android" ? SPECTROGRAM_UI_FPS_ANDROID : SPECTROGRAM_UI_FPS);

type Props = {
  height?: number;
  /** Normalized band energies, high frequencies first. */
  columns: number[][];
  /** Live scroll: newest audio on the right edge, history growing left. */
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
  const layoutWidthRef = useRef(0);
  const bitmapWidthRef = useRef(0);
  const playheadRef = useRef(playheadCenter);
  const columnCountRef = useRef(columns.length);
  const shownColumnCountRef = useRef(0);
  const shift0 = useRef(new Animated.Value(0)).current;
  const shift1 = useRef(new Animated.Value(0)).current;
  const shifts = useRef([shift0, shift1]).current;

  playheadRef.current = playheadCenter;
  columnCountRef.current = columns.length;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    layoutWidthRef.current = next;
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
  bitmapWidthRef.current = bitmapWidth;

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
      shownColumnCountRef.current = columnCountRef.current;
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

  const promote = useCallback(
    (slot: 0 | 1, uri: string) => {
      if (pendingUriRef.current !== uri || visibleRef.current === slot) return;
      shownUriRef.current = uri;
      pendingUriRef.current = undefined;
      visibleRef.current = slot;

      const delta = columnCountRef.current - shownColumnCountRef.current;
      const slots = Math.max(
        1,
        Math.min(bitmapWidthRef.current, LIVE_SPECTROGRAM_WINDOW_COLUMNS)
      );
      const layoutWidth = layoutWidthRef.current;
      if (
        playheadRef.current &&
        shownColumnCountRef.current > 0 &&
        delta > 0 &&
        layoutWidth > 0
      ) {
        const dx = (Math.min(delta, slots) / slots) * layoutWidth;
        const shift = shifts[slot];
        shift.setValue(dx);
        Animated.timing(shift, {
          toValue: 0,
          duration: LIVE_SCROLL_MS,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      }
      shownColumnCountRef.current = columnCountRef.current;
      setVisible(slot);
    },
    [shifts]
  );

  useEffect(() => {
    if (!playheadCenter) {
      shift0.setValue(0);
      shift1.setValue(0);
    }
  }, [playheadCenter, shift0, shift1]);

  const source0 = useMemo(() => (slot0 ? { uri: slot0 } : undefined), [slot0]);
  const source1 = useMemo(() => (slot1 ? { uri: slot1 } : undefined), [slot1]);

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={onLayout}
      pointerEvents="none"
      collapsable={false}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.layer,
          visible === 0 ? styles.front : styles.back,
          { transform: [{ translateX: shift0 }] },
        ]}
      >
        {source0 ? (
          <AppImage
            source={source0}
            style={[styles.image, visible === 0 ? styles.front : styles.back]}
            resizeMode="stretch"
            preferRNImage
            fadeDuration={0}
            onLoad={() => promote(0, slot0!)}
          />
        ) : null}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.layer,
          visible === 1 ? styles.front : styles.back,
          { transform: [{ translateX: shift1 }] },
        ]}
      >
        {source1 ? (
          <AppImage
            source={source1}
            style={[styles.image, visible === 1 ? styles.front : styles.back]}
            resizeMode="stretch"
            preferRNImage
            fadeDuration={0}
            onLoad={() => promote(1, slot1!)}
          />
        ) : null}
      </Animated.View>
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
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPECTROGRAM_BG,
  },
  front: {
    zIndex: 1,
  },
  back: {
    zIndex: 0,
  },
});
