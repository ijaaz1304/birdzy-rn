declare module "react-native-live-audio-fft" {
  export interface LiveAudioStreamOptions {
    sampleRate?: number;
    channels?: 1 | 2;
    bitsPerSample?: 8 | 16;
    audioSource?: number;
    bufferSize?: number;
  }

  export function NativeRecordReceivePCM(pcmDataBase64: string): {
    pcmData: Int16Array;
    sum: number;
  };

  export function PowerDBFS(maxSample: number): number;

  const LiveAudioStream: {
    init: (options: LiveAudioStreamOptions) => void;
    start: () => void;
    stop: () => Promise<void>;
    on: (event: "data", callback: (data: string) => void) => void;
  };

  export default LiveAudioStream;
}

declare module "react-native-live-audio-fft/lib.fft.js" {
  export default function createFft(bufferSize: number): {
    bufferSize: number;
    transform: (inBuffer: Int16Array | number[]) => number[];
  };
}