import { NativeModules, Platform } from "react-native";
import LiveAudioStream from "react-native-live-audio-fft";
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

const mockedLiveAudioStream = LiveAudioStream as jest.Mocked<typeof LiveAudioStream>;

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

    await soundIdentifyRecordingService.startRecording();
    await soundIdentifyRecordingService.pauseRecording();
    await soundIdentifyRecordingService.resumeRecording();

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
