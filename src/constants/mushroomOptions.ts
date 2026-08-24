/**
 * Bird catalogue filter labels and display helpers.
 * Values come from GET /core/archetypes/filteritems (Bird API).
 */

export const MUSHROOM_FILTER_FIELD_LABELS: Record<string, string> = {
  birdType: "Bird Type",
  habitat: "Habitat",
  conservationStatus: "Conservation Status",
  flightPattern: "Flight Pattern",
  flightAltitude: "Flight Altitude",
  diet: "Diet",
  lifeExpectancyInWild: "Life Expectancy",
  customLocation: "Location",
  "birdWatchingTips.bestTime": "Best Time to Watch",
  "birdWatchingTips.preferredLocations": "Preferred Locations",
  "scientificClassification.kingdom": "Kingdom",
  "scientificClassification.class": "Class",
  "scientificClassification.order": "Order",
  "scientificClassification.family": "Family",
  scientificClassification: "Scientific Classification",
};

export const BIRD_TYPE_LABELS: Record<string, string> = {
  raptor: "Raptor",
  songbird: "Songbird",
  waterbird: "Water Bird",
  shorebird: "Shorebird",
  seabird: "Seabird",
  gamebird: "Game Bird",
  owl: "Owl",
  hummingbird: "Hummingbird",
};

export const CONSERVATION_STATUS_LABELS: Record<string, string> = {
  least_concern: "Least Concern",
  near_threatened: "Near Threatened",
  vulnerable: "Vulnerable",
  endangered: "Endangered",
  critically_endangered: "Critically Endangered",
  extinct_in_the_wild: "Extinct in the Wild",
  extinct: "Extinct",
  data_deficient: "Data Deficient",
};

/** @deprecated Legacy mushroom identify UI — prefer conservationStatus for birds */
export const EDIBILITY_LABELS: Record<string, string> = {
  edible: "Edible",
  inedible: "Inedible",
  toxic: "Toxic",
  deadly: "Deadly",
};

/** @deprecated Legacy mushroom filters */
export const TOXICITY_SEVERITY_LABELS: Record<string, string> = {
  none: "None",
  mild: "Mild",
  severe: "Severe",
  "potentially fatal": "Potentially Fatal",
};

/** @deprecated Legacy mushroom filters */
export const PSYCHOACTIVE_LABELS: Record<string, string> = {
  yes: "Yes",
  no: "No",
};

export const MUSHROOM_SAFETY_DISCLAIMER =
  "Bird identification is for reference only. Always confirm sightings with a field guide or local expert before reporting rare or protected species.";

export const SAFETY_AI_REFERENCE_DISCLAIMER =
  "AI identification for reference only. Verify with a field guide or local expert.";

export const EMPTY_CHAT_CANNED_RESPONSES = [
  "Hmm, I need a moment to process that. Could you try again?",
  "Oops, something went wrong. Please resend your message.",
  "I'm having trouble responding right now. Mind trying once more?",
];
