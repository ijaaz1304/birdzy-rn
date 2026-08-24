/**
 * Countries Store
 * Fetches country list from COUNTRIES_JSON_URL (e.g. S3 countries.json)
 */

import { create } from "zustand";
import { COUNTRIES_JSON_URL } from "../constants/env";
import type { DropdownOption } from "../molecules/Dropdown/Dropdown";
import countriesFallback from "./countries.json";
import type { Country } from "./countries.types";

function toDropdownOptions(countries: Country[]): DropdownOption[] {
  return [...countries]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((country) => ({
      label: country.name,
      value: country.code,
    }));
}

const fallbackCountries = countriesFallback as Country[];

interface CountriesState {
  loading: boolean;
  countries: Country[];
  dropdownOptions: DropdownOption[];
  error: string | null;
  loadCountries: () => Promise<Country[]>;
}

export const useCountriesStore = create<CountriesState>((set, get) => ({
  loading: false,
  countries: fallbackCountries,
  dropdownOptions: toDropdownOptions(fallbackCountries),
  error: null,

  loadCountries: async () => {
    if (get().loading) return get().countries;

    set({ loading: true, error: null });

    try {
      if (!COUNTRIES_JSON_URL) {
        throw new Error("COUNTRIES_JSON_URL is not defined");
      }

      const response = await fetch(COUNTRIES_JSON_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch countries (${response.status})`);
      }

      const data = await response.json();
      const countries = Array.isArray(data) ? (data as Country[]) : [];

      if (countries.length === 0) {
        throw new Error("Country list is empty");
      }

      set({
        countries,
        dropdownOptions: toDropdownOptions(countries),
        loading: false,
        error: null,
      });

      return countries;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load countries";

      set({
        countries: fallbackCountries,
        dropdownOptions: toDropdownOptions(fallbackCountries),
        loading: false,
        error: message,
      });

      return fallbackCountries;
    }
  },
}));
