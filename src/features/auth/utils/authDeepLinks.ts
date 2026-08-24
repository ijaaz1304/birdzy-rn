/**
 * Password-reset deep links. Backend reset emails should include a link like:
 *   birdzy://reset-password?email=user@example.com&code=123456
 * Same scheme is registered in iOS Info.plist and AndroidManifest (VIEW + BROWSABLE).
 * Query aliases: `code`, `otp`, or `token` (digits extracted, max 6).
 */

import { getDeepLinkUrlScheme } from "../../../navigation/deepLinking/deepLink.constants";

export const AUTH_PASSWORD_RESET_DEEP_LINK_SCHEME = getDeepLinkUrlScheme();

export type ParsedPasswordResetLink = {
  email: string;
  code?: string;
};

export function parsePasswordResetDeepLink(
  url: string
): ParsedPasswordResetLink | null {
  if (!url || typeof url !== "string") return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  const scheme = u.protocol.replace(/:$/, "");
  const host = (u.hostname || "").toLowerCase();
  const path = (u.pathname || "").toLowerCase();

  const isOurScheme =
    scheme === getDeepLinkUrlScheme() ||
    scheme === "birdzy" ||
    scheme === "birdzy-dev" ||
    scheme === "com.trackzio.birds";

  const looksLikeReset =
    host === "reset-password" ||
    host === "reset" ||
    path.includes("reset-password") ||
    path.includes("reset_password") ||
    /\/reset\/?$/.test(path);

  if (!isOurScheme || !looksLikeReset) {
    return null;
  }

  const sp = u.searchParams;
  const email = (sp.get("email") || "").trim();
  const rawCode = sp.get("code") || sp.get("otp") || sp.get("token") || "";
  const digits = rawCode.replace(/\D/g, "").slice(0, 6);
  const code = digits.length > 0 ? digits : undefined;

  if (!email && !code) {
    return null;
  }

  return { email, code };
}
