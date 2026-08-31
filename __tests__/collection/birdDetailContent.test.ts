import {
  birdColorChips,
  birdSoundLabel,
  deriveBirdSizeScale,
  parseLengthCm,
} from "../../src/features/collection/utils/birdDetailContent";

describe("parseLengthCm", () => {
  it("reads the first number from a range", () => {
    expect(parseLengthCm("14–16 cm")).toBe(14);
    expect(parseLengthCm("16 cm")).toBe(16);
  });
});

describe("deriveBirdSizeScale", () => {
  it("maps sparrow-length birds to Small", () => {
    const size = deriveBirdSizeScale("14–16 cm");
    expect(size?.label).toBe("Small");
    expect(size?.index).toBe(1);
  });

  it("prefers an explicit API size label", () => {
    const size = deriveBirdSizeScale("16 cm", "Very small");
    expect(size?.label).toBe("Very small");
    expect(size?.index).toBe(0);
  });
});

describe("birdColorChips", () => {
  it("attaches a swatch hex for named colors", () => {
    const chips = birdColorChips(["Brown", "Grey", "White"]);
    expect(chips.map((chip) => chip.label)).toEqual([
      "Brown",
      "Grey",
      "White",
    ]);
    expect(chips[0].hex).toBe("#8B5A2B");
  });
});

describe("birdSoundLabel", () => {
  it("uses Songs or Calls when the url hints at the type", () => {
    expect(birdSoundLabel("https://cdn.example/song-a.mp3", 0)).toBe(
      "Songs 1"
    );
    expect(birdSoundLabel("https://cdn.example/call-b.mp3", 1)).toBe(
      "Calls 2"
    );
  });
});
