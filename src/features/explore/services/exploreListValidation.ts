import type { ExploreNearYouResponse } from "./explore.api.types";
/** Validate the Bird contract without assuming Mushroom fields or a v2 endpoint. */
export function validateExploreList(payload: unknown): ExploreNearYouResponse {
  const response = payload as ExploreNearYouResponse | null;
  const integer = (value: unknown, min = 0) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= min;
  const id = (value: unknown) =>
    typeof value === "string" && value.trim().length > 0;
  if (
    !response ||
    !Array.isArray(response.data) ||
    !response.pagination ||
    !response.tabs ||
    !integer(response.pagination.pageNo, 1) ||
    !integer(response.pagination.pageSize, 1) ||
    !integer(response.pagination.totalCount) ||
    ![response.tabs.spottedNowCount, response.tabs.yearRoundCount].every(
      (count) => integer(count)
    ) ||
    !response.data.every(
      (card) =>
        card &&
        id(card.archetypeId) &&
        id(card.birdsLifeId) &&
        typeof card.scientificName === "string" &&
        (card.commonName == null || typeof card.commonName === "string") &&
        (card.defaultImageUrl == null ||
          typeof card.defaultImageUrl === "string") &&
        (card.imageUrls == null || Array.isArray(card.imageUrls)) &&
        typeof card.isWishlisted === "boolean" &&
        typeof card.isSpottedNow === "boolean"
    )
  )
    throw new Error("Unable to load nearby birds: invalid list response.");
  const cards = [
    ...new Map(response.data.map((card) => [card.archetypeId, card])).values(),
  ];
  return cards.length === response.data.length
    ? response
    : { ...response, data: cards };
}
