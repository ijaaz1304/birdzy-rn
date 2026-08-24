/**
 * Free tier: cap on saved sound recordings in the audio gallery.
 */

import {
  useSubscriptionStore,
  selectIsPremium,
} from "../../features/subscription/subscription.store";
import { FREE_AUDIO_GALLERY_LIMIT } from "../../constants/appConstants";
import { archetypeService } from "../archetype/archetype.service";

export async function getAudioGalleryClipCount(): Promise<number> {
  try {
    const data = await archetypeService.getGalleryAudio();
    return (
      (data.identified?.count ?? data.identified?.files?.length ?? 0) +
      (data.unknown?.count ?? data.unknown?.files?.length ?? 0)
    );
  } catch {
    return 0;
  }
}

export async function canAddAudioGalleryClip(): Promise<boolean> {
  if (selectIsPremium(useSubscriptionStore.getState())) return true;
  const count = await getAudioGalleryClipCount();
  return count < FREE_AUDIO_GALLERY_LIMIT;
}

export function getFreeAudioGalleryLimit(): number {
  return FREE_AUDIO_GALLERY_LIMIT;
}
