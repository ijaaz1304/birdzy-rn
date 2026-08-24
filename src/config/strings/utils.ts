/**
 * String Utilities
 * Helper functions for string manipulation
 */

/**
 * Format a template string with placeholders
 * @example formatString('Hello {name}', { name: 'World' }) => 'Hello World'
 */
export const formatString = (
  template: string,
  values: Record<string, string | number>
): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key]?.toString() ?? match;
  });
};

/**
 * English ordinal for a positive integer (1 → 1st, 2 → 2nd, 3 → 3rd, 4 → 4th).
 */
export const getOrdinal = (n: number): string => {
  const abs = Math.abs(Math.trunc(n));
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${abs}th`;
  switch (abs % 10) {
    case 1:
      return `${abs}st`;
    case 2:
      return `${abs}nd`;
    case 3:
      return `${abs}rd`;
    default:
      return `${abs}th`;
  }
};

/**
 * Pluralize a string based on count
 * @example pluralize('item', 'items', 1) => 'item'
 * @example pluralize('item', 'items', 5) => 'items'
 */
export const pluralize = (
  singular: string,
  plural: string,
  count: number
): string => {
  return count === 1 ? singular : plural;
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
