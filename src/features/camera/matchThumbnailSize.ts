import { POSSIBLE_MATCH_THUMBNAIL_WIDTH } from "../../utils/mushroomApiMappers";

const MATCH_THUMBNAIL_MIN_SIZE = 72;

/**
 * Photo-match thumbnail size for the user's font scale. Figma size (120pt) at default text; as text
 * grows the photo shrinks proportionally (min 72pt) so a long single word in the name
 * (e.g. "Cordilleran") fits the name column instead of breaking mid-word.
 */
export function getMatchThumbnailSize(fontScale: number): number {
  const scale = fontScale > 0 ? fontScale : 1;
  const max = POSSIBLE_MATCH_THUMBNAIL_WIDTH;
  return Math.round(Math.min(max, Math.max(MATCH_THUMBNAIL_MIN_SIZE, (max * 1.2) / scale)));
}
