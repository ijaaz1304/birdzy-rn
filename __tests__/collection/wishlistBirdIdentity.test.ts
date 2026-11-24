/**
 * Device log (2026-11-24): removing "Acanthis flammea" from Wishlist details
 * sent DELETE /core/archetypes/wishlist/remove/6b0527dfe8e545019ffc3ff3 — the
 * specimen ID, because the specimen had no `_archetype`. The Catalogue card's
 * real archetype ID was never un-starred.
 */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("../../src/services/archetype/archetype.service", () => ({
  archetypeService: { fetchAllArchetypes: jest.fn() },
}));
jest.mock("../../src/lib/repositories/mushrooms.repository", () => ({
  mushroomsRepository: {},
}));
jest.mock("../../src/services/analytics/analytics.service", () => ({
  analyticsService: { logEvent: jest.fn() },
}));

import { archetypeService } from "../../src/services/archetype/archetype.service";
import { useBirdsStore } from "../../src/features/catalogue/birds.store";
import {
  resolveCatalogueArchetypeId,
  usableArchetypeId,
} from "../../src/features/collection/wishlistBirdIdentity";

const fetchAll = jest.mocked(archetypeService.fetchAllArchetypes);
const SPECIMEN = "6b0527dfe8e545019ffc3ff3";
const ARCHETYPE = "6a61f6c55db631270434b001";
const redpoll = {
  archetypeId: ARCHETYPE,
  birdsLifeId: "22725044",
  scientificName: "Acanthis flammea",
  commonName: "Common Redpoll",
  isWishlisted: true,
};
const owl = {
  archetypeId: "6a61f6c55db631270434b999",
  birdsLifeId: "22688500",
  scientificName: "Bubo bubo",
  isWishlisted: true,
};
const fromDevice = {
  archetypeId: SPECIMEN, // what the details screen resolved
  specimenId: SPECIMEN,
  birdsLifeId: "22725044",
  scientificName: "Acanthis flammea",
};

/** Same rule CatalogueScreen uses to fill the star. */
const starFilled = (id: string) => {
  const s = useBirdsStore.getState();
  const item = s.mushrooms.find((m) => m.archetypeId === id);
  return s.suppressedWishlistIds.includes(id)
    ? false
    : s.favorites.includes(id) || item?.isWishlisted === true;
};

beforeEach(() => {
  fetchAll.mockReset();
  useBirdsStore.setState({
    mushrooms: [redpoll, owl] as never,
    favorites: [ARCHETYPE, owl.archetypeId],
    suppressedWishlistIds: [],
  });
});

test("a specimen ID is never used as the archetype ID", () => {
  expect(usableArchetypeId(fromDevice)).toBeUndefined();
  expect(usableArchetypeId({ ...fromDevice, archetypeId: ARCHETYPE })).toBe(
    ARCHETYPE
  );
});

test("the real archetype ID comes from the loaded catalogue card", async () => {
  await expect(resolveCatalogueArchetypeId(fromDevice)).resolves.toBe(ARCHETYPE);
  expect(fetchAll).not.toHaveBeenCalled();
});

test("when the card isn't loaded, the catalogue is searched by scientific name", async () => {
  useBirdsStore.setState({ mushrooms: [] });
  fetchAll.mockResolvedValue({
    data: [{ ...redpoll, archetypeId: "other", birdsLifeId: "999" }, redpoll],
    pagination: { pageNo: 0, pageSize: 10, totalCount: 2 },
  } as never);
  await expect(resolveCatalogueArchetypeId(fromDevice)).resolves.toBe(ARCHETYPE);
  expect(fetchAll).toHaveBeenCalledWith(undefined, {
    pageNo: 0,
    pageSize: 10,
    search: "Acanthis flammea",
  });
});

test("the device case: removing by specimen ID still empties the Catalogue star", () => {
  expect(starFilled(ARCHETYPE)).toBe(true);
  // Before: removeFavorite(SPECIMEN) left the card starred.
  useBirdsStore.getState().removeFavorite(SPECIMEN);
  expect(starFilled(ARCHETYPE)).toBe(true);
  // Now: matched by BirdLife ID.
  const cleared = useBirdsStore
    .getState()
    .removeFavoriteForBird({ ...fromDevice, archetypeId: undefined });
  expect(cleared).toEqual([ARCHETYPE]);
  expect(starFilled(ARCHETYPE)).toBe(false);
  expect(starFilled(owl.archetypeId)).toBe(true); // other birds untouched
});

test("without a BirdLife ID, an exact scientific name match is used", () => {
  useBirdsStore.setState({
    mushrooms: [{ ...redpoll, birdsLifeId: undefined }] as never,
  });
  useBirdsStore.getState().removeFavoriteForBird({
    scientificName: "acanthis flammea ",
  });
  expect(starFilled(ARCHETYPE)).toBe(false);
});
