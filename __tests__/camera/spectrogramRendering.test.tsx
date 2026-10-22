import React from "react";
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
  const images = renderer!.root.findAllByType("BitmapImage" as any);
  expect(images).toHaveLength(1);
  const liveBytes = Buffer.from(
    images[0].props.source.uri.split(",")[1],
    "base64"
  );
  expect(liveBytes.readUInt32BE(16)).toBe(SPECTROGRAM_DISPLAY_MAX_COLUMNS);
  expect(liveBytes.readUInt32BE(20)).toBe(SPECTROGRAM_DISPLAY_MEL_BANDS);
  await act(async () => {
    renderer!.update(
      <LiveSpectrogramView columns={columns} playheadCenter={false} />
    );
  });
  const imageSource = renderer!.root.findByType("BitmapImage" as any).props
    .source;
  const cropBytes = Buffer.from(imageSource.uri.split(",")[1], "base64");
  expect(cropBytes.readUInt32BE(16)).toBe(SPECTROGRAM_RECORDED_MAX_COLUMNS);
  const renderCount = (logSoundRenderCount as jest.Mock).mock.calls.length;
  await act(async () => {
    renderer!.update(
      <LiveSpectrogramView columns={columns.slice()} playheadCenter={false} />
    );
  });
  expect(renderer!.root.findByType("BitmapImage" as any).props.source).toBe(
    imageSource
  );
  expect((logSoundRenderCount as jest.Mock).mock.calls.length).toBe(
    renderCount
  );
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
