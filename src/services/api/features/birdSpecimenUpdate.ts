/** Bird PATCH keys are flattened, unlike POST specimen bodies. */
export function flattenBirdSpecimenUpdate(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const nestedKeys = [
    "scientificClassification",
    "birdWatchingTips",
    "rangeDetails",
    "potentialHazards",
    "profile",
  ] as const;

  const allowed = new Set([
    "commonName",
    "scientificName",
    "summary",
    "wikipediaLink",
    "birdType",
    "customLocation",
    "userCapturedSounds",
    "flightPattern",
    "flightSpeed",
    "flightAltitude",
    "diet",
    "habitat",
    "lifeExpectancyInWild",
    "conservationStatus",
    "funFacts",
    "lengthRange",
    "wingspanRange",
    "weightRange",
    "keyIdentificationMarks",
    "dominantColors",
    "sexDifferences",
    "isIdentified",
    "isOwned",
    "matchScore",
    "_collections",
    "_archetype",
    "scientificClassification.kingdom",
    "scientificClassification.phylum",
    "scientificClassification.class",
    "scientificClassification.order",
    "scientificClassification.family",
    "scientificClassification.genus",
    "scientificClassification.species",
    "birdWatchingTips.bestTime",
    "birdWatchingTips.preferredLocations",
    "birdWatchingTips.behavioralCues",
    "potentialHazards.toHumans",
    "potentialHazards.toPets",
    "potentialHazards.tobirds",
    "rangeDetails.yearRound",
    "rangeDetails.migration",
    "rangeDetails.breeding",
    "rangeDetails.nonBreeding",
    "profile.size",
    "profile.familyDescription",
    "profile.shape",
    "profile.beak",
    "profile.tailShape",
    "profile.legCharacteristics",
    "profile.feedingBehavior",
    "profile.vocalBehavior",
    "profile.territoriality",
    "profile.socialBehavior",
    "profile.dietType",
    "profile.feedingStyle",
    "profile.breedingSeason",
    "profile.nestType",
    "profile.nestingMaterial",
    "profile.parentalCare",
    "profile.residentStatus",
    "profile.migrationPath",
    "profile.seasonalPresence",
  ]);

  const out: Record<string, unknown> = {};
  const assign = (key: string, value: unknown) => {
    if (!allowed.has(key)) return;
    if (value === undefined || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  };

  for (const prefix of nestedKeys) {
    const nested = payload[prefix];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      for (const [key, value] of Object.entries(
        nested as Record<string, unknown>
      )) {
        assign(`${prefix}.${key}`, value);
      }
    }
  }

  if (payload.isWishlisted === false) {
    out.isWishlisted = false;
  }

  for (const [key, value] of Object.entries(payload)) {
    if ((nestedKeys as readonly string[]).includes(key)) continue;
    if (key === "isWishlisted") continue;
    assign(key, value);
  }

  return out;
}
