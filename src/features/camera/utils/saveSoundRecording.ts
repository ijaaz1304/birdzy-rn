import { looksLikeMongoCollectionId } from "../../collection/collection.utils";
import { collectionService } from "../../../services/collection/collection.service";
import type { AddBirdSpecimenRequest } from "../../../services/api/features/bird.api.types";
import { mushroomSpecimenService } from "../../../services/specimen/mushroomSpecimen.service";

function isRemoteHttpUrl(uri: string): boolean {
  return /^https?:\/\//i.test(uri.trim());
}

/**
 * Persist a sound-identify recording as an unidentified specimen
 * (POST /core/specimen/add with userCapturedSounds).
 * Gallery GET has no save endpoint; this is the documented write path.
 */
export async function saveUnknownSoundRecording(params: {
  uploadedSoundUrl: string;
  note?: string;
  imageUrls: string[];
}): Promise<void> {
  const imageUrls = params.imageUrls.filter(
    (uri) => typeof uri === "string" && isRemoteHttpUrl(uri)
  );
  if (!imageUrls.length) {
    throw new Error(
      "Could not find a reference image for this recording. Try identifying again."
    );
  }
  const uploadedSoundUrl = params.uploadedSoundUrl.trim();
  if (!isRemoteHttpUrl(uploadedSoundUrl)) {
    throw new Error("The recording could not be saved. Please identify again.");
  }

  const collections = await collectionService.fetchAllCollections({
    pageNo: 0,
    pageSize: 50,
  });
  const identified = collections.data.find(
    (c) =>
      c.name === "Identified" && looksLikeMongoCollectionId(c.collectionId)
  );
  if (!identified?.collectionId) {
    throw new Error("Could not find your Identified collection.");
  }

  const payload: AddBirdSpecimenRequest = {
    scientificName: "Unknown",
    commonName: "Unknown",
    imageUrls,
    defaultImageUrl: imageUrls[0],
    userCapturedSounds: [uploadedSoundUrl],
    comment: params.note?.trim() || undefined,
    isIdentified: false,
    isWishlisted: false,
    _collections: [identified.collectionId],
  };
  await mushroomSpecimenService.addSpecimen(payload);
}
