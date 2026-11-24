/**
 * Catalogue star ↔ Wishlist removal: after removing a bird in Collection →
 * Wishlist, the Catalogue star for it must be empty, including when the
 * catalogue list is re-read and the backend still briefly reports it as
 * wishlisted, and when the removal happens while a list read is in flight.
 */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
jest.mock("../../src/lib/repositories/mushrooms.repository", () => ({
  mushroomsRepository: {
    getMushrooms: jest.fn(),
    toggleFavorite: jest.fn(),
    searchMushrooms: jest.fn(),
    filterMushrooms: jest.fn(),
  },
}));
jest.mock("../../src/services/analytics/analytics.service", () => ({
  analyticsService: { logEvent: jest.fn() },
}));

import { mushroomsRepository } from "../../src/lib/repositories/mushrooms.repository";
import { useBirdsStore } from "../../src/features/catalogue/birds.store";

const getMushrooms = jest.mocked(mushroomsRepository.getMushrooms);
const toggleFavorite = jest.mocked(mushroomsRepository.toggleFavorite);
const ROBIN = "arch-robin";

const page = (isWishlisted: boolean) =>
  ({
    data: [{ archetypeId: ROBIN, commonName: "Robin", isWishlisted }],
    pagination: { pageNo: 0, pageSize: 10, totalCount: 1 },
  }) as never;

/** Same rule CatalogueScreen uses to fill the star. */
const catalogueStarFilled = () => {
  const s = useBirdsStore.getState();
  const item = s.mushrooms.find((m) => m.archetypeId === ROBIN);
  return s.suppressedWishlistIds.includes(ROBIN)
    ? false
    : s.favorites.includes(ROBIN) || item?.isWishlisted === true;
};

beforeEach(() => {
  useBirdsStore.setState({
    mushrooms: [],
    favorites: [],
    suppressedWishlistIds: [],
    currentPage: 0,
    totalCount: 0,
  });
  getMushrooms.mockReset();
  toggleFavorite.mockReset().mockResolvedValue(true);
});

test("star from Catalogue, remove in Wishlist, star is empty", async () => {
  getMushrooms.mockResolvedValueOnce(page(false));
  await useBirdsStore.getState().fetchMushrooms(0, 10);
  expect(await useBirdsStore.getState().toggleFavorite(ROBIN)).toBe("added");
  expect(catalogueStarFilled()).toBe(true);

  useBirdsStore.getState().removeFavorite(ROBIN); // what WishlistScreen does
  expect(catalogueStarFilled()).toBe(false);
});

test("star stays empty when Catalogue re-reads and the API still says wishlisted", async () => {
  getMushrooms.mockResolvedValueOnce(page(true));
  await useBirdsStore.getState().fetchMushrooms(0, 10);
  expect(catalogueStarFilled()).toBe(true);
  useBirdsStore.getState().removeFavorite(ROBIN);

  getMushrooms.mockResolvedValueOnce(page(true)); // backend lag
  await useBirdsStore.getState().fetchMushrooms(0, 10);
  expect(catalogueStarFilled()).toBe(false);

  getMushrooms.mockResolvedValueOnce(page(false)); // backend caught up
  await useBirdsStore.getState().fetchMushrooms(0, 10);
  expect(catalogueStarFilled()).toBe(false);
});

test("a tab's saved list does not bring back a star removed from Wishlist details", async () => {
  // Catalogue shows the bird starred, then the user switches tab (list saved).
  getMushrooms.mockResolvedValueOnce(page(true));
  await useBirdsStore.getState().fetchMushrooms(0, 10);
  const saved = {
    mushrooms: useBirdsStore.getState().mushrooms,
    totalCount: 1,
    currentPage: 0,
  };
  expect(saved.mushrooms[0].isWishlisted).toBe(true);

  // Wishlist → open bird → Remove (BirdDetailsScreen calls removeFavorite).
  useBirdsStore.getState().removeFavorite(ROBIN);
  // Another list read sees the server caught up, so the "just removed" mark clears.
  getMushrooms.mockResolvedValueOnce(page(false));
  await useBirdsStore.getState().fetchMushrooms(0, 10);
  expect(useBirdsStore.getState().suppressedWishlistIds).not.toContain(ROBIN);

  // Back to the first tab: its saved copy still says wishlisted.
  useBirdsStore.getState().restoreCachedList(saved);
  expect(catalogueStarFilled()).toBe(false);
});

test("a saved list keeps stars for birds that are still wishlisted", async () => {
  getMushrooms.mockResolvedValueOnce(page(false));
  await useBirdsStore.getState().fetchMushrooms(0, 10);
  const saved = {
    mushrooms: useBirdsStore.getState().mushrooms,
    totalCount: 1,
    currentPage: 0,
  };
  useBirdsStore.getState().addFavorite(ROBIN); // added from details meanwhile
  useBirdsStore.getState().restoreCachedList(saved);
  expect(catalogueStarFilled()).toBe(true);
  expect(
    useBirdsStore.getState().mushrooms.find((m) => m.archetypeId === ROBIN)
      ?.isWishlisted
  ).toBe(true);
});

test("a removal made while the catalogue list is loading is not undone", async () => {
  getMushrooms.mockResolvedValueOnce(page(true));
  await useBirdsStore.getState().fetchMushrooms(0, 10);
  expect(catalogueStarFilled()).toBe(true);

  let finish!: (value: unknown) => void;
  getMushrooms.mockImplementationOnce(
    () => new Promise((resolve) => (finish = resolve)) as never
  );
  const reading = useBirdsStore.getState().fetchMushrooms(0, 10, false, true);
  useBirdsStore.getState().removeFavorite(ROBIN); // Wishlist removal mid-read
  finish(page(true));
  await reading;
  expect(catalogueStarFilled()).toBe(false);
});
