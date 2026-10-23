import { isGuestSettingsSession } from "../src/utils/settingsAccountAccess";
it.each([
  { isAuthenticated: false },
  { isAuthenticated: true, user: { isGuest: true } },
  { isAuthenticated: true, user: {}, isGuest: true },
  { isAuthenticated: true, user: {}, guestId: "guest-1" },
  { isAuthenticated: true, user: null },
])(
  "keeps login/signup and blocks password actions for guest session %p",
  (state) => {
    expect(isGuestSettingsSession(state)).toBe(true);
  }
);
it("keeps the existing registered-account password flow", () => {
  expect(
    isGuestSettingsSession({
      isAuthenticated: true,
      user: {},
      isGuest: false,
      guestId: null,
    })
  ).toBe(false);
});
