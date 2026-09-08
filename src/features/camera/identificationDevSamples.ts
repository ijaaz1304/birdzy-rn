/**
 * Dev-only sample identification results for UI testing when the API
 * is unavailable, returns empty matches, or times out.
 */

import { isDevIntent } from "../../lib/env/appEnv";
import type { PossibleMatchListItem } from "../../utils/mushroomApiMappers";

const SAMPLE_IMAGE =
  "https://storage.googleapis.com/minerals-app-480613.firebasestorage.app/scraped/mindat_images/basalt/Basalt0.png";

export function shouldUseIdentificationDevSamples(): boolean {
  return isDevIntent();
}

export function getDevIdentificationSampleMatches(): PossibleMatchListItem[] {
  return [
    {
      id: "dev-sample-robin",
      _id: "dev-sample-robin",
      name: "American Robin",
      commonName: "American Robin",
      scientificName: "Turdus migratorius",
      accuracy: 87,
      similarityScore: 0.87,
      image: SAMPLE_IMAGE,
      images: [SAMPLE_IMAGE],
    },
    {
      id: "dev-sample-cardinal",
      _id: "dev-sample-cardinal",
      name: "Northern Cardinal",
      commonName: "Northern Cardinal",
      scientificName: "Cardinalis cardinalis",
      accuracy: 72,
      similarityScore: 0.72,
      image: SAMPLE_IMAGE,
      images: [SAMPLE_IMAGE],
    },
    {
      id: "dev-sample-sparrow",
      _id: "dev-sample-sparrow",
      name: "House Sparrow",
      commonName: "House Sparrow",
      scientificName: "Passer domesticus",
      accuracy: 61,
      similarityScore: 0.61,
      image: SAMPLE_IMAGE,
      images: [SAMPLE_IMAGE],
    },
  ];
}

export function getDevSoundIdentificationExtras(): {
  soundUrls: string[];
  imageUrls: string[];
} {
  return {
    soundUrls: ["https://example.dev/birdzy/sample-recording.m4a"],
    imageUrls: [SAMPLE_IMAGE],
  };
}
