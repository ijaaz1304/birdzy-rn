/**
 * FFT for live spectrogram (from Recorder lib.fft.js / jmp123).
 */

export function createLiveFft(bufferSize: number): {
  bufferSize: number;
  transform: (inBuffer: Int16Array | number[]) => Float64Array;
} {
  let FFT_N_LOG: number;
  let FFT_N: number;
  let MINY: number;
  let real: number[];
  let imag: number[];
  let sintable: number[];
  let costable: number[];
  let bitReverse: number[];

  FFT_N_LOG = Math.round(Math.log(bufferSize) / Math.log(2));
  FFT_N = 1 << FFT_N_LOG;
  MINY = (FFT_N << 2) * Math.sqrt(2);

  real = [];
  imag = [];
  sintable = [0];
  costable = [0];
  bitReverse = [];

  for (let i = 0; i < FFT_N; i += 1) {
    let k = i;
    let reve = 0;
    for (let j = 0; j !== FFT_N_LOG; j += 1) {
      reve <<= 1;
      reve |= k & 1;
      k >>>= 1;
    }
    bitReverse[i] = reve;
  }

  const dt = (2 * Math.PI) / FFT_N;
  for (let i = (FFT_N >> 1) - 1; i > 0; i -= 1) {
    const theta = i * dt;
    costable[i] = Math.cos(theta);
    sintable[i] = Math.sin(theta);
  }

  let transformOutBuffer: Float64Array | null = new Float64Array(FFT_N >> 1);

  const transform = (inBuffer: Int16Array | number[]): Float64Array => {
    let j0 = 1;
    let idx = FFT_N_LOG - 1;

    for (let i = 0; i !== FFT_N; i += 1) {
      real[i] = inBuffer[bitReverse[i]];
      imag[i] = 0;
    }

    for (let i = FFT_N_LOG; i !== 0; i -= 1) {
      for (let j = 0; j !== j0; j += 1) {
        const cosv = costable[j << idx];
        const sinv = sintable[j << idx];
        for (let k = j; k < FFT_N; k += j0 << 1) {
          const ir = k + j0;
          const tmpr = cosv * real[ir] - sinv * imag[ir];
          const tmpi = cosv * imag[ir] + sinv * real[ir];
          real[ir] = real[k] - tmpr;
          imag[ir] = imag[k] - tmpi;
          real[k] += tmpr;
          imag[k] += tmpi;
        }
      }
      j0 <<= 1;
      idx -= 1;
    }

    const j = FFT_N >> 1;
    const outBuffer = transformOutBuffer ?? new Float64Array(j);
    transformOutBuffer = outBuffer;
    const sinThreshold = MINY;
    const cosThreshold = -MINY;

    for (let i = j; i !== 0; i -= 1) {
      const tmpr = real[i];
      const tmpi = imag[i];
      if (
        tmpr > cosThreshold &&
        tmpr < sinThreshold &&
        tmpi > cosThreshold &&
        tmpi < sinThreshold
      ) {
        outBuffer[i - 1] = 0;
      } else {
        outBuffer[i - 1] = Math.round(tmpr * tmpr + tmpi * tmpi);
      }
    }

    return outBuffer;
  };

  return { transform, bufferSize: FFT_N };
}
