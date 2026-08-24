/**
 * Onboarding Strings
 * Shared messages (connectionTakingTooLong, failedToContinueAsGuest) live in COMMON_STRINGS.messages
 */

export const ONBOARDING_STRINGS = {
  skip: "Skip",
  continueAsGuest: "Continue as guest",
  logIn: "Log in",
  signUp: "Sign up",
  errors: {
    tokenNotSaved: "Token not saved after guest login",
  },
} as const;
