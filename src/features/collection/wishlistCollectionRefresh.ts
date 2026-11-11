export type WishlistCollectionRefreshPlan =
  | 'noop'
  | 'immediate'
  | 'after_pending';

/**
 * Decide whether a wishlist mutation should reload collections now or after
 * an older in-flight collection read finishes.
 */
export function planWishlistCollectionRefresh(input: {
  versionChanged: boolean;
  isFocused: boolean;
  hasHydrated: boolean;
  userId?: string | null;
  hasPendingLoad: boolean;
}): WishlistCollectionRefreshPlan {
  if (
    !input.versionChanged ||
    !input.isFocused ||
    !input.hasHydrated ||
    !input.userId
  ) {
    return 'noop';
  }
  return input.hasPendingLoad ? 'after_pending' : 'immediate';
}

/** Run the planned refresh. after_pending waits for the older read first. */
export async function runWishlistCollectionRefresh(
  plan: WishlistCollectionRefreshPlan,
  opts: {
    pendingLoad?: Promise<unknown> | null;
    refresh: () => void | Promise<void>;
    isActive?: () => boolean;
  },
): Promise<void> {
  if (plan === 'noop') return;
  if (plan === 'after_pending') {
    await opts.pendingLoad;
    if (opts.isActive?.() === false) return;
  }
  await opts.refresh();
}
