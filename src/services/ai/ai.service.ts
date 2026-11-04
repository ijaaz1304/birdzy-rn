import { isIdentificationNoMatch } from "../session/identificationNoMatch";
/**
 * AI Service
 * Integrates with Core API for AI identification and chat
 */

import { coreApi } from "../api/features/core.api";
import type { BirdIdentifyResponse } from "../api/features/bird.api.types";
import { ApiException, normalizeError } from "../api/errors";
import RNFS from "react-native-fs";
import {
  processImage,
  DEFAULT_CONFIG,
  STRICT_CONFIG,
  ImageProcessingError,
  getImageProcessingErrorMessage,
  ProcessedImage,
} from "../../utils/imageProcessing/imagePreprocessor";
import { normalizeBirdIdentifyResponseLegacy } from "../../utils/birdApiMappers";
import type {
  IdentifyMushroomResult,
  MushroomIdentification,
} from "../../types/mushrooms.types";

export type { MushroomIdentification, IdentifyMushroomResult };

/** Known empty-reply fallback for /core/chat and /got-bitten. */
const CANNED_AI_EMPTY_REPLIES = [
  "Hmm, I need a moment to process that. Could you try again?",
  "Oops, something went wrong. Please resend your message.",
  "I'm having trouble responding right now. Mind trying once more?",
] as const;

function cannedEmptyAiReply(): string {
  return CANNED_AI_EMPTY_REPLIES[
    Math.floor(Math.random() * CANNED_AI_EMPTY_REPLIES.length)
  ];
}

export interface DiseaseDiagnosis {
  id: string;
  name: string;
  accuracy: number;
  description: string;
  symptoms: string[];
  cause: string[];
  remedies: string[];
  imageUri?: string;
}

export interface DiagnosisResult {
  primary: DiseaseDiagnosis;
  otherMatches: DiseaseDiagnosis[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

async function ensureLocalAudioUri(uri: string): Promise<string> {
  const trimmed = uri.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed;
  }
  const pathName = trimmed.split("?")[0]?.split("/").pop() || "recording.m4a";
  const safeName = pathName.replace(/[^a-zA-Z0-9._-]/g, "_") || "recording.m4a";
  const dest = `${
    RNFS.CachesDirectoryPath
  }/gallery-identify-${Date.now()}-${safeName}`;
  const result = await RNFS.downloadFile({ fromUrl: trimmed, toFile: dest })
    .promise;
  if (result.statusCode != null && result.statusCode >= 400) {
    throw new Error("Could not download this recording");
  }
  return dest.startsWith("file://") ? dest : `file://${dest}`;
}

class AIService {
  /**
   * Identify mushroom from image(s)
   */
  async identifyMushroom(
    imageUris: string[] | any[],
    userLocation?: [number, number]
  ): Promise<{
    imageUrls: string[];
    matches: MushroomIdentification[];
    matchesFoundCount: number;
  }> {
    try {
      if ((imageUris?.length ?? 0) > 2)
        throw new ApiException(
          "Maximum 2 image files allowed for identification"
        );
      if (!imageUris?.length) {
        throw new ApiException(
          "At least one image is required for identification"
        );
      }

      // Normalize to string URIs
      const uris: string[] = [];
      for (const item of imageUris) {
        if (item && typeof item === "object" && item.uri) {
          if (typeof item.uri === "string" && item.uri.trim()) {
            uris.push(item.uri);
          }
        } else if (typeof item === "string" && item.trim()) {
          uris.push(item);
        }
      }

      if (!uris.length) {
        throw new ApiException("No valid image(s) provided for identification");
      }

      // Compress/resize each image to stay under backend 5MB limit
      const processedList: ProcessedImage[] = [];
      for (const uri of uris) {
        try {
          let processed = await processImage(uri, DEFAULT_CONFIG);
          processedList.push(processed);
        } catch (err) {
          if (err instanceof ImageProcessingError && err.code === "TOO_LARGE") {
            try {
              const processed = await processImage(uri, STRICT_CONFIG);
              processedList.push(processed);
            } catch (retryErr) {
              throw new ApiException(
                getImageProcessingErrorMessage(
                  retryErr instanceof ImageProcessingError
                    ? retryErr
                    : new ImageProcessingError(
                        String(retryErr),
                        "PROCESSING_FAILED"
                      )
                )
              );
            }
          } else {
            throw new ApiException(
              getImageProcessingErrorMessage(
                err instanceof ImageProcessingError
                  ? err
                  : new ImageProcessingError(
                      err instanceof Error ? err.message : String(err),
                      "PROCESSING_FAILED"
                    )
              )
            );
          }
        }
      }

      // Mushrooms API: up to 2 images per identify request
      const files = processedList.slice(0, 2).map((p) => ({
        uri: p.uri,
        type: p.type,
        name: p.fileName,
      }));

      const response = await coreApi.identify(
        files,
        userLocation ? { userLocation } : undefined
      );

      if (__DEV__) {
        console.log(
          "[Identify] /identify request",
          userLocation ? { userLocation } : { userLocation: "not sent" }
        );
      }

      if (response.error) {
        if (isIdentificationNoMatch(response))
          return { imageUrls: [], matches: [], matchesFoundCount: 0 };
        throw new ApiException(response.reason || "Identification failed");
      }

      if (__DEV__) {
        console.log(
          "[Identify] /identify response",
          JSON.stringify(response, null, 2)
        );
      }

      if (!Array.isArray(response.data?.matches)) {
        throw new ApiException(
          "Invalid identification response. Please try again."
        );
      }
      // Birdzy uses Bird API identification shapes
      const birdResult = normalizeBirdIdentifyResponseLegacy(
        response as unknown as BirdIdentifyResponse
      );
      return {
        imageUrls: birdResult.imageUrls,
        matches: birdResult.matches,
        matchesFoundCount: birdResult.matchesFoundCount,
      };
    } catch (error) {
      if (isIdentificationNoMatch(error))
        return { imageUrls: [], matches: [], matchesFoundCount: 0 };
      throw normalizeError(error);
    }
  }

