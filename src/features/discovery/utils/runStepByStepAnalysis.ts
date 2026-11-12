import { archetypeService } from "../../../services/archetype/archetype.service";
import type { PossibleMatchListItem } from "../../../utils/mushroomApiMappers";
import { useStepByStepStore } from "../stepByStep.store";
import { wizardSizeApiValue, toWizardSeenDateIso } from "./stepByStepAnswers";
import { mapStepByStepItemToPossibleMatch } from "./mapStepByStepMatches";

/**
 * Runs the step-by-step search after the wizard finishes.
 *
 * Body fields here are currently ignored: `archetype.service.stepByStep`
 * forces `STEP_BY_STEP_TEST_REQUEST` for every search. Location resolution
 * is skipped so a missing GPS fix cannot leave DiagnosisLoading spinning.
 * Restore resolveBirdDiscoveryLocation + real answers when removing the
 * test payload.
 */
export async function fetchStepByStepMatches(): Promise<
  PossibleMatchListItem[]
> {
  const { answers } = useStepByStepStore.getState();

  const { data } = await archetypeService.stepByStep(
    {
      location: {
        lat: answers.location?.latitude ?? 0,
        lng: answers.location?.longitude ?? 0,
      },
      seenDate: toWizardSeenDateIso(answers.seenDate),
      birdSize: wizardSizeApiValue(answers.sizeIndex),
    },
    { pageNo: 1, pageSize: 60 }
  );

  return data.map(mapStepByStepItemToPossibleMatch);
}
