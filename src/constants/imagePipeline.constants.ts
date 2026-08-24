import type { Options } from "react-native-image-crop-picker";

export const IMAGE_PIPELINE_MAX_SIDE = 1920;
export const IMAGE_PIPELINE_JPEG_QUALITY = 0.92;
export const IMAGE_PIPELINE_MAX_UPLOAD_MB = 5;

export const AI_PICKER_OPTIONS: Partial<Options> = {
  mediaType: "photo",
  includeBase64: false,
  compressImageQuality: IMAGE_PIPELINE_JPEG_QUALITY,
  compressImageMaxWidth: IMAGE_PIPELINE_MAX_SIDE,
  compressImageMaxHeight: IMAGE_PIPELINE_MAX_SIDE,
};

export const AI_CROPPER_OPTIONS: Partial<Options> = {
  mediaType: "photo",
  includeBase64: false,
  cropping: true,
  freeStyleCropEnabled: true,
  compressImageQuality: IMAGE_PIPELINE_JPEG_QUALITY,
  compressImageMaxWidth: IMAGE_PIPELINE_MAX_SIDE,
  compressImageMaxHeight: IMAGE_PIPELINE_MAX_SIDE,
  cropperToolbarTitle: "Crop Image",
};

/** Feed post crop — square output, slightly lower quality than identify flow. */
export const FEED_CROPPER_OPTIONS: Partial<Options> = {
  ...AI_CROPPER_OPTIONS,
  compressImageQuality: 0.85,
  cropperToolbarTitle: "Crop Image",
};
