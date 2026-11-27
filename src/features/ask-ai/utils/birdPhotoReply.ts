import type { MushroomIdentification } from "../../../types/mushrooms.types";

/** Bird identification currently returns the normalized legacy bridge: name + raw match. */
export function formatBirdPhotoReply(
  top:
    | Pick<MushroomIdentification, "name" | "scientificName" | "match">
    | undefined
): string {
  const scientific = top?.scientificName?.trim();
  const name = top?.name?.trim() || scientific;
  if (!name) {
    return "I couldn't match that photo to a bird. Try a clearer picture.";
  }
  const scientificSuffix =
    scientific && scientific.toLowerCase() !== name.toLowerCase()
      ? ` (${scientific})`
      : "";
  const summary = top?.match?.summary?.trim();
  return `This looks like a ${name}${scientificSuffix}.${
    summary ? ` ${summary}` : ""
  }`;
}
