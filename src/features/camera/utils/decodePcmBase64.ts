/**
 * Fast base64 → little-endian Int16 PCM decode (RN-safe, no Node Buffer).
 */

export function decodePcmFromBase64(
  pcmDataBase64: string,
  reuseOut?: Int16Array
): { pcmData: Int16Array; sum: number } {
  if (typeof globalThis.atob !== "function") {
    throw new Error("atob is unavailable — cannot decode PCM audio.");
  }

  const bstr = globalThis.atob(pcmDataBase64);
  const byteLen = bstr.length;
  const sampleCount = byteLen / 2;
  const pcm =
    reuseOut && reuseOut.length >= sampleCount
      ? reuseOut
      : new Int16Array(sampleCount);

  let sum = 0;
  for (let idx = 0, i = 0; i + 1 < byteLen; idx += 1, i += 2) {
    const s =
      ((bstr.charCodeAt(i) | (bstr.charCodeAt(i + 1) << 8)) << 16) >> 16;
    pcm[idx] = s;
    sum += Math.abs(s);
  }

  return {
    pcmData: pcm.subarray(0, sampleCount),
    sum,
  };
}
