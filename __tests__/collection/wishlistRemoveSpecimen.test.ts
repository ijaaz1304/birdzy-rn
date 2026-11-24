/**
 * Wishlist add/remove must only touch the bird in question. The specimen
 * lookup sends `_archetype`, which the specimen fetchAll docs do not list; if
 * the server ignores it, rows for other birds come back.
 */
jest.mock("../../src/services/api/features/core.api", () => ({
  coreApi: {
    removeWishlistArchetype: jest.fn(),
    addWishlistArchetype: jest.fn(),
  },
}));
jest.mock("../../src/services/specimen/mushroomSpecimen.service", () => ({
  mushroomSpecimenService: {
    fetchAllSpecimens: jest.fn(),
    updateSpecimen: jest.fn(),
    deleteSpecimen: jest.fn(),
    getSpecimenDetails: jest.fn(),
  },
}));
jest.mock("../../src/features/app-logs/app-logs.store", () => ({
  useAppLogsStore: {
    getState: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
  },
}));

import { coreApi } from "../../src/services/api/features/core.api";
import { mushroomSpecimenService } from "../../src/services/specimen/mushroomSpecimen.service";
import { archetypeService } from "../../src/services/archetype/archetype.service";

const api = jest.mocked(coreApi);
const specimens = jest.mocked(mushroomSpecimenService);
const ROBIN = "arch-robin";
const OWL = "arch-owl";

const row = (
  specimenId: string,
  archetype: string,
  extra: Record<string, unknown> = {}
) => ({ specimenId, _archetype: archetype, isWishlisted: true, ...extra });

beforeEach(() => {
  jest.resetAllMocks();
  api.removeWishlistArchetype.mockResolvedValue({ error: false } as never);
  specimens.updateSpecimen.mockResolvedValue({} as never);
});

test("removing one bird never un-wishlists another bird's specimen", async () => {
  // Server ignored the filter: latest specimens of any bird.
  specimens.fetchAllSpecimens.mockResolvedValue({
    data: [row("s-owl", OWL), row("s-robin", ROBIN)],
  } as never);
  await archetypeService.removeWishlistArchetype(ROBIN);
  const patched = specimens.updateSpecimen.mock.calls.map((c) => c[0]);
  expect(patched).toEqual(["s-robin"]);
  expect(specimens.deleteSpecimen).not.toHaveBeenCalled();
});

test("the Wishlist specimen that was opened is cleared even when the lookup misses it", async () => {
  specimens.fetchAllSpecimens.mockResolvedValue({
    data: [row("s-owl", OWL)], // robin not in the first 20 rows
  } as never);
  await archetypeService.removeWishlistArchetype(ROBIN, "s-robin");
  expect(specimens.updateSpecimen).toHaveBeenCalledWith("s-robin", {
    isWishlisted: false,
  });
  expect(specimens.updateSpecimen).toHaveBeenCalledTimes(1);
});

test("a failed patch of the opened specimen never deletes it", async () => {
  specimens.fetchAllSpecimens.mockResolvedValue({ data: [] } as never);
  specimens.updateSpecimen.mockRejectedValue(new Error("500"));
  await archetypeService.removeWishlistArchetype(ROBIN, "s-robin");
  expect(specimens.deleteSpecimen).not.toHaveBeenCalled();
});

test("another bird's identified specimen does not block wishlisting this bird", async () => {
  specimens.fetchAllSpecimens.mockResolvedValue({
    data: [row("s-owl", OWL, { isIdentified: true, isWishlisted: false })],
  } as never);
  api.addWishlistArchetype.mockResolvedValue({
    error: false,
    data: { _id: "s-robin-new" },
  } as never);
  await expect(archetypeService.addWishlistArchetype(ROBIN)).resolves.toEqual({
    _id: "s-robin-new",
  });
  expect(api.addWishlistArchetype).toHaveBeenCalledWith(ROBIN);
});

test("another bird's wishlisted specimen is not mistaken for this bird's", async () => {
  specimens.fetchAllSpecimens.mockResolvedValue({
    data: [row("s-owl", OWL)],
  } as never);
  api.addWishlistArchetype.mockResolvedValue({
    error: false,
    data: { _id: "s-robin-new" },
  } as never);
  await archetypeService.addWishlistArchetype(ROBIN);
  expect(specimens.getSpecimenDetails).not.toHaveBeenCalled();
  expect(api.addWishlistArchetype).toHaveBeenCalledWith(ROBIN);
});
