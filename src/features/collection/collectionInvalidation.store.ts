/**
 * Collection/Identified invalidation store
 * When a specimen is removed from Identified or any collection, increment this
 * so CollectionDetailsScreen (Identified tab, etc.) refetches the list.
 */

import { create } from "zustand";

interface CollectionInvalidationState {
  version: number;
  invalidate: () => void;
}

export const useCollectionInvalidationStore =
  create<CollectionInvalidationState>()((set) => ({
    version: 0,
    invalidate: () => set((state) => ({ version: state.version + 1 })),
  }));
