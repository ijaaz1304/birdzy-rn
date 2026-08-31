import {
  WIZARD_ANSWER_QUESTIONS,
  WIZARD_COLOR_OPTIONS,
  WIZARD_QUESTION_COUNT,
  WIZARD_SIZE_API_VALUES,
  WIZARD_SIZE_LABELS,
  WIZARD_SIZE_RANGES,
} from "../stepByStep.constants";
import type { WizardAnswers, WizardQuestion } from "../stepByStep.types";
import { WIZARD_QUESTIONS } from "../stepByStep.types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function isoDateToday(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function formatWizardDate(iso: string | null): string {
  const date = parseIsoDate(iso);
  if (!date) return "";
  return `${ordinal(date.getDate())} ${MONTH_NAMES[date.getMonth()]}, ${date.getFullYear()}`;
}

export function formatWizardMonthYear(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function wizardQuestionTitle(
  index: number,
  prompt: string
): string {
  return `Question ${index + 1}/${WIZARD_QUESTION_COUNT}: ${prompt}`;
}

export function wizardSizeApiValue(sizeIndex: number | null): string[] | undefined {
  if (sizeIndex == null) return undefined;
  const value = WIZARD_SIZE_API_VALUES[sizeIndex];
  return value ? [value] : undefined;
}

export function wizardSizeDisplay(sizeIndex: number | null): string {
  if (sizeIndex == null) return "";
  const label = WIZARD_SIZE_LABELS[sizeIndex];
  const range = WIZARD_SIZE_RANGES[sizeIndex];
  if (!label) return "";
  return range ? `${label} (${range})` : label;
}

export function wizardColorHex(color: string): string | undefined {
  return WIZARD_COLOR_OPTIONS.find(
    (option) => option.id.toLowerCase() === color.toLowerCase()
  )?.hex;
}

export type WizardAnswerRow = {
  question: WizardQuestion;
  number: number;
  title: string;
  value: string;
  colorHex?: string;
};

export function buildWizardAnswerRows(answers: WizardAnswers): WizardAnswerRow[] {
  const locationValue = answers.location?.label?.trim() ?? "";
  const dateValue = formatWizardDate(answers.seenDate);
  const sizeValue = wizardSizeDisplay(answers.sizeIndex);
  const colorValue = answers.colors[0] ?? "";
  const habitatValue = answers.habitat?.trim() ?? "";

  const values: Record<WizardQuestion, string> = {
    location: locationValue,
    date: dateValue,
    size: sizeValue,
    colors: colorValue,
    habitat: habitatValue,
  };

  return WIZARD_QUESTIONS.map((question, index) => ({
    question,
    number: index + 1,
    title: WIZARD_ANSWER_QUESTIONS[question],
    value: values[question],
    colorHex:
      question === "colors" && colorValue
        ? wizardColorHex(colorValue)
        : undefined,
  })).filter((row) => row.value.length > 0);
}

export function hasWizardQuestionAnswer(
  question: WizardQuestion,
  answers: WizardAnswers
): boolean {
  switch (question) {
    case "location":
      return Boolean(answers.location?.label);
    case "date":
      return Boolean(answers.seenDate);
    case "size":
      return answers.sizeIndex != null;
    case "colors":
      return answers.colors.length > 0;
    case "habitat":
      return Boolean(answers.habitat);
    default:
      return false;
  }
}
