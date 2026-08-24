/**
 * Default query flags for GET /core/archetypes/filteritems.
 * @see docs/API_DOMAIN_MAPPING.md
 */
import type { BirdArchetypeFilterParams } from "../services/api/features/bird.api.types";

export const BIRD_ARCHETYPE_FILTER_DEFAULTS: BirdArchetypeFilterParams = {
  birdType: true,
  habitat: true,
  conservationStatus: true,
  flightPattern: true,
  flightAltitude: true,
  diet: true,
  lifeExpectancyInWild: true,
  customLocation: true,
  "birdWatchingTips.bestTime": true,
  "birdWatchingTips.preferredLocations": true,
  "scientificClassification.kingdom": true,
  "scientificClassification.class": true,
  "scientificClassification.order": true,
  "scientificClassification.family": true,
};
