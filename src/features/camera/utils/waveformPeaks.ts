const MIN_BAR = 0.14;

/** Downsample mel columns into centered waveform bar heights (0–1). */
export function waveformPeaksFromColumns(
  columns: number[][],
  barCount = 72
): number[] {
  if (barCount <= 0) return [];
  if (!columns.length) return fallbackWaveformPeaks(barCount);

  const energies = new Array<number>(columns.length);
  let loudest = 0;
  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    const bands = column?.length ?? 0;
    let sum = 0;
    for (let band = 0; band < bands; band += 1) sum += column[band] ?? 0;
    const energy = bands > 0 ? sum / bands : 0;
    energies[i] = energy;
    if (energy > loudest) loudest = energy;
  }

  const peaks = new Array<number>(barCount);
  for (let i = 0; i < barCount; i += 1) {
    const start = Math.floor((i * energies.length) / barCount);
    const end = Math.max(
      start + 1,
      Math.floor(((i + 1) * energies.length) / barCount)
    );
    let max = 0;
    for (let j = start; j < end && j < energies.length; j += 1) {
      if (energies[j] > max) max = energies[j];
    }
    const normalized = loudest > 0 ? max / loudest : 0;
    peaks[i] = MIN_BAR + Math.min(1, normalized) * (1 - MIN_BAR);
  }
  return peaks;
}

function fallbackWaveformPeaks(barCount: number): number[] {
  return Array.from({ length: barCount }, (_, index) => {
    const t = index / Math.max(1, barCount - 1);
    const wave =
      0.22 +
      0.42 * Math.abs(Math.sin(t * Math.PI * 7)) +
      0.18 * Math.abs(Math.sin(t * Math.PI * 2));
    return Math.min(1, Math.max(MIN_BAR, wave));
  });
}