  /**
   * Identify bird from audio recording (POST /core/ai/identify-sound).
   */
  async identifyBirdSound(
    audioUri: string,
    crop?: { startSec: number; durationSec: number },
    userLocation?: [number, number]
  ): Promise<{
    imageUrls: string[];
    soundUrls?: string[];
    matches: MushroomIdentification[];
    matchesFoundCount: number;
  }> {
    try {
      const localUri = await ensureLocalAudioUri(audioUri);
      const name = localUri.split("/").pop() ?? "recording.m4a";
      const ext = name.split(".").pop()?.toLowerCase();
      const type =
        ext === "wav"
          ? "audio/wav"
          : ext === "ogg"
          ? "audio/ogg"
          : ext === "mp3"
          ? "audio/mpeg"
          : "audio/m4a";
      const response = await coreApi.identifySound({
        uri: localUri,
        type,
        name,
        startTime: crop?.startSec,
        duration: crop?.durationSec,
        userLocation,
      });

      if (response.error) {
        if (isIdentificationNoMatch(response))
          return {
            imageUrls: [],
            matches: [],
            matchesFoundCount: 0,
            soundUrls: [],
          };
        throw new ApiException(
          response.reason || "Sound identification failed"
        );
      }

      if (!Array.isArray(response.data?.matches))
        throw new ApiException(
          "Invalid identification response. Please try again."
        );
      const legacy = normalizeBirdIdentifyResponseLegacy(response);
      return {
        imageUrls: legacy.imageUrls,
        soundUrls: legacy.soundUrls,
        matches: legacy.matches,
        matchesFoundCount: legacy.matchesFoundCount,
      };
    } catch (error) {
      if (isIdentificationNoMatch(error))
        return {
          imageUrls: [],
          matches: [],
          matchesFoundCount: 0,
          soundUrls: [],
        };
      throw normalizeError(error);
    }
  }

  private async prepareAssistantImages(
    imageUris?: string[] | any[]
  ): Promise<any[] | undefined> {
    if ((imageUris?.length ?? 0) > 5)
      throw new ApiException("Maximum 5 files allowed");
    const uris: string[] = [];
    if (imageUris && imageUris.length > 0) {
      for (const item of imageUris) {
        if (item && typeof item === "object" && item.uri) {
          if (typeof item.uri === "string" && item.uri.trim()) {
            uris.push(item.uri);
          }
        } else if (typeof item === "string" && item.trim()) {
          uris.push(item);
        }
      }
    }

    // Ensure images stay under backend 5MB limit (same strategy as identifyMushroom)
    let files: any[] | undefined;
    if (uris.length > 0) {
      const processedList: ProcessedImage[] = [];
      for (const uri of uris) {
        try {
          const processed = await processImage(uri, DEFAULT_CONFIG);
          processedList.push(processed);
        } catch (err) {
          if (err instanceof ImageProcessingError && err.code === "TOO_LARGE") {
            try {
              const processed = await processImage(uri, STRICT_CONFIG);
              processedList.push(processed);
            } catch (retryErr) {
              throw new ApiException(
                getImageProcessingErrorMessage(
                  retryErr instanceof ImageProcessingError
                    ? retryErr
                    : new ImageProcessingError(
                        String(retryErr),
                        "PROCESSING_FAILED"
                      )
                )
              );
            }
          } else {
            throw new ApiException(
              getImageProcessingErrorMessage(
                err instanceof ImageProcessingError
                  ? err
                  : new ImageProcessingError(
                      err instanceof Error ? err.message : String(err),
                      "PROCESSING_FAILED"
                    )
              )
            );
          }
        }
      }

      files = processedList.map((p) => ({
        uri: p.uri,
        type: p.type,
        name: p.fileName,
        // coreApi.chat size guard checks fileSize/size when present
        fileSize: p.fileSize,
      }));
    }

    return files;
  }

  /**
   * Got bitten assistant (POST /got-bitten).
   */
  async gotBitten(params: {
    message?: string;
    imageUris?: string[] | any[];
  }): Promise<string> {
    try {
      const files = await this.prepareAssistantImages(params.imageUris);
      const response = await coreApi.gotBitten({
        message: params.message,
        images: files,
      });
      if (response.error) {
        throw new ApiException(response.reason || "Request failed");
      }
      const reply =
        typeof response.data?.reply === "string"
          ? response.data.reply.trim()
          : "";
      return reply || cannedEmptyAiReply();
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Chat with AI assistant
   * @param message User's message or question
   * @param imageUris Optional array of image URIs or file objects
   * @returns AI response string
   */
  async chat(message?: string, imageUris?: string[] | any[]): Promise<string> {
    try {
      // Normalize optional images to string URIs
      const files = await this.prepareAssistantImages(imageUris);

      const response = await coreApi.chat(message, files);

      if (response.error) {
        throw new ApiException(response.reason || "Chat failed");
      }

      // Handle empty response (known issue mentioned in API docs)
      if (
        typeof response.data?.reply !== "string" ||
        !response.data.reply.trim()
      ) {
        return cannedEmptyAiReply();
      }

      return response.data.reply.trim();
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

export const aiService = new AIService();
