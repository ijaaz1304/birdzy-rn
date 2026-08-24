import { ImageSourcePropType } from "react-native";
import { QUIZ_MUSHROOM_IMAGE_DEFAULTS } from "../../../config/mushroomImageUrls.config";
import { QUIZ_MUSHROOM_LOCAL_IMAGES } from "../../../assets";
import { getRemoteConfig } from "../../../services/remoteConfig/remoteConfig.service";

function isRemoteImageUrl(value: string | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

/** Build map of archetypeId -> remote image URL from Remote Config with URL fallbacks. */
export function getQuizArchetypeImageMap(): Record<string, string> {
  const config = getRemoteConfig();
  const map: Record<string, string> = { ...QUIZ_MUSHROOM_IMAGE_DEFAULTS };

  if (config.quizMushroomImage_porcini) {
    map.porcini = config.quizMushroomImage_porcini;
  }
  if (config.quizMushroomImage_reishi) {
    map.reishi = config.quizMushroomImage_reishi;
  }
  if (config.quizMushroomImage_oyster_mushroom) {
    map.oyster_mushroom = config.quizMushroomImage_oyster_mushroom;
  }
  if (config.quizMushroomImage_wild_enoki) {
    map.wild_enoki = config.quizMushroomImage_wild_enoki;
  }
  if (config.quizMushroomImage_fly_agaric) {
    map.fly_agaric = config.quizMushroomImage_fly_agaric;
  }
  if (config.quizMushroomImage_lions_mane) {
    map.lions_mane = config.quizMushroomImage_lions_mane;
  }
  if (config.quizMushroomImage_morel) {
    map.morel = config.quizMushroomImage_morel;
  }
  if (config.quizMushroomImage_winter_chanterelle) {
    map.winter_chanterelle = config.quizMushroomImage_winter_chanterelle;
  }

  return map;
}

export function getQuizLocalImageSource(
  mushroomId: string
): ImageSourcePropType | undefined {
  return QUIZ_MUSHROOM_LOCAL_IMAGES[
    mushroomId as keyof typeof QUIZ_MUSHROOM_LOCAL_IMAGES
  ];
}

/**
 * Instant result-circle source: bundled webp first (RN Image, first frame).
 * Remote S3 URLs stay available for share / fallbacks.
 */
export function getQuizResultDisplaySource(
  mushroomId: string
): ImageSourcePropType | undefined {
  return (
    getQuizLocalImageSource(mushroomId) ??
    getQuizArchetypeImageSources()[mushroomId]
  );
}

/** Bundled local quiz images; remote config URLs override when present. */
export function getQuizArchetypeImageSources(): Record<
  string,
  ImageSourcePropType
> {
  const remoteMap = getQuizArchetypeImageMap();
  const sources: Record<string, ImageSourcePropType> = {
    ...QUIZ_MUSHROOM_LOCAL_IMAGES,
  };

  (
    Object.keys(QUIZ_MUSHROOM_LOCAL_IMAGES) as Array<
      keyof typeof QUIZ_MUSHROOM_LOCAL_IMAGES
    >
  ).forEach((key) => {
    const remoteUrl = remoteMap[key];
    if (isRemoteImageUrl(remoteUrl)) {
      sources[key] = { uri: remoteUrl };
    }
  });

  return sources;
}
