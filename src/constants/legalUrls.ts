/**
 * Birdzy legal URLs — Trackzio
 * URLs can be overridden via Firebase Remote Config (privacyPolicyUrl, termsOfServiceUrl).
 */

/** Static fallbacks when Remote Config is unavailable */
export const LEGAL_URL_FALLBACKS = {
  /** Birdzy — Privacy Policy (Trackzio) */
  PRIVACY_POLICY: "https://trackzio.com/privacy-policy-birdzy-ai",
  /** Birdzy — Terms of Service (Trackzio) */
  TERMS_OF_SERVICE: "https://trackzio.com/birdzy-terms-of-service",
} as const;

function getRemoteLegalUrl(
  key: "privacyPolicyUrl" | "termsOfServiceUrl",
  fallback: string
): string {
  try {
    const {
      getRemoteConfigValue,
    } = require("../services/remoteConfig/remoteConfig.service");
    const url = getRemoteConfigValue(key);
    if (url && typeof url === "string" && url.length > 0) {
      return url;
    }
  } catch {
    // Remote Config not ready or not available
  }
  return fallback;
}

/** Privacy Policy URL — uses Remote Config when available. */
export function getPrivacyPolicyUrl(): string {
  return getRemoteLegalUrl(
    "privacyPolicyUrl",
    LEGAL_URL_FALLBACKS.PRIVACY_POLICY
  );
}

/** Terms of Service URL — uses Remote Config when available. */
export function getTermsOfServiceUrl(): string {
  return getRemoteLegalUrl(
    "termsOfServiceUrl",
    LEGAL_URL_FALLBACKS.TERMS_OF_SERVICE
  );
}
