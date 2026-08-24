/**
 * AI Service
 * Integrates with Core API for AI identification and chat
 */

import { coreApi } from "../api/features/core.api";
import type { BirdIdentifyResponse } from "../api/features/bird.api.types";
import { ApiException, normalizeError } from "../api/errors";
import {
  processImage,
  DEFAULT_CONFIG,
  STRICT_CONFIG,
  ImageProcessingError,
  getImageProcessingErrorMessage,
  ProcessedImage,
} from "../../utils/imageProcessing/imagePreprocessor";
import {
  normalizeBirdIdentifyResponseLegacy,
} from "../../utils/birdApiMappers";
import type {
  IdentifyMushroomResult,
  MushroomIdentification,
} from "../../types/mushrooms.types";

export type { MushroomIdentification, IdentifyMushroomResult };

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
        throw new ApiException(response.reason || "Identification failed");
      }

      if (__DEV__) {
        console.log(
          "[Identify] /identify response",
          JSON.stringify(response, null, 2)
        );
      }

      const data = response.data;
      const matchesFoundCount = data?.matchesFoundCount ?? 0;

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
      throw normalizeError(error);
    }
  }

  /**
   * Identify bird from audio recording (POST /core/ai/identify-sound).
   */
  async identifyBirdSound(audioUri: string): Promise<{
    imageUrls: string[];
    soundUrls?: string[];
    matches: MushroomIdentification[];
    matchesFoundCount: number;
  }> {
    try {
      const name = audioUri.split("/").pop() ?? "recording.m4a";
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
        uri: audioUri,
        type,
        name,
      });

      if (response.error) {
        throw new ApiException(response.reason || "Sound identification failed");
      }

      const legacy = normalizeBirdIdentifyResponseLegacy(response);
      return {
        imageUrls: legacy.imageUrls,
        soundUrls: legacy.soundUrls,
        matches: legacy.matches,
        matchesFoundCount: legacy.matchesFoundCount,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Got bitten assistant (POST /got-bitten).
   */
  async gotBitten(params: {
    message?: string;
    imageUris?: string[] | any[];
  }): Promise<string> {
    try {
      const files: Array<{ uri: string; type?: string; name?: string }> = [];
      if (params.imageUris?.length) {
        for (const item of params.imageUris) {
          const uri =
            typeof item === "string"
              ? item
              : typeof item?.uri === "string"
                ? item.uri
                : "";
          if (uri.trim()) {
            files.push({ uri: uri.trim(), type: "image/jpeg", name: "photo.jpg" });
          }
        }
      }
      const response = await coreApi.gotBitten({
        message: params.message,
        images: files.length ? files : undefined,
      });
      if (response.error) {
        throw new ApiException(response.reason || "Request failed");
      }
      return response.data?.reply ?? "";
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
            if (
              err instanceof ImageProcessingError &&
              err.code === "TOO_LARGE"
            ) {
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

      const response = await coreApi.chat(message, files);

      if (response.error) {
        throw new ApiException(response.reason || "Chat failed");
      }

      // Handle empty response (known issue mentioned in API docs)
      if (!response.data.reply || response.data.reply.trim() === "") {
        const cannedResponses = [
          "Hmm, I need a moment to process that. Could you try again?",
          "Oops, something went wrong. Please resend your message.",
          "I'm having trouble responding right now. Mind trying once more?",
        ];
        return cannedResponses[
          Math.floor(Math.random() * cannedResponses.length)
        ];
      }

      return response.data.reply;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get mineral information
   */
  async getMushroomInfo(_mushroomId: string): Promise<string[]> {
    // TODO: Implement actual mushroom information retrieval
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          "Quartz is one of the most common minerals on Earth",
          "Composed of silicon dioxide (SiO₂)",
          "Forms in igneous, sedimentary, and metamorphic rocks",
          "Used in electronics, glass, and jewelry",
        ]);
      }, 500);
    });
  }

  /**
   * Diagnose rock type from image.
   * Use identifyMushroom for mushroom identification; this is for disease/diagnosis flows.
   */
  async diagnoseRock(_imageUri: string): Promise<DiagnosisResult> {
    return Promise.reject(
      new Error(
        "diagnoseRock is not implemented. Use identifyMushroom for mushroom identification."
      )
    );
  }
}

export const aiService = new AIService();
