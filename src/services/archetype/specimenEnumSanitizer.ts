/**
 * Work-around for backend Specimen enum drift (2026-11-23).
 *
 * The archetype data / filteritems allow values (e.g. flightPattern "Mixed") that the
 * Specimen schema rejects, so wishlist/specimen creation fails with:
 *   "Specimen validation failed: flightPattern.0: `Mixed` is not a valid enum value for path `flightPattern.0`."
 * These helpers read every rejected (path, value) pair from that message and remove
 * those values from a specimen payload so the save can be retried.
 * Remove once the backend enums match the archetype values (see KNOWN_GAPS.md).
 */

export type RejectedEnumValue = {
  /** Field name the value belongs to (last non-numeric path segment), e.g. "flightPattern". */
  field: string;
  value: string;
  path: string;
};

const ENUM_ERROR_RE =
  /`([^`]+)` is not a valid enum value for path `([^`]+)`/g;

/** All rejected enum values named in a server validation message. */
export function parseRejectedEnumValues(
  message: string | null | undefined
): RejectedEnumValue[] {
  if (!message) return [];
  const out: RejectedEnumValue[] = [];
  for (const match of message.matchAll(ENUM_ERROR_RE)) {
    const value = match[1];
    const path = match[2];
    const field = path
      .split(".")
      .filter((segment) => segment && !/^\d+$/.test(segment))
      .pop();
    if (field && value) out.push({ field, value, path });
  }
  return out;
}

export function isSpecimenEnumValidationError(
  message: string | null | undefined
): boolean {
  return parseRejectedEnumValues(message).length > 0;
}

/**
 * Returns a copy of `payload` with each rejected value removed from every key named
 * `field` (at any depth). Arrays drop the value; a matching string is removed; arrays
 * left empty are removed. Returns `changed: false` when nothing matched.
 */
export function stripRejectedEnumValues<T>(
  payload: T,
  rejected: RejectedEnumValue[]
): { payload: T; changed: boolean } {
  if (!rejected.length) return { payload, changed: false };
  let changed = false;

  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (!node || typeof node !== "object") return node;
    const result: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(node as Record<string, unknown>)) {
      const bad = rejected
        .filter((r) => r.field === key)
        .map((r) => r.value);
      if (bad.length) {
        if (Array.isArray(raw)) {
          const kept = raw.filter(
            (v) => !(typeof v === "string" && bad.includes(v))
          );
          if (kept.length !== raw.length) changed = true;
          if (kept.length) result[key] = kept;
          continue;
        }
        if (typeof raw === "string" && bad.includes(raw)) {
          changed = true;
          continue;
        }
      }
      result[key] = visit(raw);
    }
    return result;
  };

  return { payload: visit(payload) as T, changed };
}
