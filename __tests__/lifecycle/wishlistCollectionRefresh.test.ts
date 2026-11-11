import {
  planWishlistCollectionRefresh,
  runWishlistCollectionRefresh,
} from '../../src/features/collection/wishlistCollectionRefresh';

describe('wishlist collection refresh after an older read', () => {
  it('ignores unchanged, unfocused, or unauthenticated screens', () => {
    expect(
      planWishlistCollectionRefresh({
        versionChanged: false,
        isFocused: true,
        hasHydrated: true,
        userId: 'user-1',
        hasPendingLoad: false,
      }),
    ).toBe('noop');
    expect(
      planWishlistCollectionRefresh({
        versionChanged: true,
        isFocused: false,
        hasHydrated: true,
        userId: 'user-1',
        hasPendingLoad: false,
      }),
    ).toBe('noop');
    expect(
      planWishlistCollectionRefresh({
        versionChanged: true,
        isFocused: true,
        hasHydrated: true,
        userId: null,
        hasPendingLoad: false,
      }),
    ).toBe('noop');
  });

  it('refreshes immediately when no collection read is pending', () => {
    expect(
      planWishlistCollectionRefresh({
        versionChanged: true,
        isFocused: true,
        hasHydrated: true,
        userId: 'user-1',
        hasPendingLoad: false,
      }),
    ).toBe('immediate');
  });

  it('refreshes once after an older collection read finishes', async () => {
    expect(
      planWishlistCollectionRefresh({
        versionChanged: true,
        isFocused: true,
        hasHydrated: true,
        userId: 'user-1',
        hasPendingLoad: true,
      }),
    ).toBe('after_pending');

    let finish!: () => void;
    const pendingLoad = new Promise<void>(resolve => {
      finish = resolve;
    });
    const refresh = jest.fn();
    const running = runWishlistCollectionRefresh('after_pending', {
      pendingLoad,
      refresh,
    });
    expect(refresh).not.toHaveBeenCalled();
    finish();
    await running;
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('skips the delayed refresh after cleanup', async () => {
    const refresh = jest.fn();
    await runWishlistCollectionRefresh('after_pending', {
      pendingLoad: Promise.resolve(),
      refresh,
      isActive: () => false,
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
