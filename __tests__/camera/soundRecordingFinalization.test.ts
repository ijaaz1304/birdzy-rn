import React from "react";
import ReactTestRenderer from "react-test-renderer";
import { NativeModules, Platform } from "react-native";
import LiveAudioStream from "react-native-live-audio-fft";
import { useBirdRecording } from "../../src/features/camera/hooks/useBirdRecording";
import { soundIdentifyRecordingService } from "../../src/services/audio/soundIdentifyRecording.service";
import { writePcmChunksToWavFile } from "../../src/features/camera/utils/writePcmWav";

jest.mock("react-native-live-audio-fft", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    start: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  },
}));

jest.mock("../../src/services/audio/soundRecording.service", () => ({
  soundRecordingService: {
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    elapsedRecordingSeconds: jest.fn(),
  },
}));

jest.mock("../../src/services/permissions", () => ({
  checkMicrophonePermission: jest.fn().mockResolvedValue({ granted: true }),
  requestMicrophonePermission: jest.fn(),
}));

jest.mock("../../src/features/camera/utils/writePcmWav", () => ({
  writePcmChunksToWavFile: jest.fn(),
}));

const mockedWriteWav = writePcmChunksToWavFile as jest.MockedFunction<
  typeof writePcmChunksToWavFile
>;
const mockedLiveAudioStream = LiveAudioStream as jest.Mocked<typeof LiveAudioStream>;

function encodePcmBase64(samples: number[]): string {
  const pcm = new Int16Array(samples);
  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

describe("sound recording finalization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NativeModules.RNLiveAudioStream = {};
    Platform.OS = "ios";
    mockedWriteWav.mockResolvedValue("file:///tmp/bird-sound.wav");
  });

  it("writes WAV before returning URI from stopRecording", async () => {
    const order: string[] = [];
    mockedWriteWav.mockImplementation(async () => {
      order.push("write-wav");
      return "file:///tmp/bird-sound.wav";
    });

    await soundIdentifyRecordingService.startRecording();
    const pcmHandler = mockedLiveAudioStream.on.mock.calls[0]?.[1] as
      | ((base64: string) => void)
      | undefined;
    expect(pcmHandler).toBeDefined();
    pcmHandler?.(
      encodePcmBase64(Array.from({ length: 4096 }, (_, i) => Math.sin(i) * 1000))
    );

    const uri = await soundIdentifyRecordingService.stopRecording();
    expect(order).toEqual(["write-wav"]);
    expect(uri).toBe("file:///tmp/bird-sound.wav");
  });

  it("does not call onRecordingComplete until finalizeRecordingFile resolves", async () => {
    let resolveFinalize: ((uri: string) => void) | undefined;
    const stopNativeSpy = jest
      .spyOn(soundIdentifyRecordingService, "stopNativeCapture")
      .mockResolvedValue(undefined);
    const finalizeSpy = jest
      .spyOn(soundIdentifyRecordingService, "finalizeRecordingFile")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFinalize = resolve;
          })
      );
    jest
      .spyOn(soundIdentifyRecordingService, "startRecording")
      .mockResolvedValue(undefined);
    jest
      .spyOn(soundIdentifyRecordingService, "elapsedRecordingSeconds")
      .mockReturnValue(12);

    const onRecordingComplete = jest.fn();
    let api: ReturnType<typeof useBirdRecording> | null = null;

    function Probe() {
      api = useBirdRecording({ onRecordingComplete });
      return null;
    }

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(React.createElement(Probe));
    });

    await ReactTestRenderer.act(async () => {
      await api!.beginRecording();
    });

    await ReactTestRenderer.act(async () => {
      void api!.stopAndFinalize();
    });

    expect(onRecordingComplete).not.toHaveBeenCalled();
    expect(stopNativeSpy).toHaveBeenCalled();
    expect(finalizeSpy).toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      resolveFinalize!("file:///tmp/final.wav");
      await Promise.resolve();
    });

    expect(onRecordingComplete).toHaveBeenCalledWith(
      "file:///tmp/final.wav",
      12,
      expect.any(Array)
    );

    stopNativeSpy.mockRestore();
    finalizeSpy.mockRestore();
  });
});
