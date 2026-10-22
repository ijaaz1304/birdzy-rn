import { createLiveFft } from "./liveFft";
import {
  isSoundPerfEnabled,
  soundPerfNow,
  soundPerfRecordTiming,
} from "./soundPerf";

export const LIVE_SPECTROGRAM_SAMPLE_RATE = 22050;
export const LIVE_SPECTROGRAM_FFT_SIZE = 2048;
export const LIVE_SPECTROGRAM_MEL_BANDS = 128;
const MIN_HZ = 200;
const MAX_HZ = 8000;

const hannWindow = Float64Array.from(
  { length: LIVE_SPECTROGRAM_FFT_SIZE },
  (_, i) =>
    0.5 * (1 - Math.cos((2 * Math.PI * i) / (LIVE_SPECTROGRAM_FFT_SIZE - 1)))
);
// Full-scale sine power after the Hann window (coherent gain ≈ 0.5).
const FULL_SCALE_POWER = ((32768 * LIVE_SPECTROGRAM_FFT_SIZE) / 4) ** 2;
const DISPLAY_FLOOR_DB = -80;
const DISPLAY_CEILING_DB = -15;

const fft = createLiveFft(LIVE_SPECTROGRAM_FFT_SIZE);

/** Store only nonzero filter bins; most FFT bins are outside each mel band. */
const melFilters = buildMelFilters(
  LIVE_SPECTROGRAM_FFT_SIZE,
  LIVE_SPECTROGRAM_SAMPLE_RATE,
  LIVE_SPECTROGRAM_MEL_BANDS,
  MIN_HZ,
  MAX_HZ
);

function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700);
}

function melToHz(mel: number): number {
  return 700 * (10 ** (mel / 2595) - 1);
}

function buildMelFilters(
  fftSize: number,
  sampleRate: number,
  nMels: number,
  fMin: number,
  fMax: number
): Array<Array<{ bin: number; weight: number }>> {
  const binCount = fftSize / 2;
  const melMin = hzToMel(fMin);
  const melMax = hzToMel(fMax);
  const melPoints = Array.from({ length: nMels + 2 }, (_, i) => {
    const mel = melMin + (i * (melMax - melMin)) / (nMels + 1);
    return Math.floor((melToHz(mel) * fftSize) / sampleRate);
  });

  const filters: Array<Array<{ bin: number; weight: number }>> = [];
  for (let m = 0; m < nMels; m += 1) {
    const start = melPoints[m];
    const center = melPoints[m + 1];
    const end = melPoints[m + 2];
    const row: Array<{ bin: number; weight: number }> = [];

    for (let k = start; k < center; k += 1) {
      if (k >= 0 && k < binCount && center !== start) {
        if (k > start)
          row.push({ bin: k, weight: (k - start) / (center - start) });
      }
    }
    for (let k = center; k < end; k += 1) {
      if (k >= 0 && k < binCount && end !== center) {
        row.push({ bin: k, weight: (end - k) / (end - center) });
      }
    }
    // Normalize filter area so wide high-frequency bands do not look louder.
    const weightSum = row.reduce((sum, item) => sum + item.weight, 0);
    if (weightSum > 0)
      row.forEach((item) => {
        item.weight /= weightSum;
      });
    filters.push(row);
  }
  return filters;
}

/** Fast attack, slower decay — keeps brief calls visible without sparkle. */
const DISPLAY_RELEASE = 0.72;

export class LiveMelSpectrogramEngine {
  private pcmRing = new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE);
  private frame = new Float64Array(LIVE_SPECTROGRAM_FFT_SIZE);
  private columnScratch = new Array<number>(LIVE_SPECTROGRAM_MEL_BANDS).fill(0);
  private smoothed = new Float64Array(LIVE_SPECTROGRAM_MEL_BANDS);
  private ringWrite = 0;
  private hopCounter = 0;
  /** Each column: mel band energies normalized 0–1 (high freq = index 0; low freq at the bottom). */
  readonly columns: number[][] = [];
  readonly maxColumns: number;

  constructor(maxColumns = 160) {
    this.maxColumns = maxColumns;
  }

  /** Shallow view for live UI — column arrays are immutable once pushed. */
  getColumnsView(maxColumns = this.maxColumns): number[][] {
    return this.columns.slice(-maxColumns);
  }

  /** Deep copy for export after recording (survives engine reset). */
  getColumnsSnapshot(): number[][] {
    return this.columns.map((column) => column.slice());
  }

  reset(): void {
    this.pcmRing.fill(0);
    this.smoothed.fill(0);
    this.ringWrite = 0;
    this.hopCounter = 0;
    this.columns.length = 0;
  }

  pushPcm(pcm: Int16Array): void {
    for (let i = 0; i < pcm.length; i += 1) {
      this.pcmRing[this.ringWrite] = pcm[i];
      this.ringWrite = (this.ringWrite + 1) % LIVE_SPECTROGRAM_FFT_SIZE;
      this.hopCounter += 1;

      if (this.hopCounter >= LIVE_SPECTROGRAM_FFT_SIZE / 4) {
        this.hopCounter = 0;
        const column = this.computeColumn();
        if (column) {
          this.columns.push(column);
          if (this.columns.length > this.maxColumns) {
            this.columns.shift();
          }
        }
      }
    }
  }

  private computeColumn(): number[] | null {
    const perf = isSoundPerfEnabled();

    for (let i = 0; i < LIVE_SPECTROGRAM_FFT_SIZE; i += 1) {
      this.frame[i] =
        this.pcmRing[(this.ringWrite + i) % LIVE_SPECTROGRAM_FFT_SIZE] *
        hannWindow[i];
    }

    const fftStart = perf ? soundPerfNow() : 0;
    const spectrum = fft.transform(this.frame);
    if (perf) {
      soundPerfRecordTiming("FFT", soundPerfNow() - fftStart);
    }

    const melStart = perf ? soundPerfNow() : 0;
    const normalized = this.columnScratch;

    for (let band = 0; band < LIVE_SPECTROGRAM_MEL_BANDS; band += 1) {
      let energy = 0;
      const weights = melFilters[band];
      for (let i = 0; i < weights.length; i += 1) {
        const { bin, weight } = weights[i];
        energy += (spectrum[bin] ?? 0) * weight;
      }
      const db = 10 * Math.log10(Math.max(energy / FULL_SCALE_POWER, 1e-12));
      const mapped = Math.min(
        1,
        Math.max(
          0,
          (db - DISPLAY_FLOOR_DB) / (DISPLAY_CEILING_DB - DISPLAY_FLOOR_DB)
        )
      );
      const displayIndex = LIVE_SPECTROGRAM_MEL_BANDS - band - 1;
      const previous = this.smoothed[displayIndex];
      const released =
        mapped >= previous
          ? mapped
          : previous * DISPLAY_RELEASE + mapped * (1 - DISPLAY_RELEASE);
      this.smoothed[displayIndex] = released;
      normalized[displayIndex] = released;
    }

    if (perf) {
      soundPerfRecordTiming("Mel", soundPerfNow() - melStart);
    }
    return normalized.slice();
  }
}

export function pcmDbFromSum(sum: number, length: number): number {
  if (length <= 0) return -160;
  const peak = sum / length;
  const val = Math.max(0.1, peak);
  const pref = 0x7fff;
  return Math.max(-100, Math.round((20 * Math.log(val / pref)) / Math.log(10)));
}

export { decodePcmFromBase64 } from "./decodePcmBase64";
