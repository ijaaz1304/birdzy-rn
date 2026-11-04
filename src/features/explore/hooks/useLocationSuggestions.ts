import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchAddressSuggestions,
  GeocodingSearchResult,
} from "@/features/explore/utils/geocodingApi";

/** Shared freshness and cancellation rules for both location entry surfaces. */
export function useLocationSuggestions(query: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<GeocodingSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const cancel = useCallback(() => controller.current?.abort(), []);
  useEffect(() => {
    const request = new AbortController();
    controller.current = request;
    setSuggestions([]);
    setError(null);
    const canSearch = enabled && query.trim().length >= 3;
    setIsLoading(canSearch);
    if (!canSearch) return () => request.abort();
    const timer = setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(query, {
          signal: request.signal,
          throwOnError: true,
        });
        if (!request.signal.aborted) setSuggestions(results);
      } catch (cause) {
        if (!request.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to search locations. Please try again."
          );
      } finally {
        if (!request.signal.aborted) setIsLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      request.abort();
    };
  }, [query, enabled]);
  return { suggestions, isLoading, error, cancel };
}
