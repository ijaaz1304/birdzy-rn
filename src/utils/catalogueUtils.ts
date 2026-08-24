/**
 * Catalogue display utilities
 * - Random order for the first 100 when showing from cache/state
 */

/**
 * Returns a new array with items in random order (Fisher–Yates).
 * Used to randomize the first 100 catalogue items for variety on each load.
 */
export function getRandomizedCatalogueListing<T>(items: T[]): T[] {
  if (!items || items.length <= 1) return items ? [...items] : [];
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
