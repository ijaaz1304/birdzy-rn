/**
 * Draft birding region preference (product spec M — settings).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@birdzy/bird_region_preference";

export const BIRD_REGION_OPTIONS = [
  { id: "auto", label: "Use my location" },
  { id: "us-northeast", label: "US — Northeast" },
  { id: "us-southeast", label: "US — Southeast" },
  { id: "us-midwest", label: "US — Midwest" },
  { id: "us-west", label: "US — West" },
  { id: "uk-ireland", label: "UK & Ireland" },
  { id: "europe", label: "Europe" },
  { id: "global", label: "Global (all regions)" },
] as const;

export type BirdRegionId = (typeof BIRD_REGION_OPTIONS)[number]["id"];

export async function getBirdRegionPreference(): Promise<BirdRegionId> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const match = BIRD_REGION_OPTIONS.find((option) => option.id === stored);
  return match?.id ?? "auto";
}

export async function setBirdRegionPreference(regionId: BirdRegionId): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, regionId);
}

export function getBirdRegionLabel(regionId: BirdRegionId): string {
  return (
    BIRD_REGION_OPTIONS.find((option) => option.id === regionId)?.label ??
    BIRD_REGION_OPTIONS[0].label
  );
}
