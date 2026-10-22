jest.mock("react-native-audio-recorder-player", () => {
  const player = {
    startPlayer: jest.fn().mockResolvedValue("ok"),
    stopPlayer: jest.fn().mockResolvedValue("ok"),
    setVolume: jest.fn().mockResolvedValue("ok"),
    addPlayBackListener: jest.fn(),
    removePlayBackListener: jest.fn(),
    addPlaybackEndListener: jest.fn(),
    removePlaybackEndListener: jest.fn(),
    mmss: jest.fn((secs: number) => String(secs)),
  };
  return {
    __esModule: true,
    default: player,
    ...player,
  };
});

jest.mock("react-native-fs", () => ({
  CachesDirectoryPath: "/tmp",
}));

jest.mock("../../src/services/permissions", () => ({
  checkMicrophonePermission: jest.fn(),
  requestMicrophonePermission: jest.fn(),
}));

import AudioRecorderPlayer from "react-native-audio-recorder-player";
import { soundRecordingService } from "../../src/services/audio/soundRecording.service";

const mockPlayer = AudioRecorderPlayer as jest.Mocked<typeof AudioRecorderPlayer>;

describe("sound playback latency", () => {
  beforeEach(async () => {
    mockPlayer.startPlayer.mockResolvedValue("ok");
    mockPlayer.stopPlayer.mockResolvedValue("ok");
    mockPlayer.setVolume.mockResolvedValue("ok");
    await soundRecordingService.stopPlayback();
    jest.clearAllMocks();
  });

  it("does not occupy the player probing remote sounds", async () => {
    const sec = await soundRecordingService.probeDurationSec(
      "https://cdn.example/song.mp3"
    );
    expect(sec).toBeUndefined();
    expect(mockPlayer.startPlayer).not.toHaveBeenCalled();
    expect(mockPlayer.stopPlayer).not.toHaveBeenCalled();
  });

  it("starts playback immediately when idle", async () => {
    await soundRecordingService.play("https://cdn.example/call.mp3");
    expect(mockPlayer.setVolume).toHaveBeenCalledWith(1);
    expect(mockPlayer.stopPlayer).not.toHaveBeenCalled();
    expect(mockPlayer.startPlayer).toHaveBeenCalledTimes(1);
    expect(mockPlayer.startPlayer).toHaveBeenCalledWith(
      "https://cdn.example/call.mp3"
    );
  });

  it("lets a play tap cancel a local duration probe without waiting", async () => {
    let releaseProbe: (value: string) => void = () => {};
    mockPlayer.startPlayer.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseProbe = resolve;
        })
    );

    const probe = soundRecordingService.probeDurationSec("file://clip.m4a");
    for (let i = 0; i < 20 && mockPlayer.startPlayer.mock.calls.length === 0; i += 1) {
      await Promise.resolve();
    }
    expect(mockPlayer.startPlayer).toHaveBeenCalledTimes(1);

    mockPlayer.startPlayer.mockResolvedValue("ok");
    await soundRecordingService.play("https://cdn.example/call.mp3");
    releaseProbe("ok");
    await probe;

    expect(mockPlayer.startPlayer).toHaveBeenLastCalledWith(
      "https://cdn.example/call.mp3"
    );
  });
});
