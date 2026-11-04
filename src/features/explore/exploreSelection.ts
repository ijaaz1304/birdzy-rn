import type { ExploreArchetypeCard } from "@/features/explore/services/explore.api.types";

/** Map features identify observations; only their BirdLife IDs can match list species. */
export function cardsForMapSelection(
  cards: ExploreArchetypeCard[],
  selectedBirdsLifeIds: ReadonlySet<string> | null
): ExploreArchetypeCard[] {
  return selectedBirdsLifeIds
    ? cards.filter((card) => selectedBirdsLifeIds.has(card.birdsLifeId))
    : cards;
}
