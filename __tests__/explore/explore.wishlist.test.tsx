import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Alert } from "react-native";
jest.mock("../../src/features/auth/auth.store", () => {
  const { create } = require("zustand");
  return {
    useAuthStore: create(() => ({ user: { id: "owner" }, token: "first" })),
  };
});
jest.mock("../../src/features/catalogue/birds.store", () => {
  const { create } = require("zustand");
  return {
    useBirdsStore: create((set: (state: object) => void) => ({
      favorites: [],
      suppressedWishlistIds: [],
      addFavorite: (id: string) =>
        set({ favorites: [id], suppressedWishlistIds: [] }),
      removeFavorite: (id: string) =>
        set({ favorites: [], suppressedWishlistIds: [id] }),
    })),
  };
});
jest.mock("../../src/features/collection/wishlistInvalidation.store", () => ({
  useWishlistInvalidationStore: { getState: () => ({ invalidate: jest.fn() }) },
}));
jest.mock("../../src/services/archetype/archetype.service", () => ({
  archetypeService: {
    addWishlistArchetype: jest.fn(),
    removeWishlistArchetype: jest.fn(),
  },
}));
jest.mock("../../src/components/shared", () => ({ AppCard: "AppCard" }));
jest.mock("../../src/atoms", () => ({ Text: "Text" }));
jest.mock("../../src/hooks/useTheme", () => ({
  useTheme: () => ({ colors: {} }),
}));
jest.mock("../../src/features/explore/components/ExploreEmptyState", () => ({
  ExploreEmptyState: "ExploreEmptyState",
}));
jest.mock("../../src/features/explore/components/ExploreFastPhoto", () => ({
  ExploreFastPhoto: "ExploreFastPhoto",
}));
jest.mock("react-native-fast-image", () => ({
  __esModule: true,
  default: {
    preload: jest.fn(),
    priority: { low: "low", high: "high" },
    cacheControl: { immutable: "immutable" },
  },
}));
import { useExploreWishlist } from "../../src/features/explore/useExploreWishlist";
import { ExploreResultCard } from "../../src/features/explore/components/ExploreResultList";
import { useAuthStore } from "../../src/features/auth/auth.store";
import { useBirdsStore } from "../../src/features/catalogue/birds.store";
import { archetypeService } from "../../src/services/archetype/archetype.service";
import { invalidateAccountSession } from "../../src/services/session/accountSession";
import type { ExploreArchetypeCard } from "../../src/features/explore/services/explore.api.types";
const item = {
  archetypeId: "bird",
  birdsLifeId: "123",
  isWishlisted: false,
  commonName: "Bird",
  scientificName: "Avis",
  imageUrls: [],
  defaultImageUrl: "",
} as ExploreArchetypeCard;
const states = new Map<string, ReturnType<typeof useExploreWishlist>>();
function Probe({ name }: { name: string }) {
  states.set(name, useExploreWishlist(item));
  return null;
}
let tree: TestRenderer.ReactTestRenderer | undefined;
const add = jest.mocked(archetypeService.addWishlistArchetype);
beforeEach(() => {
  invalidateAccountSession();
  useBirdsStore.setState({ favorites: [], suppressedWishlistIds: [] });
  useAuthStore.setState({ token: "first" });
  add.mockReset();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});
afterEach(async () => {
  if (tree) await act(async () => tree!.unmount());
  tree = undefined;
  jest.restoreAllMocks();
});
test("duplicate mounted stars share one request, including after the initiating cell is recycled", async () => {
  let finish!: () => void;
  add.mockReturnValue(
    new Promise((resolve) => {
      finish = () => resolve({} as never);
    })
  );
  await act(async () => {
    tree = TestRenderer.create(
      <>
        <Probe key="a" name="a" />
        <Probe key="b" name="b" />
      </>
    );
  });
  await act(async () => {
    void states.get("a")!.toggle();
    void states.get("b")!.toggle();
  });
  expect(add).toHaveBeenCalledTimes(1);
  expect(states.get("b")!.pendingRef.current).toBe(true);
  await act(async () => tree!.update(<Probe key="b" name="b" />));
  expect(states.get("b")!.pending).toBe(true);
  await act(async () => finish());
  expect(states.get("b")!.starred).toBe(true);
  expect(states.get("b")!.pending).toBe(false);
});
test("access-token refresh does not discard a successful wishlist change", async () => {
  let finish!: () => void;
  add.mockReturnValue(
    new Promise((resolve) => {
      finish = () => resolve({} as never);
    })
  );
  await act(async () => {
    tree = TestRenderer.create(<Probe name="a" />);
  });
  await act(async () => {
    void states.get("a")!.toggle();
  });
  await act(async () => useAuthStore.setState({ token: "refreshed" }));
  await act(async () => finish());
  expect(useBirdsStore.getState().favorites).toEqual(["bird"]);
});
test("late logout completion cannot repopulate favorites", async () => {
  let finish!: () => void;
  add.mockReturnValue(
    new Promise((resolve) => {
      finish = () => resolve({} as never);
    })
  );
  await act(async () => {
    tree = TestRenderer.create(<Probe name="a" />);
  });
  await act(async () => {
    void states.get("a")!.toggle();
  });
  invalidateAccountSession();
  await act(async () => finish());
  expect(useBirdsStore.getState().favorites).toEqual([]);
});
test("failed optimistic changes roll back a remounted cell", async () => {
  let fail!: () => void;
  add.mockReturnValue(
    new Promise((_resolve, reject) => {
      fail = () => reject(new Error("offline"));
    })
  );
  await act(async () => {
    tree = TestRenderer.create(<Probe name="a" />);
  });
  await act(async () => {
    void states.get("a")!.toggle();
  });
  await act(async () => tree!.unmount());
  await act(async () => {
    tree = TestRenderer.create(<Probe name="b" />);
  });
  expect(states.get("b")!.pending).toBe(true);
  await act(async () => fail());
  expect(states.get("b")!.pending).toBe(false);
  expect(states.get("b")!.starred).toBe(false);
});
test("the actual Explore card retains its title, photo slot and direct star action", async () => {
  add.mockResolvedValue({} as never);
  await act(async () => {
    tree = TestRenderer.create(
      <ExploreResultCard item={item} onPress={jest.fn()} />
    );
  });
  const card = () => tree!.root.findByType("AppCard" as never);
  expect(card().props.title).toBe("Bird");
  expect(card().props.imageSlot).toBeTruthy();
  await act(async () => card().props.onStarPress());
  expect(card().props.starred).toBe(true);
});
