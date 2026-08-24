/**
 * Utility functions
 */

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(d);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert SNAKE_CASE or ALL CAPS to title case (e.g. SOAP_AND_WATER → Soap And Water).
 * Use for cleaning tips method names and status labels.
 */
export const formatTitleCase = (value: string): string => {
  if (!value || typeof value !== "string") return value;
  const withSpaces = value.replace(/_/g, " ").trim();
  if (!withSpaces) return value;
  return withSpaces.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Truncate string
 */
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = <T = any>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Format a countdown segment (hours, minutes, seconds) as 2-digit string (e.g. 5 → "05").
 * Used by discount banners, subscription countdowns, etc.
 */
export const formatCountdownSegment = (value: number): string => {
  return value.toString().padStart(2, "0");
};

/**
 * Back handler utilities
 */
export * from "./backHandler";

/**
 * Navigation utilities
 */
export * from "./navigation";

// Weather utilities removed - not needed for rocks/minerals app
export * from "./googleMapsApi";
export * from "./locationService";
export * from "./staticMapApi";
export * from "./countryCoordinates";
export * from "./authUtils";
export * from "./catalogueUtils";
export * from "./mushroomDisplayUtils";
export * from "./mushroomCardUtils";
