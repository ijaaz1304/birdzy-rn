/**
 * Logout is only for signed-in (non-guest) accounts.
 * Guests keep Delete account as their only account action.
 */
export function shouldShowLogoutAction(
  user: { isGuest?: boolean } | null | undefined,
  guestId?: string | null
): boolean {
  const isGuest = !!user?.isGuest || !!guestId;
  return !isGuest;
}
