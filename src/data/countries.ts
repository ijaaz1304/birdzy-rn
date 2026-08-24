import type { DropdownOption } from "../molecules/Dropdown/Dropdown";
import type { Country } from "./countries.types";

export type { Country } from "./countries.types";

export function toCountryDropdownOptions(
  countries: Country[]
): DropdownOption[] {
  return [...countries]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((country) => ({
      label: country.name,
      value: country.code,
    }));
}

export function getCountryNameByCode(
  countries: Country[],
  code: string
): string | undefined {
  return countries.find(
    (country) => country.code.toLowerCase() === code.toLowerCase()
  )?.name;
}
