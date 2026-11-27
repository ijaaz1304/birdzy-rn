import { formatBirdPhotoReply } from "../../src/features/ask-ai/utils/birdPhotoReply";
import { normalizeBirdIdentifyResponseLegacy } from "../../src/utils/birdApiMappers";

const normalized = (commonName?: string, summary?: string) =>
  normalizeBirdIdentifyResponseLegacy({
    error: false,
    data: {
      imageUrls: [],
      matches: [
        {
          _id: "bird",
          birdsLifeId: "123",
          commonName,
          scientificName: "Passer domesticus",
          summary,
        },
      ],
    },
  }).matches[0];

test("uses the actual normalized Bird display name and nested summary", () => {
  const match = normalized("House Sparrow", "Common near human settlements.");
  expect(formatBirdPhotoReply(match)).toBe(
    "This looks like a House Sparrow (Passer domesticus). Common near human settlements."
  );
});
test("falls back to the scientific name without repeating it", () => {
  expect(formatBirdPhotoReply(normalized())).toBe(
    "This looks like a Passer domesticus."
  );
});
test("omits an empty summary and trims the normalized fields", () => {
  expect(
    formatBirdPhotoReply({
      name: " House Sparrow ",
      scientificName: " Passer domesticus ",
      match: { _id: "bird", summary: " " },
    })
  ).toBe("This looks like a House Sparrow (Passer domesticus).");
});
test("retains the no-match message when no identification is available", () => {
  expect(formatBirdPhotoReply(undefined)).toBe(
    "I couldn't match that photo to a bird. Try a clearer picture."
  );
  expect(formatBirdPhotoReply({ name: " ", scientificName: " " })).toBe(
    "I couldn't match that photo to a bird. Try a clearer picture."
  );
});
