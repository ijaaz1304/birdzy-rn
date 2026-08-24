import { useIsDark } from "../../../hooks/useTheme";

/** Resolves effective dark mode for post-auth onboarding. */
export function usePostAuthOnboardingIsDark(): boolean {
  return useIsDark();
}
