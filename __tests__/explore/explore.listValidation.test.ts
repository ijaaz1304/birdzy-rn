import { validateExploreList } from "../../src/features/explore/services/exploreListValidation";
const card = {
  archetypeId: "one",
  birdsLifeId: "123",
  scientificName: "Avis test",
  commonName: null,
  defaultImageUrl: "https://example.com/bird.jpg",
  imageUrls: [],
  isWishlisted: false,
  isSpottedNow: true,
};
const response = () => ({
  data: [card],
  tabs: { spottedNowCount: 1, yearRoundCount: 2 },
  pagination: { pageNo: 1, pageSize: 20, totalCount: 2 },
});
test("validates Bird IDs/counts and deduplicates without changing server totals", () => {
  const value = response();
  const validated = validateExploreList({ ...value, data: [card, card] });
  expect(validated.data).toHaveLength(1);
  expect(validated.pagination.totalCount).toBe(2);
});
test.each([NaN, Infinity, -1, "2"])(
  "rejects invalid pagination totals %s",
  (totalCount) => {
    const value = response();
    expect(() =>
      validateExploreList({
        ...value,
        pagination: { ...value.pagination, totalCount },
      })
    ).toThrow("invalid list response");
  }
);
test("Mushroom identifiers cannot substitute for BirdLife identity", () => {
  expect(() =>
    validateExploreList({
      ...response(),
      data: [{ ...card, birdsLifeId: undefined, gbifId: "123" }],
    })
  ).toThrow("invalid list response");
});
test("rejects malformed native photo values while allowing genuine empty results", () => {
  expect(() =>
    validateExploreList({
      ...response(),
      data: [{ ...card, defaultImageUrl: 123 }],
    })
  ).toThrow("invalid list response");
  expect(validateExploreList({ ...response(), data: [] }).data).toEqual([]);
});
