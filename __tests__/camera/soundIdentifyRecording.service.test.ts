import { NativeModules, Platform } from "react-native";
import LiveAudioStream from "react-native-live-audio-fft";
import { LiveMelSpectrogramEngine } from "../../src/features/camera/utils/liveMelSpectrogram";
import { writePcmChunksToWavFile } from "../../src/features/camera/utils/writePcmWav";
import { soundIdentifyRecordingService } from "../../src/services/audio/soundIdentifyRecording.service";

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
  writePcmChunksToWavFile: jest
    .fn()
    .mockResolvedValue("file:///tmp/bird-sound.wav"),
}));

const mockedLiveAudioStream = LiveAudioStream as jest.Mocked<
  typeof LiveAudioStream
>;

describe("soundIdentifyRecording.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NativeModules.RNLiveAudioStream = {};
    Platform.OS = "ios";
  });

  it("registers a single PCM listener on start", async () => {
    await soundIdentifyRecordingService.startRecording();

    expect(mockedLiveAudioStream.init).toHaveBeenCalledTimes(1);
    expect(mockedLiveAudioStream.on).toHaveBeenCalledTimes(1);
    expect(mockedLiveAudioStream.start).toHaveBeenCalledTimes(1);
  });

  it("re-inits PCM stream on Android resume", async () => {
    Platform.OS = "android";
    const resetRecordingBuffer = jest.fn();
    NativeModules.RNLiveAudioStream = { resetRecordingBuffer };

    await soundIdentifyRecordingService.startRecording();
    await soundIdentifyRecordingService.pauseRecording();
    await soundIdentifyRecordingService.resumeRecording();

    expect(resetRecordingBuffer).toHaveBeenCalledTimes(1);
    expect(mockedLiveAudioStream.init).toHaveBeenCalledTimes(2);
    expect(mockedLiveAudioStream.on).toHaveBeenCalledTimes(2);
    expect(mockedLiveAudioStream.start).toHaveBeenCalledTimes(2);
  });

  it("rejects empty PCM on stop", async () => {
    await soundIdentifyRecordingService.startRecording();
    await expect(soundIdentifyRecordingService.stopRecording()).rejects.toThrow(
      /No audio was captured/
    );
  });

  it("skips stop when no session is active", async () => {
    await expect(soundIdentifyRecordingService.stopRecording()).rejects.toThrow(
      /No active recording session/
    );
    expect(soundIdentifyRecordingService.isSessionActive()).toBe(false);
  });
});

it("yields between FFT hops without dropping recorded PCM", async () => {
  jest.useFakeTimers();
  NativeModules.RNLiveAudioStream = {};
  Platform.OS = "ios";
  let clockMs = 10000;
  const clock = jest.spyOn(Date, "now").mockImplementation(() => clockMs);
  const originalPush = LiveMelSpectrogramEngine.prototype.pushPcm;
  const push = jest
    .spyOn(LiveMelSpectrogramEngine.prototype, "pushPcm")
    .mockImplementation(function (
      this: LiveMelSpectrogramEngine,
      pcm: Int16Array
    ) {
      originalPush.call(this, pcm);
      clockMs += 5;
    });
  try {
    await soundIdentifyRecordingService.startRecording();
    const handler = mockedLiveAudioStream.on.mock.calls.at(-1)![1] as (
      data: string
    ) => void;
    const pcm = Int16Array.from({ length: 8192 }, (_, i) =>
      Math.round(Math.sin(i * 0.15) * 12000)
    );
    handler(Buffer.from(pcm.buffer).toString("base64"));
    expect(push).not.toHaveBeenCalled();
    jest.advanceTimersToNextTimer();
    expect(push).toHaveBeenCalledTimes(2);
    expect(push.mock.calls.every(([chunk]) => chunk.length <= 512)).toBe(true);
    jest.runAllTimers();
    expect(push).toHaveBeenCalledTimes(16);
    const expected = new LiveMelSpectrogramEngine(200);
    originalPush.call(expected, pcm);
    expect(soundIdentifyRecordingService.getSpectrogramColumnsView()).toEqual(
      expected.getColumnsView()
    );
    await soundIdentifyRecordingService.stopRecording();
    expect(writePcmChunksToWavFile).toHaveBeenLastCalledWith(
      [pcm],
      22050,
      1,
      expect.stringMatching(/^bird-sound-.*\.wav$/)
    );
  } finally {
    push.mockRestore();
    clock.mockRestore();
    jest.useRealTimers();
  }
});
