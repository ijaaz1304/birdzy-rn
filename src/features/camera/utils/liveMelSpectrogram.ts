import { createLiveFft } from "./liveFft";
import {
  isSoundPerfEnabled,
  soundPerfNow,
  soundPerfRecordTiming,
} from "./soundPerf";

export const LIVE_SPECTROGRAM_SAMPLE_RATE = 22050;
export const LIVE_SPECTROGRAM_FFT_SIZE = 2048;
export const LIVE_SPECTROGRAM_MEL_BANDS = 48;
const MIN_HZ = 200;
const MAX_HZ = 8000;

const fft = createLiveFft(LIVE_SPECTROGRAM_FFT_SIZE);

/** Precomputed mel filter weights [band][bin]. */
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
): number[][] {
  const binCount = fftSize / 2;
  const melMin = hzToMel(fMin);
  const melMax = hzToMel(fMax);
  const melPoints = Array.from({ length: nMels + 2 }, (_, i) => {
    const mel = melMin + (i * (melMax - melMin)) / (nMels + 1);
    return Math.floor((melToHz(mel) * fftSize) / sampleRate);
  });

  const filters: number[][] = [];
  for (let m = 0; m < nMels; m += 1) {
    const start = melPoints[m];
    const center = melPoints[m + 1];
    const end = melPoints[m + 2];
    const row = new Array<number>(binCount).fill(0);

    for (let k = start; k < center; k += 1) {
      if (k >= 0 && k < binCount && center !== start) {
        row[k] = (k - start) / (center - start);
      }
    }
    for (let k = center; k < end; k += 1) {
      if (k >= 0 && k < binCount && end !== center) {
        row[k] = (end - k) / (end - center);
      }
    }
    filters.push(row);
  }
  return filters;
}

export class LiveMelSpectrogramEngine {
  private pcmRing = new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE);
  private frame = new Int16Array(LIVE_SPECTROGRAM_FFT_SIZE);
  private melScratch = new Array<number>(LIVE_SPECTROGRAM_MEL_BANDS).fill(0);
  private columnScratch = new Array<number>(LIVE_SPECTROGRAM_MEL_BANDS).fill(0);
  private ringWrite = 0;
  private hopCounter = 0;
  /** Each column: mel band energies normalized 0–1 (low freq = index 0). */
  readonly columns: number[][] = [];
  readonly maxColumns: number;

  constructor(maxColumns = 160) {
    this.maxColumns = maxColumns;
  }

  /** Shallow view for live UI — column arrays are immutable once pushed. */
  getColumnsView(): number[][] {
    return this.columns;
  }

  /** Deep copy for export after recording (survives engine reset). */
  getColumnsSnapshot(): number[][] {
    return this.columns.map((column) => column.slice());
  }

  reset(): void {
    this.pcmRing.fill(0);
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
        this.pcmRing[(this.ringWrite + i) % LIVE_SPECTROGRAM_FFT_SIZE];
    }

    const fftStart = perf ? soundPerfNow() : 0;
    const spectrum = fft.transform(this.frame);
    if (perf) {
      soundPerfRecordTiming("FFT", soundPerfNow() - fftStart);
    }

    const melStart = perf ? soundPerfNow() : 0;
    const mel = this.melScratch;

    for (let band = 0; band < LIVE_SPECTROGRAM_MEL_BANDS; band += 1) {
      let energy = 0;
      const weights = melFilters[band];
      for (let bin = 0; bin < weights.length; bin += 1) {
        energy += (spectrum[bin] ?? 0) * weights[bin];
      }
      mel[band] = energy;
    }

    let peak = 1e-9;
    let floor = Infinity;
    for (let i = 0; i < mel.length; i += 1) {
      const v = mel[i] ?? 0;
      if (v > peak) peak = v;
      if (v < floor) floor = v;
    }
    const span = peak - floor;
    const normalized = this.columnScratch;
    for (let i = 0; i < mel.length; i += 1) {
      if (span < 1e-6) {
        normalized[i] = 0;
      } else {
        const x = Math.max(0, ((mel[i] ?? 0) - floor) / span);
        normalized[i] = Math.min(1, x ** 0.72);
      }
    }

    for (let i = 0, j = normalized.length - 1; i < j; i += 1, j -= 1) {
      const tmp = normalized[i] ?? 0;
      normalized[i] = normalized[j] ?? 0;
      normalized[j] = tmp;
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
