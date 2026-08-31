import {
  buildBirdSoundListItems,
  formatBirdSoundDuration,
} from "../../src/features/collection/utils/birdSoundListItems";

describe("formatBirdSoundDuration", () => {
  it("formats seconds as mm:ss", () => {
    expect(formatBirdSoundDuration(12)).toBe("00:12");
    expect(formatBirdSoundDuration(72)).toBe("01:12");
  });
});

describe("buildBirdSoundListItems", () => {
  it("lists user recordings first with badge metadata", () => {
    const items = buildBirdSoundListItems({
      userCapturedSounds: ["https://cdn.example/user.mp3"],
      soundUrls: [
        "https://cdn.example/song-a.mp3",
        "https://cdn.example/call-b.mp3",
      ],
      customLocation: "San Francisco",
      createdAt: "2024-06-23T12:20:00.000Z",
    });

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      title: "Sample",
      isUserRecording: true,
      metaLine: expect.stringContaining("San Francisco"),
    });
    expect(items[1].title).toBe("Songs 1");
    expect(items[2].title).toBe("Calls 1");
  });

  it("dedupes catalog urls that match user recordings", () => {
    const url = "https://cdn.example/user.mp3";
    const items = buildBirdSoundListItems({
      userCapturedSounds: [url],
      soundUrls: [url, "https://cdn.example/song-a.mp3"],
    });

    expect(items).toHaveLength(2);
    expect(items[0].url).toBe(url);
    expect(items[1].title).toBe("Songs 1");
  });
});
