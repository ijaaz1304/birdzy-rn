import {
  buildMushroomSpecimenAddPayload,
  buildMushroomUpdatePayload,
  flattenBirdSpecimenUpdate,
} from "../../src/features/collection/editMushroomDetails.utils";

describe("bird specimen API payloads", () => {
  it("flattens nested classification and watching tips for PATCH", () => {
    const flat = flattenBirdSpecimenUpdate({
      commonName: "House Sparrow",
      scientificName: "Passer domesticus",
      scientificClassification: {
        kingdom: "Animalia",
        family: "Passeridae",
      },
      birdWatchingTips: {
        bestTime: "Dawn",
        preferredLocations: "Towns",
      },
      capShape: "should-not-appear",
      imageUrls: ["https://example.com/a.jpg"],
      isWishlisted: true,
    });

    expect(flat).toEqual({
      commonName: "House Sparrow",
      scientificName: "Passer domesticus",
      "scientificClassification.kingdom": "Animalia",
      "scientificClassification.family": "Passeridae",
      "birdWatchingTips.bestTime": "Dawn",
      "birdWatchingTips.preferredLocations": "Towns",
    });
  });

  it("keeps isWishlisted only when it is being cleared", () => {
    expect(flattenBirdSpecimenUpdate({ isWishlisted: false })).toEqual({
      isWishlisted: false,
    });
  });

  it("builds a PATCH body from the edit form without mushroom-only fields", () => {
    const payload = buildMushroomUpdatePayload({
      commonName: "Wattled Guan",
      scientificName: "Aburria aburri",
      summary: "A large cracid.",
      images: [],
      scientificClassification: { kingdom: "Animalia", class: "Aves" },
      bestTimeToWatch: "Morning",
      capShape: "convex",
    });

    expect(payload["scientificClassification.kingdom"]).toBe("Animalia");
    expect(payload["birdWatchingTips.bestTime"]).toBe("Morning");
    expect(payload).not.toHaveProperty("capShape");
    expect(payload).not.toHaveProperty("imageUrls");
    expect(payload).not.toHaveProperty("commonNames");
  });

  it("builds POST /specimen/add without requiring gbif/mindat ids", () => {
    const payload = buildMushroomSpecimenAddPayload(
      {
        scientificName: "Aburria aburri",
        commonName: "Wattled Guan",
        birdsLifeId: "22678440",
        soundUrls: ["https://example.com/call.mp3"],
        imageUrls: ["https://example.com/bird.jpg"],
      },
      {
        commonName: "Wattled Guan",
        scientificName: "Aburria aburri",
        images: [],
      },
      "6a61f6c55db631270434ae85",
      {
        collectionIds: ["6a69ed932ed077f191c80368"],
        userCapturedSounds: ["https://example.com/user.mp3"],
        comment: "Heard near the lake",
      }
    );

    expect(payload.scientificName).toBe("Aburria aburri");
    expect(payload.imageUrls).toEqual(["https://example.com/bird.jpg"]);
    expect(payload._collections).toEqual(["6a69ed932ed077f191c80368"]);
    expect(payload).not.toHaveProperty("gbifId");
    expect(payload).not.toHaveProperty("mindatId");
    expect((payload as { userCapturedSounds?: string[] }).userCapturedSounds).toEqual([
      "https://example.com/user.mp3",
    ]);
    expect((payload as { comment?: string }).comment).toBe("Heard near the lake");
    expect((payload as { birdsLifeId?: string }).birdsLifeId).toBe("22678440");
  });
});
