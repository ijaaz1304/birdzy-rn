import {
  isSpecimenEnumValidationError,
  parseRejectedEnumValues,
  stripRejectedEnumValues,
} from "../../src/services/archetype/specimenEnumSanitizer";

const SERVER_MESSAGE =
  "Specimen validation failed: flightPattern.0: `Mixed` is not a valid enum value for path `flightPattern.0`.";

describe("specimenEnumSanitizer", () => {
  it("reads the rejected value and field from the server message", () => {
    expect(parseRejectedEnumValues(SERVER_MESSAGE)).toEqual([
      { field: "flightPattern", value: "Mixed", path: "flightPattern.0" },
    ]);
    expect(isSpecimenEnumValidationError(SERVER_MESSAGE)).toBe(true);
    expect(isSpecimenEnumValidationError("Network Error")).toBe(false);
    expect(parseRejectedEnumValues(undefined)).toEqual([]);
  });

  it("reads several rejected values, including nested paths", () => {
    const message =
      "Specimen validation failed: flightPattern.1: `Mixed` is not a valid enum value for path `flightPattern.1`., profile.habitat.0: `Rock` is not a valid enum value for path `profile.habitat.0`.";
    expect(parseRejectedEnumValues(message)).toEqual([
      { field: "flightPattern", value: "Mixed", path: "flightPattern.1" },
      { field: "habitat", value: "Rock", path: "profile.habitat.0" },
    ]);
  });

  it("removes only the rejected values and keeps everything else", () => {
    const payload = {
      scientificName: "Accipiter virgatus",
      isWishlisted: true,
      flightPattern: ["Flapping", "Mixed"],
      profile: { habitat: ["Forest", "Rock"], diet: "Mixed" },
    };
    const rejected = parseRejectedEnumValues(SERVER_MESSAGE);
    const { payload: cleaned, changed } = stripRejectedEnumValues(
      payload,
      rejected
    );
    expect(changed).toBe(true);
    expect(cleaned).toEqual({
      scientificName: "Accipiter virgatus",
      isWishlisted: true,
      flightPattern: ["Flapping"],
      // `diet` is a different field, so its "Mixed" is kept.
      profile: { habitat: ["Forest", "Rock"], diet: "Mixed" },
    });
    // Original payload is not mutated.
    expect(payload.flightPattern).toEqual(["Flapping", "Mixed"]);
  });

  it("drops a field whose only value was rejected", () => {
    const { payload, changed } = stripRejectedEnumValues(
      { flightPattern: ["Mixed"], commonName: "Besra" },
      parseRejectedEnumValues(SERVER_MESSAGE)
    );
    expect(changed).toBe(true);
    expect(payload).toEqual({ commonName: "Besra" });
  });

  it("reports no change when the rejected value is absent", () => {
    const { changed } = stripRejectedEnumValues(
      { flightPattern: ["Flapping"] },
      parseRejectedEnumValues(SERVER_MESSAGE)
    );
    expect(changed).toBe(false);
  });
});
