import {
  LiveMelSpectrogramEngine,
  LIVE_SPECTROGRAM_FFT_SIZE,
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
    expect(engine.columns[0]?.length).toBe(48);
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
