/** High-resolution spectrogram rendered as one lossless native bitmap. */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PixelRatio,
  StyleSheet,
  View,
} from "react-native";
import { AppImage } from "../../../components/AppImage";
import {
  LIVE_SPECTROGRAM_WINDOW_COLUMNS,
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

import {
  LIVE_SPECTROGRAM_FFT_SIZE,
  LIVE_SPECTROGRAM_SAMPLE_RATE,
} from "../utils/liveMelSpectrogram";

// Follow audio time, not the UI notification rate: native PCM arrives in batches.
const COLUMN_MS =
  (1000 * (LIVE_SPECTROGRAM_FFT_SIZE / 4)) / LIVE_SPECTROGRAM_SAMPLE_RATE;
type Frame = { uri: string; columns: number[][]; live: boolean; width: number };

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
  const shownFrame = useRef<Frame | undefined>(undefined);
  const pendingFrame = useRef<Frame | undefined>(undefined);
  const latestFrame = useRef<Frame | undefined>(undefined);
  const animating = useRef(false);
  const mounted = useRef(true);
  const [revision, setRevision] = useState(0);
  const layoutWidthRef = useRef(0);
  const shift0 = useRef(new Animated.Value(0)).current;
  const shift1 = useRef(new Animated.Value(0)).current;
  const shifts = useRef([shift0, shift1]).current;

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

  latestFrame.current = nextUri
    ? { uri: nextUri, columns, live: playheadCenter, width: bitmapWidth }
    : undefined;

  useLayoutEffect(() => {
    const frame = latestFrame.current;
    if (!frame) {
      pendingFrame.current = undefined;
      shownFrame.current = undefined;
      animating.current = false;
      shifts.forEach((shift) => {
        shift.stopAnimation();
        shift.setValue(0);
      });
      setSlot0(undefined);
      setSlot1(undefined);
      return;
    }
    // Never replace an image while it is decoding or moving. Coalesce updates
    // into the latest frame instead of starving onLoad on slower devices.
    if (pendingFrame.current || animating.current) return;
    if (frame.uri === shownFrame.current?.uri) {
      shownFrame.current = frame;
      return;
    }
    pendingFrame.current = frame;
    const slot = shownFrame.current ? (visibleRef.current === 0 ? 1 : 0) : 0;
    shifts[slot].setValue(0);
    if (slot === 0) setSlot0(frame.uri);
    else setSlot1(frame.uri);
  }, [nextUri, columns, revision, shifts]);

  const promote = useCallback(
    (slot: 0 | 1, uri: string) => {
      const frame = pendingFrame.current;
      if (!frame || frame.uri !== uri) return;
      const previous = shownFrame.current;
      pendingFrame.current = undefined;
      shownFrame.current = frame;
      visibleRef.current = slot;
      setVisible(slot);

      // Column references survive the rolling-window trim; array length does not
      // tell us how far audio advanced once the history reaches its cap.
      const last = previous?.columns[previous.columns.length - 1];
      const previousIndex = last ? frame.columns.lastIndexOf(last) : -1;
      const delta =
        previousIndex >= 0 ? frame.columns.length - previousIndex - 1 : 0;
      const slots = Math.min(frame.width, LIVE_SPECTROGRAM_WINDOW_COLUMNS);
      const shift = shifts[slot];
      if (
        previous?.live &&
        frame.live &&
        previous.width === frame.width &&
        delta > 0 &&
        delta < slots
      ) {
        animating.current = true;
        shift.setValue((delta / slots) * layoutWidthRef.current);
        Animated.timing(shift, {
          toValue: 0,
          duration: Math.min(delta * COLUMN_MS, 250),
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          animating.current = false;
          if (mounted.current) setRevision((value) => value + 1);
        });
      } else {
        shift.setValue(0);
        setRevision((value) => value + 1);
      }
    },
    [shifts]
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      shifts.forEach((shift) => shift.stopAnimation());
    };
  }, [shifts]);

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
