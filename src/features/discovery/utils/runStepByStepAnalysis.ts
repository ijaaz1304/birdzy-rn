import { archetypeService } from "../../../services/archetype/archetype.service";
import { resolveBirdDiscoveryLocation } from "../../../utils/birdDiscoveryLocation.helpers";
import type { PossibleMatchListItem } from "../../../utils/mushroomApiMappers";
import { useStepByStepStore } from "../stepByStep.store";
import { wizardSizeApiValue, toWizardSeenDateIso } from "./stepByStepAnswers";
import { mapStepByStepItemToPossibleMatch } from "./mapStepByStepMatches";

export async function fetchStepByStepMatches(): Promise<PossibleMatchListItem[]> {
  const { answers } = useStepByStepStore.getState();
  const stored = answers.location;
  const discovery = stored
    ? {
        coords: [stored.latitude, stored.longitude] as [number, number],
        source: "gps" as const,
        label: stored.label,
        regionId: "auto" as const,
      }
    : await resolveBirdDiscoveryLocation();

  if (!discovery) {
    throw new Error("location-required");
  }

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

  return data.map(mapStepByStepItemToPossibleMatch);
}
