jest.mock("../../src/features/collection/collection.utils", () => {
  const looksLikeMongoCollectionId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

  return {
    normalizeCollectionIds: (
      ...sources: Array<string | string[] | undefined | null>
    ) => {
      const out: string[] = [];
      const seen = new Set<string>();
      for (const src of sources) {
        const list = Array.isArray(src) ? src : src != null ? [src] : [];
        for (const raw of list) {
          const id = String(raw ?? "").trim();
          if (!id || !looksLikeMongoCollectionId(id) || seen.has(id)) continue;
          seen.add(id);
          out.push(id);
        }
      }
      return out;
    },
  };
});

import {
  buildMushroomSpecimenAddPayload,
  buildMushroomUpdatePayload,
  flattenBirdSpecimenUpdate,
} from "../../src/features/collection/editMushroomDetails.utils";

describe("bird specimen API payloads", () => {
  it("preserves explicit empty editable lists while excluding immutable images", () => {
    expect(
      flattenBirdSpecimenUpdate({
        _collections: [],
        userCapturedSounds: [],
        habitat: [],
        imageUrls: [],
        commonName: undefined,
      })
    ).toEqual({ _collections: [], userCapturedSounds: [], habitat: [] });
  });
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
        flightPattern: ["Undulating"],
        soundUrls: ["https://example.com/call.mp3"],
        imageUrls: ["https://example.com/bird.jpg"],
      },
      {
        commonName: "Wattled Guan",
        scientificName: "Aburria aburri",
        flightPattern: "Undulating",
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

    const withUserPhoto = buildMushroomSpecimenAddPayload(
      {
        scientificName: "Aburria aburri",
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
        userPhotoUrl:
          "https://storage.googleapis.com/birdzy-app.firebasestorage.app/posts/images/specimen-capture-1.jpg",
      }
    );
    expect(withUserPhoto.imageUrls?.[0]).toBe(
      "https://storage.googleapis.com/birdzy-app.firebasestorage.app/posts/images/specimen-capture-1.jpg"
    );
    expect(
      (withUserPhoto as { userCapturedImages?: string[] })
        .userCapturedImages?.[0]
    ).toBe(
      "https://storage.googleapis.com/birdzy-app.firebasestorage.app/posts/images/specimen-capture-1.jpg"
    );
    expect(withUserPhoto).not.toHaveProperty("localCaptureUri");
    expect(payload._collections).toEqual(["6a69ed932ed077f191c80368"]);
    expect(payload.flightPattern).toEqual(["Undulating"]);
    expect(payload).not.toHaveProperty("gbifId");
    expect(payload).not.toHaveProperty("mindatId");
    expect(
      (payload as { userCapturedSounds?: string[] }).userCapturedSounds
    ).toEqual(["https://example.com/user.mp3"]);
    expect((payload as { comment?: string }).comment).toBe(
      "Heard near the lake"
    );
    expect((payload as { birdsLifeId?: string }).birdsLifeId).toBe("22678440");
  });
});

it("preserves bird metadata on POST and nests edited classification and watching tips", () => {
  const payload = buildMushroomSpecimenAddPayload(
    {
      scientificName: "Passer domesticus",
      imageUrls: ["https://example.com/bird.jpg"],
      scientificClassification: { kingdom: "Animalia", family: "Passeridae" },
      birdWatchingTips: { bestTime: "Day", behavioralCues: "Flocking" },
      rangeDetails: { yearRound: "Europe" },
      funFacts: ["Social bird"],
    },
    {
      scientificName: "Passer domesticus",
      images: [],
      scientificClassification: {
        kingdom: "Animalia",
        family: "Edited family",
      },
      bestTimeToWatch: "Dawn",
    },
    "id"
  );
  expect(payload.scientificClassification).toMatchObject({
    family: "Edited family",
  });
  expect(payload.birdWatchingTips).toMatchObject({
    bestTime: "Dawn",
    behavioralCues: "Flocking",
  });
  expect(payload.rangeDetails).toEqual({ yearRound: "Europe" });
  expect(payload.funFacts).toEqual(["Social bird"]);
  expect(payload._collections).toEqual([]);
  expect(Object.keys(payload)).not.toContain("scientificClassification.family");
});
