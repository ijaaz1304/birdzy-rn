import { createLiveFft } from "../../src/features/camera/utils/liveFft";

it("reports a known tone at its actual FFT bin", () => {
  const size = 2048;
  const bin = 137;
  const pcm = Float64Array.from(
    { length: size },
    (_, i) => 1000 * Math.sin((2 * Math.PI * bin * i) / size)
  );
  const spectrum = createLiveFft(size).transform(pcm);
  const peak = Math.max(...spectrum);
  expect(spectrum.indexOf(peak)).toBe(bin);
  expect(peak / ((1000 * size) / 2) ** 2).toBeCloseTo(1, 8);
});

it("retains low-amplitude spectral power instead of hard-clipping it", () => {
  const size = 2048;
  const pcm = Float64Array.from(
    { length: size },
    (_, i) => 0.5 * Math.sin((2 * Math.PI * 200 * i) / size)
  );
  expect(createLiveFft(size).transform(pcm)[200]).toBeGreaterThan(0);
});
