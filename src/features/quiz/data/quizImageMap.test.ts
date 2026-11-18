jest.mock("../../../assets", () => ({
  QUIZ_BIRD_LOCAL_IMAGES: { porcini: 101, reishi: 102 },
}));

import {
  getQuizArchetypeImageMap,
  getQuizArchetypeImageSources,
  getQuizResultDisplaySource,
} from "./quizImageMap";

describe("bird quiz artwork", () => {
  it("uses curated bird sources for legacy archetype IDs", () => {
    expect(getQuizResultDisplaySource("porcini")).toBe(101);
    expect(getQuizArchetypeImageSources()).toEqual({
      porcini: 101,
      reishi: 102,
    });
  });

  it("does not expose inherited mushroom URLs as remote fallbacks", () => {
    expect(getQuizArchetypeImageMap()).toEqual({});
    expect(getQuizResultDisplaySource("unknown")).toBeUndefined();
  });
});
