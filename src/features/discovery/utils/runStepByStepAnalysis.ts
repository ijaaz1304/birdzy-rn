import { archetypeService } from "../../../services/archetype/archetype.service";
import { resolveBirdDiscoveryLocation } from "../../../utils/birdDiscoveryLocation.helpers";
import type { PossibleMatchListItem } from "../../../utils/mushroomApiMappers";
import { useStepByStepStore } from "../stepByStep.store";
import { wizardSizeApiValue, toWizardSeenDateIso } from "./stepByStepAnswers";
import { mapStepByStepItemToPossibleMatch } from "./mapStepByStepMatches";
import {
  getDevIdentificationSampleMatches,
  shouldUseIdentificationDevSamples,
} from "../../camera/identificationDevSamples";

export async function fetchStepByStepMatches(): Promise<PossibleMatchListItem[]> {
  const { answers } = useStepByStepStore.getState();
  const stored = answers.location;
  let discovery = stored
    ? {
        coords: [stored.latitude, stored.longitude] as [number, number],
        source: "gps" as const,
        label: stored.label,
        regionId: "auto" as const,
      }
    : await resolveBirdDiscoveryLocation();

  if (!discovery) {
    discovery = {
      coords: [30, 0],
      source: "global",
      label: "Global",
      regionId: "global",
    };
  }

  try {
    const { data } = await archetypeService.stepByStep(
      {
        location: {
          lat: discovery.coords[0],
          lng: discovery.coords[1],
        },
        seenDate: toWizardSeenDateIso(answers.seenDate),
        birdSize: wizardSizeApiValue(answers.sizeIndex),
        region: discovery.source !== "gps" ? discovery.regionId : undefined,
      },
      { pageNo: 0, pageSize: 60 }
    );

    const mapped = data.map(mapStepByStepItemToPossibleMatch);
    if (mapped.length > 0) return mapped;

    if (shouldUseIdentificationDevSamples()) {
      console.warn(
        "[StepByStep] API returned no matches — using dev sample results"
      );
      return getDevIdentificationSampleMatches();
    }

    return mapped;
  } catch (error) {
    if (shouldUseIdentificationDevSamples()) {
      console.warn(
        "[StepByStep] API failed — using dev sample results",
        (error as Error)?.message ?? error
      );
      return getDevIdentificationSampleMatches();
    }
    throw error;
  }
}
