/**
 * Normalize app/navigation source values for Firebase Analytics params.
 */

const SOURCE_ALIASES: Record<string, string> = {
  rockOfTheDay: "bird_of_the_day",
  mushroomOfTheDay: "bird_of_the_day",
  birdOfTheDay: "bird_of_the_day",
  rock_of_the_day: "bird_of_the_day",
  mushroom_of_the_day: "bird_of_the_day",
  mineral_of_the_day: "bird_of_the_day",
  rock_personality: "bird_personality",
  which_rock_quiz: "which_bird_quiz",
  which_mushroom_quiz: "which_bird_quiz",
};

export function toAnalyticsSource(source?: string | null): string {
  if (!source?.trim()) return "unknown";
  const trimmed = source.trim();
  return SOURCE_ALIASES[trimmed] ?? trimmed;
}
