import type { MushroomArchetypeListItem } from "../../../services/api/features/core.api.types";
import type { PossibleMatchListItem } from "../../../utils/mushroomApiMappers";
import { getDisplayName } from "../../../utils/mushroomDisplayUtils";

function asRecord(item: MushroomArchetypeListItem): Record<string, unknown> {
  return item as unknown as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function mapStepByStepItemToPossibleMatch(
  item: MushroomArchetypeListItem
): PossibleMatchListItem {
  const raw = asRecord(item);
  const id = item.archetypeId || String(raw._id ?? "");
  const name =
    getDisplayName({
      commonNames: item.commonNames,
      genusCommonNames: item.genusCommonNames,
      commonName: (raw.commonName as string | undefined) ?? undefined,
      scientificName: item.scientificName,
      canonicalName: item.canonicalName,
    }) || item.scientificName;
  const image = item.defaultImageUrl ?? item.imageUrls?.[0];
  const score =
    typeof raw.score === "number"
      ? raw.score
      : typeof raw.similarityScore === "number"
        ? raw.similarityScore
        : undefined;
  const accuracy =
    score == null
      ? undefined
      : Math.round(score <= 1 ? score * 100 : score);

  return {
    id,
    _id: id,
    name,
    commonName: name,
    scientificName: item.scientificName,
    canonicalName: item.canonicalName,
    accuracy,
    similarityScore: score,
    image,
    images: item.imageUrls?.length ? item.imageUrls : undefined,
    match: item as unknown as PossibleMatchListItem["match"],
  };
}

export function filterStepByStepMatches(
  items: MushroomArchetypeListItem[],
  selectedColors: string[],
  habitat: string | null
): MushroomArchetypeListItem[] {
  let result = items;

  if (selectedColors.length > 0) {
    result = result.filter((item) => {
      const raw = asRecord(item);
      const colors = asStringArray(raw.dominantColors);
      if (colors.length === 0) return true;
      return selectedColors.some((pick) =>
        colors.some((color) => color.toLowerCase().includes(pick.toLowerCase()))
      );
    });
  }

  if (habitat) {
    const needle = habitat.toLowerCase();
    result = result.filter((item) => {
      const raw = asRecord(item);
      const haystack = [
        ...asStringArray(item.commonlyFoundIn),
        ...asStringArray(raw.habitat),
        item.summary ?? "",
        item.detailedDescription ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.trim()) return true;
      return (
        haystack.includes(needle) ||
        needle.split(/[/,]/).some((part) => {
          const token = part.trim();
          return token.length > 2 && haystack.includes(token);
        })
      );
    });
  }

  return result;
}
