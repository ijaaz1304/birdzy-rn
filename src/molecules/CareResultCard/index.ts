/**
 * Care Result Card Components
 * Both "before" (prompt) and "after" (result) cards
 */

// Base component
export { CareResultCard } from "./CareResultCard";
export type { CareResultCardProps } from "./CareResultCard";

// Result Cards (shown AFTER measurement/calculation)
export { DiseaseResultCard } from "./DiseaseResultCard";
export type { DiseaseResultCardProps } from "./DiseaseResultCard";

// Prompt Cards (shown BEFORE measurement/calculation)
// LightPromptCard removed - not needed for rocks/minerals app
// export { LightPromptCard } from './LightPromptCard';
// export type { LightPromptCardProps } from './LightPromptCard';

export { DiseasePromptCard } from "./DiseasePromptCard";
export type { DiseasePromptCardProps } from "./DiseasePromptCard";
