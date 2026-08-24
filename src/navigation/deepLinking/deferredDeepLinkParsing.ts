/**
 * Pure helpers for deferred deep link URL parsing (testable without native modules).
 */

import { safeDecode } from "../../services/attribution/referrerParser";
import {
  DEEP_LINK_FIREBASE_HOSTING,
  DEFERRED_DEEP_LINK_REFERRER_PARAM,
} from "./deepLink.constants";

export function extractDeferredPathFromReferrer(
  referrer: string
): string | null {
  const trimmed = referrer.trim();
  if (!trimmed) return null;

  const decoded = safeDecode(trimmed);
  const queryPart = decoded.includes("?")
    ? decoded.slice(decoded.indexOf("?") + 1)
    : decoded;
  const params = new URLSearchParams(queryPart);
  const path = params.get(DEFERRED_DEEP_LINK_REFERRER_PARAM)?.trim();
  return path || null;
}

export function buildHttpsUrlFromDeferredPath(path: string): string {
  const normalized = path.replace(/^\/+/, "").trim();
  if (!normalized) {
    return `https://${DEEP_LINK_FIREBASE_HOSTING.prod.webApp}/home`;
  }
  return `https://${DEEP_LINK_FIREBASE_HOSTING.prod.webApp}/${normalized}`;
}
