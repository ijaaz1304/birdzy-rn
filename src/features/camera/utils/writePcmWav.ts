import { Platform } from "react-native";
import RNFS from "react-native-fs";
import { isSoundPerfEnabled, soundPerfNow, soundPerfRecordTiming } from "./soundPerf";

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

/** Chunked base64 encode — avoids O(n²) byte-by-byte string concat. */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  if (typeof globalThis.btoa !== "function") {
    throw new Error("btoa is unavailable — cannot write WAV file.");
  }
  return globalThis.btoa(binary);
}

export async function writePcmChunksToWavFile(
  chunks: Int16Array[],
  sampleRate: number,
  channels: number,
  fileName: string
): Promise<string> {
  const perf = isSoundPerfEnabled();
  const writeStart = perf ? soundPerfNow() : 0;

  const totalSamples = chunks.reduce((acc, c) => acc + c.length, 0);
  const pcm = new Int16Array(totalSamples);
  let offset = 0;
  for (const chunk of chunks) {
    pcm.set(chunk, offset);
    offset += chunk.length;
  }

  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = pcm.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const pcmBytes = new Int16Array(buffer, 44);
  pcmBytes.set(pcm);

  const path = `${RNFS.CachesDirectoryPath}/${fileName}`;
  const base64 = arrayBufferToBase64(buffer);
  await RNFS.writeFile(path, base64, "base64");

  if (perf) {
    soundPerfRecordTiming("WavFinalization", soundPerfNow() - writeStart);
  }

  return Platform.OS === "ios" ? path : `file://${path}`;
}
