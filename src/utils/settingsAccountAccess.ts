type SettingsSession = {
  isAuthenticated?: boolean;
  isGuest?: boolean;
  guestId?: string | null;
  user?: { isGuest?: boolean } | null;
};
/** Guests and signed-out sessions can log in/sign up, but cannot change passwords. */
export function isGuestSettingsSession(state: SettingsSession): boolean {
  return (
    !state.isAuthenticated ||
    !state.user ||
    !!state.isGuest ||
    !!state.user.isGuest ||
    !!state.guestId
  );
}
