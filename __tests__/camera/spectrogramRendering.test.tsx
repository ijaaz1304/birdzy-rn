import { logSoundRenderCount } from "../../src/features/camera/utils/soundRecordLog";
import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { LiveSpectrogramView } from "../../src/features/camera/components/LiveSpectrogramView";
import {
  LiveMelSpectrogramEngine,
  LIVE_SPECTROGRAM_FFT_SIZE,
} from "../../src/features/camera/utils/liveMelSpectrogram";
import {
  SPECTROGRAM_DISPLAY_MAX_COLUMNS,
  SPECTROGRAM_DISPLAY_MEL_BANDS,
} from "../../src/features/camera/constants/soundRecording.constants";

jest.mock("../../src/features/camera/utils/soundRecordLog", () => ({
  logSoundRenderCount: jest.fn(),
}));

jest.mock("react-native-svg", () => ({
  __esModule: true,
  default: "Svg",
  Rect: "Rect",
  Line: "Line",
}));

it("keeps the live SVG bounded and leaves a recorded graph unchanged during parent updates", async () => {
  let renderer: ReactTestRenderer;
  let columns: number[][] = [];
  await act(async () => {
    renderer = create(<LiveSpectrogramView columns={columns} />);
  });
  const layout = renderer!.root.findAll(
    (node) => typeof node.props.onLayout === "function"
  )[0];
  await act(async () => {
    layout.props.onLayout({ nativeEvent: { layout: { width: 300 } } });
  });
  for (let i = 0; i < 140; i += 1) {
    columns = [...columns, new Array(48).fill(i / 140)];
    await act(async () => {
      renderer!.update(<LiveSpectrogramView columns={columns} />);
    });
    const rects = renderer!.root.findAllByType("Rect" as any);
    expect(rects.length).toBeLessThanOrEqual(
      1 +
        (Math.floor(SPECTROGRAM_DISPLAY_MAX_COLUMNS / 2) + 1) *
          SPECTROGRAM_DISPLAY_MEL_BANDS
    );
  }
  await act(async () => {
    renderer!.update(
      <LiveSpectrogramView columns={columns} playheadCenter={false} />
    );
  });
  const rendersAfterStop = (logSoundRenderCount as jest.Mock).mock.calls.length;
  const recordedRects = renderer!.root
    .findAllByType("Rect" as any)
    .map((node) => node.props);
  await act(async () => {
    renderer!.update(
      <LiveSpectrogramView columns={columns} playheadCenter={false} />
    );
  });
  expect((logSoundRenderCount as jest.Mock).mock.calls.length).toBe(
    rendersAfterStop
  );
  expect(
    renderer!.root.findAllByType("Rect" as any).map((node) => node.props)
  ).toEqual(recordedRects);
  await act(async () => {
    renderer!.unmount();
  });
});

it("publishes stable shallow snapshots rather than mutating React's previous columns", () => {
  const engine = new LiveMelSpectrogramEngine(10);
  const initial = engine.getColumnsView();
  const tone = new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE).fill(1000);
  engine.pushPcm(tone);
  const next = engine.getColumnsView();
  expect(initial).toHaveLength(0);
  expect(next.length).toBeGreaterThan(0);
  expect(next).not.toBe(initial);
  expect(next[0]).toBe(engine.columns[0]);
});
