/**
 * Resolve bird/archetype IDs from navigation params during mushroom→bird migration.
 */

export type ArchetypeRouteParams = {
  birdId?: string;
  /** @deprecated Prefer birdId */
  mushroomId?: string;
};

export function resolveArchetypeId(
  params?: ArchetypeRouteParams | null
): string | undefined {
  const id = params?.birdId ?? params?.mushroomId;
  return id?.trim() ? id.trim() : undefined;
}

export function resolveArchetypeName(params?: {
  birdName?: string;
  /** @deprecated Prefer birdName */
  mushroomName?: string;
}): string | undefined {
  const name = params?.birdName ?? params?.mushroomName;
  return name?.trim() ? name.trim() : undefined;
}
