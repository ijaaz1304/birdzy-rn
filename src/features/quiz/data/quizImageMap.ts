import { ImageSourcePropType } from "react-native";
import { QUIZ_BIRD_LOCAL_IMAGES } from "../../../assets";

/**
 * Legacy remote quiz keys point to mushroom photographs. Birdzy uses curated
 * bundled bird artwork until a bird-specific remote image contract is available.
 * Keep this API for share callers; an empty map means there is no remote image.
 */
export function getQuizArchetypeImageMap(): Record<string, string> {
  return {};
}

export function getQuizLocalImageSource(
  archetypeId: string
): ImageSourcePropType | undefined {
  return QUIZ_BIRD_LOCAL_IMAGES[
    archetypeId as keyof typeof QUIZ_BIRD_LOCAL_IMAGES
  ];
}

/** Bird artwork for the existing quiz IDs; no inherited mushroom URL fallback. */
export function getQuizResultDisplaySource(
  archetypeId: string
): ImageSourcePropType | undefined {
  return getQuizLocalImageSource(archetypeId);
}

export function getQuizArchetypeImageSources(): Record<
  string,
  ImageSourcePropType
> {
  return { ...QUIZ_BIRD_LOCAL_IMAGES };
}
