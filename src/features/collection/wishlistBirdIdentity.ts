import { archetypeService } from "../../services/archetype/archetype.service";
import {
  catalogueItemMatchesBird,
  useBirdsStore,
} from "../catalogue/birds.store";
import type { MushroomListItem } from "../../types/mushrooms.types";

export type WishlistBird = {
  /** Archetype ID as the screen resolved it — may be missing or a specimen ID. */
  archetypeId?: string | null;
  /** The Wishlist specimen being removed. */
  specimenId?: string | null;
  birdsLifeId?: string | null;
  scientificName?: string | null;
};

/**
 * Wishlist specimens from /core/specimen/fetchAll and getDetails may not carry
 * `_archetype`, and the specimen's own `_id` then ends up as the "archetype"
 * ID (seen on device: DELETE …/wishlist/remove/<specimenId>). A specimen ID is
 * never an archetype ID, so treat it as unknown.
 */
export function usableArchetypeId(bird: WishlistBird): string | undefined {
  const id = bird.archetypeId?.trim();
  if (!id) return undefined;
  if (bird.specimenId && id === String(bird.specimenId).trim()) return undefined;
  return id;
}

/**
 * The catalogue (archetype) ID for a Wishlist bird: the screen's ID when it is
 * usable, else a loaded catalogue card of the same species, else a catalogue
 * search by scientific name matched on BirdLife ID / scientific name.
 */
export async function resolveCatalogueArchetypeId(
  bird: WishlistBird
): Promise<string | undefined> {
  const direct = usableArchetypeId(bird);
  if (direct) return direct;
  if (!bird.birdsLifeId && !bird.scientificName) return undefined;

  const loaded = useBirdsStore
    .getState()
    .mushrooms.find((m) => catalogueItemMatchesBird(m, bird));
  if (loaded?.archetypeId) return loaded.archetypeId;

  const query = bird.scientificName?.trim();
  if (!query) return undefined;
  try {
    const { data } = await archetypeService.fetchAllArchetypes(undefined, {
      pageNo: 0,
      pageSize: 10,
      search: query,
    });
    const match = (data as unknown as MushroomListItem[]).find((m) =>
      catalogueItemMatchesBird(m, bird)
    );
    return match?.archetypeId ?? undefined;
  } catch {
    return undefined;
  }
}
