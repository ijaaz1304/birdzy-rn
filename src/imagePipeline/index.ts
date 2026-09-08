/**
 * Single public entry for image rendering, warming, and crop constants.
 *
 * Prefer importing from `@/imagePipeline` in new code. Existing `@/components/AppImage`
 * imports remain valid — they are re-exported here.
 */

export {
  AppImage,
  AppImageBackground,
  CachedRemoteImage,
  fullBleedImageStyle,
  type AppImageProps,
  type AppImageBackgroundProps,
  type CachedRemoteImageProps,
  type ImageBackgroundProps,
  type ImageProps,
  type ImageSourcePropType,
  resolveAppImageRenderer,
  resolveAppImageBackgroundRenderer,
  getExpectedRendererForBundledPath,
  shouldUseFastImage,
} from "../components/AppImage";

export {
  prefetchRemoteImage,
  prefetchRemoteImages,
  awaitPrefetchRemoteImages,
  isRemoteImageCacheReady,
  markRemoteImageCacheReady,
} from "../utils/prefetchImages";

export {
  prefetchBundledSource,
  prefetchBundledSources,
} from "./prefetchBundledSources";

export { warmBundledImageCache } from "./warmBundledImageCache";

export {
  AI_CROPPER_OPTIONS,
  AI_PICKER_OPTIONS,
  FEED_CROPPER_OPTIONS,
  IMAGE_PIPELINE_JPEG_QUALITY,
  IMAGE_PIPELINE_MAX_SIDE,
  IMAGE_PIPELINE_MAX_UPLOAD_MB,
} from "../constants/imagePipeline.constants";

export {
  openInteractiveCropper,
  openPickerWithCrop,
  type OpenInteractiveCropperOptions,
} from "../features/camera/interactiveCrop";

export {
  launchIosGalleryImage,
  normalizeIosGalleryAssetUri,
  usesIosPhpPickerGallery,
  type IosGalleryPickResult,
  type LaunchIosGalleryImageOptions,
} from "../features/camera/iosGallerySelection";

export type { CroppedImageObject } from "../features/camera/cropImageAndReturnObject";

export {
  cropImageAndReturnObject,
  resolvePathsForOpenCropper,
  isImageCropPickerCancelError,
  getMimeType,
} from "../features/camera/cropImageAndReturnObject";
