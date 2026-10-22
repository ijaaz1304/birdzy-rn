import {
  LiveMelSpectrogramEngine,
  LIVE_SPECTROGRAM_FFT_SIZE,
  LIVE_SPECTROGRAM_MEL_BANDS,
  decodePcmFromBase64,
  pcmDbFromSum,
} from "../../src/features/camera/utils/liveMelSpectrogram";

describe("liveMelSpectrogram", () => {
  it("produces mel columns from PCM", () => {
    const engine = new LiveMelSpectrogramEngine(20);
    const tone = new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE);
    for (let i = 0; i < tone.length; i += 1) {
      tone[i] = Math.round(Math.sin((i / 40) * Math.PI * 2) * 12000);
    }
    engine.pushPcm(tone);
    expect(engine.columns.length).toBeGreaterThan(0);
    expect(engine.columns[0]?.length).toBe(LIVE_SPECTROGRAM_MEL_BANDS);
  });

  it("maps pcm sum to dBFS", () => {
    expect(pcmDbFromSum(0, 100)).toBeLessThanOrEqual(-90);
    expect(pcmDbFromSum(100000, 100)).toBeGreaterThan(-50);
  });

  it("decodes little-endian PCM from base64", () => {
    const input = new Int16Array([100, -200, 300]);
    const bytes = new Uint8Array(input.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = globalThis.btoa(binary);
    const { pcmData, sum } = decodePcmFromBase64(base64);
    expect(Array.from(pcmData)).toEqual(Array.from(input));
    expect(sum).toBe(100 + 200 + 300);
  });

  it("returns immutable column snapshots", () => {
    const engine = new LiveMelSpectrogramEngine(5);
    const tone = new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE);
    for (let i = 0; i < tone.length; i += 1) {
      tone[i] = Math.round(Math.sin((i / 40) * Math.PI * 2) * 12000);
    }
    engine.pushPcm(tone);
    const snapshot = engine.getColumnsSnapshot();
    snapshot.push([1, 2, 3]);
    expect(engine.columns.length).toBe(snapshot.length - 1);
  });

  it("caps column history at maxColumns", () => {
    const engine = new LiveMelSpectrogramEngine(3);
    const tone = new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE);
    for (let i = 0; i < tone.length; i += 1) {
      tone[i] = Math.round(Math.sin((i / 40) * Math.PI * 2) * 12000);
    }
    for (let i = 0; i < 20; i += 1) {
      engine.pushPcm(tone);
    }
    expect(engine.columns.length).toBeLessThanOrEqual(3);
  });

  it("keeps silence columns low-intensity", () => {
    const engine = new LiveMelSpectrogramEngine(10);
    const silence = new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE);
    for (let i = 0; i < 8; i += 1) {
      engine.pushPcm(silence);
    }
    const last = engine.columns.at(-1);
    expect(last).toBeDefined();
    expect(Math.max(...(last ?? [1]))).toBeLessThan(0.2);
  });
});

it("keeps frequency output identical when PCM processing yields between hops", () => {
  const pcm = Int16Array.from({ length: 8192 }, (_, i) =>
    Math.round(12000 * Math.sin(i * 0.15))
  );
  const whole = new LiveMelSpectrogramEngine(40);
  const sliced = new LiveMelSpectrogramEngine(40);
  whole.pushPcm(pcm);
  for (let i = 0; i < pcm.length; i += 512) {
    sliced.pushPcm(pcm.subarray(i, i + 512));
  }
  expect(sliced.getColumnsSnapshot()).toEqual(whole.getColumnsSnapshot());
});

it("preserves quiet calls with logarithmic contrast without amplifying silence", () => {
  const peakForAmplitude = (amplitude: number) => {
    const engine = new LiveMelSpectrogramEngine(20);
    engine.pushPcm(
      Int16Array.from({ length: 4096 }, (_, i) =>
        Math.round(amplitude * Math.sin((2 * Math.PI * 3000 * i) / 22050))
      )
    );
    return Math.max(...engine.columns.at(-1)!);
  };
  expect(peakForAmplitude(0)).toBe(0);
  expect(peakForAmplitude(100)).toBeGreaterThan(0.15);
  expect(peakForAmplitude(100)).toBeLessThan(peakForAmplitude(1000));
});

it("holds brief peaks instead of dropping them on the next silent hop", () => {
  const engine = new LiveMelSpectrogramEngine(20);
  const tone = Int16Array.from({ length: LIVE_SPECTROGRAM_FFT_SIZE }, (_, i) =>
    Math.round(12000 * Math.sin((2 * Math.PI * 3000 * i) / 22050))
  );
  engine.pushPcm(tone);
  const peak = Math.max(...engine.columns.at(-1)!);
  engine.pushPcm(new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE));
  const after = Math.max(...engine.columns.at(-1)!);
  expect(peak).toBeGreaterThan(0.2);
  expect(after).toBeGreaterThan(peak * 0.2);
  expect(after).toBeLessThan(peak);
});

it("retains the start of longer recordings while returning only a small live tail", () => {
  const engine = new LiveMelSpectrogramEngine(2600);
  engine.pushPcm(new Int16Array(22050 * 6));
  const first = engine.columns[0];
  engine.pushPcm(new Int16Array(22050 * 6));
  expect(engine.getColumnsSnapshot().length).toBeGreaterThan(500);
  expect(engine.columns[0]).toBe(first);
  expect(engine.getColumnsView(240)).toHaveLength(240);
});
