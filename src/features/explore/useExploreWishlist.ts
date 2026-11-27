import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Alert } from "react-native";
import { archetypeService } from "../../services/archetype/archetype.service";
import { useBirdsStore } from "../catalogue/birds.store";
import { useAuthStore } from "../auth/auth.store";
import { useWishlistInvalidationStore } from "../collection/wishlistInvalidation.store";
import { getAccountSessionVersion } from "../../services/session/accountSession";
import { exploreWishlistOperations as operations } from "./exploreWishlistOperations";
import { EXPLORE_COPY } from "./content/explore.strings";
import type { ExploreArchetypeCard } from "./services/explore.api.types";

/** Preserve Bird's direct star toggle/error alert while sharing operation ownership. */
export function useExploreWishlist(
  item: Pick<ExploreArchetypeCard, "archetypeId" | "isWishlisted">
) {
  const account = useAuthStore((state) => state.user?.id);
  const session = getAccountSessionVersion();
  const favorite = useBirdsStore((state) =>
    state.favorites.includes(item.archetypeId)
  );
  const suppressed = useBirdsStore((state) =>
    state.suppressedWishlistIds.includes(item.archetypeId)
  );
  const key = operations.key(account, session, item.archetypeId);
  const operation = useSyncExternalStore(operations.subscribe, () =>
    operations.get(key)
  );
  const pendingRef = useMemo(
    () => ({
      get current() {
        return !!operations.get(key);
      },
    }),
    [key]
  );
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (
      useAuthStore.getState().user?.id === account &&
      getAccountSessionVersion() === session
    )
      operations.retainOwner(account, session);
  }, [account, session]);
  const starred =
    operation?.next ?? (suppressed ? false : favorite || item.isWishlisted);
  const toggle = async () => {
    if (
      useAuthStore.getState().user?.id !== account ||
      getAccountSessionVersion() !== session
    )
      return;
    const next = !starred;
    const token = operations.begin(key, next);
    if (!token) return;
    const current = () =>
      useAuthStore.getState().user?.id === account &&
      getAccountSessionVersion() === session &&
      operations.get(key)?.token === token;
    try {
      if (next) await archetypeService.addWishlistArchetype(item.archetypeId);
      else await archetypeService.removeWishlistArchetype(item.archetypeId);
      if (!current()) return;
      const store = useBirdsStore.getState();
      if (next) store.addFavorite(item.archetypeId);
      else store.removeFavorite(item.archetypeId);
      useWishlistInvalidationStore.getState().invalidate();
    } catch {
      if (alive.current && current())
        Alert.alert(EXPLORE_COPY.wishlist, EXPLORE_COPY.wishlistError);
    } finally {
      operations.finish(key, token);
    }
  };
  return { starred, pending: !!operation, pendingRef, toggle };
}
