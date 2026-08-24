/**
 * Wishlist invalidation store
 * When wishlist is added/removed from any screen, increment this so Collection screen can refetch counts.
 */

import { create } from "zustand";

interface WishlistInvalidationState {
  version: number;
  invalidate: () => void;
}

export const useWishlistInvalidationStore = create<WishlistInvalidationState>()(
  (set) => ({
    version: 0,
    invalidate: () => set((state) => ({ version: state.version + 1 })),
  })
);
