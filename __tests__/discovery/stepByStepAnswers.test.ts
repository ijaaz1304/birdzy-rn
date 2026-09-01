import {
  buildWizardAnswerRows,
  formatWizardDate,
  hasWizardQuestionAnswer,
  toWizardSeenDateIso,
  wizardQuestionTitle,
  wizardSizeApiValue,
  wizardSizeDisplay,
} from "../../src/features/discovery/utils/stepByStepAnswers";
import {
  mapStepByStepItemToPossibleMatch,
} from "../../src/features/discovery/utils/mapStepByStepMatches";
import type { MushroomArchetypeListItem } from "../../src/services/api/features/core.api.types";
import type { WizardAnswers } from "../../src/features/discovery/stepByStep.types";

const answers: WizardAnswers = {
  location: {
    label: "Bangalore, Karnataka",
    latitude: 12.97,
    longitude: 77.59,
  },
  seenDate: "2025-05-12",
  sizeIndex: 1,
  colors: [],
  habitat: null,
};

describe("wizardQuestionTitle", () => {
  it("uses the real question count", () => {
    expect(wizardQuestionTitle(0, "Where did you see this bird")).toBe(
      "Question 1/3: Where did you see this bird"
    );
  });
});

describe("formatWizardDate", () => {
  it("formats an ordinal date like the Figma answers row", () => {
    expect(formatWizardDate("2025-05-12")).toBe("12th May, 2025");
  });
});

describe("toWizardSeenDateIso", () => {
  it("converts a calendar date into the API ISO datetime", () => {
    expect(toWizardSeenDateIso("2026-06-26")).toBe("2026-06-26T10:00:00Z");
  });
});

describe("wizardSizeDisplay", () => {
  it("includes the label and centimetre range", () => {
    expect(wizardSizeDisplay(1)).toBe("Small (11–16 cm)");
  });
});

describe("wizardSizeApiValue", () => {
  it("maps the 7-point scale onto API birdSize labels", () => {
    expect(wizardSizeApiValue(0)).toBe("Very Small");
    expect(wizardSizeApiValue(3)).toBe("Medium");
    expect(wizardSizeApiValue(6)).toBe("Unknown");
  });
});

describe("hasWizardQuestionAnswer", () => {
  it("requires a selection for location and size", () => {
    expect(hasWizardQuestionAnswer("location", answers)).toBe(true);
    expect(
      hasWizardQuestionAnswer("size", { ...answers, sizeIndex: null })
    ).toBe(false);
  });
});

describe("buildWizardAnswerRows", () => {
  it("builds numbered rows for answered questions", () => {
    const rows = buildWizardAnswerRows(answers);
    expect(rows.map((row) => row.title)).toEqual([
      "Where did you see it?",
      "When did you see it?",
      "Size",
    ]);
    expect(rows[0].value).toBe("Bangalore, Karnataka");
    expect(rows[2].value).toBe("Small (11–16 cm)");
  });
});

describe("mapStepByStepItemToPossibleMatch", () => {
  it("maps nearby archetype rows onto possible-match cards", () => {
    const item = {
      archetypeId: "house-sparrow",
      scientificName: "Passer domesticus",
      commonNames: ["House Sparrow"],
      imageUrls: ["https://cdn.example/sparrow.jpg"],
      defaultImageUrl: "https://cdn.example/sparrow.jpg",
      isIdentified: false,
      isWishlisted: false,
      score: 0.7,
    } as MushroomArchetypeListItem & { score: number };

    const match = mapStepByStepItemToPossibleMatch(item);
    expect(match.id).toBe("house-sparrow");
    expect(match.name).toBe("House Sparrow");
    expect(match.accuracy).toBe(70);
    expect(match.image).toBe("https://cdn.example/sparrow.jpg");
  });
});
