/**
 * Published Apps Store
 * Fetches cross-promo apps list from PUBLISHED_APPS_URL (e.g. S3 list.json)
 */

import { create } from "zustand";
import { PUBLISHED_APPS_URL } from "../../constants/env";

export interface PublishedApp {
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  playstoreUrl?: string;
  appstoreUrl?: string;
}

export interface PublishedAppsError {
  message: string;
  status?: number;
  method: string;
}

interface PublishedAppsState {
  loading: boolean;
  result: PublishedApp[] | null;
  error: PublishedAppsError | null;
  status: number | null;
  managePublishedApps: () => Promise<PublishedApp[] | null>;
}

export const usePublishedAppsStore = create<PublishedAppsState>(
  (set, _get) => ({
    loading: true,
    result: null,
    error: null,
    status: null,

    managePublishedApps: async () => {
      set({ loading: true, error: null, result: null });

      try {
        if (!PUBLISHED_APPS_URL) {
          throw new Error("PUBLISHED_APPS_URL is not defined");
        }
        const response = await fetch(PUBLISHED_APPS_URL).then((res) =>
          res.json()
        );

        if (response?.error) {
          set({
            loading: false,
            error: {
              message: response.reason || "Something went wrong!",
              status: response.status || 400,
              method: "GET",
            },
          });
          return null;
        }

        const list = Array.isArray(response) ? response : response?.data ?? [];
        set({
          result: list,
          status: response?.status ?? 200,
          loading: false,
          error: null,
        });

        return list;
      } catch (err: any) {
        set({
          loading: false,
          error: {
            message: err?.message || "Something went wrong!",
            status: err?.status ?? 500,
            method: "GET",
          },
        });
        return null;
      }
    },
  })
);
