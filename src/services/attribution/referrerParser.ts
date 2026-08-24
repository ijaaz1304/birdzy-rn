/**
 * Safe decoding and UTM extraction from Play Store install referrer strings.
 *
 * Uses `URLSearchParams` (no extra dependency). Apply `safeDecode` before parsing
 * so encoded query segments decode consistently.
 */

export function safeDecode(referrer: string): string {
  try {
    return decodeURIComponent(referrer);
  } catch {
    return referrer;
  }
}

function firstNonEmpty(value: string | null): string | undefined {
  if (value == null || value.length === 0) {
    return undefined;
  }
  return value;
}

export type ParsedReferrer = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

/**
 * Parse UTM parameters from a referrer string (query form or full URL).
 */
export function parseReferrer(referrer: string): ParsedReferrer {
  const trimmed = referrer.trim();
  if (!trimmed) {
    return {};
  }

  const decoded = safeDecode(trimmed);
  let queryPart = decoded;
  const qIdx = decoded.indexOf("?");
  if (qIdx >= 0) {
    queryPart = decoded.slice(qIdx + 1);
  }

  const params = new URLSearchParams(
    queryPart.startsWith("?") ? queryPart.slice(1) : queryPart
  );

  return {
    source: firstNonEmpty(params.get("utm_source")),
    medium: firstNonEmpty(params.get("utm_medium")),
    campaign: firstNonEmpty(params.get("utm_campaign")),
    term: firstNonEmpty(params.get("utm_term")),
    content: firstNonEmpty(params.get("utm_content")),
  };
}
