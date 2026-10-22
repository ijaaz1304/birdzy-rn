import React from "react";
import { StyleSheet } from "react-native";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { LiveSpectrogramView } from "../../src/features/camera/components/LiveSpectrogramView";
import { logSoundRenderCount } from "../../src/features/camera/utils/soundRecordLog";
import {
  LiveMelSpectrogramEngine,
  LIVE_SPECTROGRAM_FFT_SIZE,
  LIVE_SPECTROGRAM_MEL_BANDS,
} from "../../src/features/camera/utils/liveMelSpectrogram";
import {
  SPECTROGRAM_DISPLAY_MAX_COLUMNS,
  SPECTROGRAM_RECORDED_MAX_COLUMNS,
  SPECTROGRAM_DISPLAY_MEL_BANDS,
} from "../../src/features/camera/constants/soundRecording.constants";

jest.mock("../../src/features/camera/utils/soundRecordLog", () => ({
  logSoundRenderCount: jest.fn(),
}));
jest.mock("../../src/components/AppImage", () => ({ AppImage: "BitmapImage" }));

function bitmapNodes(renderer: ReactTestRenderer) {
  return renderer.root.findAllByType("BitmapImage" as any);
}

function frontBitmap(renderer: ReactTestRenderer) {
  const images = bitmapNodes(renderer);
  return (
    images.find(
      (node) => StyleSheet.flatten(node.props.style).zIndex === 1
    ) ?? images[0]
  );
}

async function promotePending(renderer: ReactTestRenderer) {
  await act(async () => {
    bitmapNodes(renderer).forEach((node) => {
      node.props.onLoad?.({ nativeEvent: { source: node.props.source } });
    });
  });
}

function pngWidth(uri: string) {
  return Buffer.from(uri.split(",")[1], "base64").readUInt32BE(16);
}

function pngHeight(uri: string) {
  return Buffer.from(uri.split(",")[1], "base64").readUInt32BE(20);
}

it("renders one bounded bitmap and does not rebuild it during crop parent updates", async () => {
  let renderer: ReactTestRenderer;
  const columns = Array.from({ length: 500 }, (_, x) =>
    Array.from(
      { length: LIVE_SPECTROGRAM_MEL_BANDS },
      (_, y) => ((x + y) % 100) / 100
    )
  );
  await act(async () => {
    renderer = create(<LiveSpectrogramView columns={columns} />);
  });
  const layout = renderer!.root.findAll(
    (node) => typeof node.props.onLayout === "function"
  )[0];
  await act(async () => {
    layout.props.onLayout({ nativeEvent: { layout: { width: 1000 } } });
  });
  expect(bitmapNodes(renderer!)).toHaveLength(1);
  const liveUri = frontBitmap(renderer!).props.source.uri;
  expect(pngWidth(liveUri)).toBe(SPECTROGRAM_DISPLAY_MAX_COLUMNS);
  expect(pngHeight(liveUri)).toBe(SPECTROGRAM_DISPLAY_MEL_BANDS);
  await act(async () => {
    renderer!.update(
      <LiveSpectrogramView columns={columns} playheadCenter={false} />
    );
  });
  expect(pngWidth(frontBitmap(renderer!).props.source.uri)).toBe(
    SPECTROGRAM_DISPLAY_MAX_COLUMNS
  );
  await promotePending(renderer!);
  const imageSource = frontBitmap(renderer!).props.source;
  expect(pngWidth(imageSource.uri)).toBe(SPECTROGRAM_RECORDED_MAX_COLUMNS);
  const renderCount = (logSoundRenderCount as jest.Mock).mock.calls.length;
  await act(async () => {
    renderer!.update(
      <LiveSpectrogramView columns={columns.slice()} playheadCenter={false} />
    );
  });
  expect(frontBitmap(renderer!).props.source).toBe(imageSource);
  expect((logSoundRenderCount as jest.Mock).mock.calls.length).toBe(
    renderCount
  );
  await act(async () => {
    renderer!.unmount();
  });
});

it("keeps the painted bitmap until the next frame has loaded", async () => {
  let renderer: ReactTestRenderer;
  const columns = Array.from({ length: 8 }, (_, x) =>
    Array.from({ length: LIVE_SPECTROGRAM_MEL_BANDS }, (_, y) =>
      x === 0 && y === 0 ? 1 : 0
    )
  );
  await act(async () => {
    renderer = create(<LiveSpectrogramView columns={columns} />);
  });
  const layout = renderer!.root.findAll(
    (node) => typeof node.props.onLayout === "function"
  )[0];
  await act(async () => {
    layout.props.onLayout({ nativeEvent: { layout: { width: 1000 } } });
  });
  const firstUri = frontBitmap(renderer!).props.source.uri;
  const nextColumns = columns.concat([columns[0].slice()]);
  await act(async () => {
    renderer!.update(<LiveSpectrogramView columns={nextColumns} />);
  });
  expect(bitmapNodes(renderer!).length).toBe(2);
  expect(frontBitmap(renderer!).props.source.uri).toBe(firstUri);
  await promotePending(renderer!);
  expect(frontBitmap(renderer!).props.source.uri).not.toBe(firstUri);
  await act(async () => {
    renderer!.unmount();
  });
});

it("publishes stable shallow snapshots rather than mutating React's previous columns", () => {
  const engine = new LiveMelSpectrogramEngine(10);
  const initial = engine.getColumnsView();
  engine.pushPcm(new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE).fill(1000));
  const next = engine.getColumnsView();
  expect(initial).toHaveLength(0);
  expect(next.length).toBeGreaterThan(0);
  expect(next[0]).toBe(engine.columns[0]);
});
