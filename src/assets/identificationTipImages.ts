/**
 * Identification camera tip samples — always use light art in every theme.
 * Do not theme-swap or add dark variants for these assets.
 */
import type { ImageSourcePropType } from "react-native";

export const IDENTIFICATION_TIP_LIGHT_IMAGES = {
  tooDark: require("./identification/light/too_dark.webp"),
  tooFar: require("./identification/light/too_far.webp"),
  tooBright: require("./identification/light/too_bright.webp"),
  blurry: require("./identification/light/blurry.webp"),
  alertIcon: require("./identification/light/alert.webp"),
  birdTooSmall: require("./identification/light/bird_size/small.webp"),
  birdMedium: require("./identification/light/bird_size/medium.webp"),
  birdGoodSize: require("./identification/light/bird_size/large.webp"),
  birdTooClose: require("./identification/light/bird_size/very_large.webp"),
} as const satisfies Record<string, ImageSourcePropType>;

export const IDENTIFICATION_TIP_LIGHT_IMAGE_LIST: ImageSourcePropType[] = [
  IDENTIFICATION_TIP_LIGHT_IMAGES.tooDark,
  IDENTIFICATION_TIP_LIGHT_IMAGES.tooBright,
  IDENTIFICATION_TIP_LIGHT_IMAGES.blurry,
  IDENTIFICATION_TIP_LIGHT_IMAGES.tooFar,
  IDENTIFICATION_TIP_LIGHT_IMAGES.birdTooSmall,
  IDENTIFICATION_TIP_LIGHT_IMAGES.birdMedium,
  IDENTIFICATION_TIP_LIGHT_IMAGES.birdGoodSize,
  IDENTIFICATION_TIP_LIGHT_IMAGES.birdTooClose,
];
