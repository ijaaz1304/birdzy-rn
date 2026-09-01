export const WIZARD_QUESTIONS = [
  "location",
  "date",
  "size",
] as const;

export type WizardQuestion = (typeof WIZARD_QUESTIONS)[number];

export type WizardRecentLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

export type WizardAnswers = {
  location: WizardRecentLocation | null;
  seenDate: string | null;
  sizeIndex: number | null;
  colors: string[];
  habitat: string | null;
};
