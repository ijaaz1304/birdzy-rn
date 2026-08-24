/**
 * Optimized State Update Utilities
 * Helps with batching and optimizing Zustand store updates
 */

/**
 * Batch multiple state updates into a single update
 * Reduces re-renders and improves performance
 */
export const batchUpdates = <T>(
  updates: Array<Partial<T>>,
  setState: (updates: Partial<T>) => void
): void => {
  // Merge all updates into a single object
  const merged = updates.reduce(
    (acc, update) => ({ ...acc, ...update }),
    {} as Partial<T>
  );
  setState(merged);
};

/**
 * Create an optimized setter that batches updates
 */
export const createBatchedSetter = <T>(
  setState: (updates: Partial<T>) => void
): ((updates: Partial<T> | Array<Partial<T>>) => void) => {
  return (updates: Partial<T> | Array<Partial<T>>) => {
    if (Array.isArray(updates)) {
      batchUpdates(updates, setState);
    } else {
      setState(updates);
    }
  };
};

/**
 * Debounce state updates to prevent excessive re-renders
 */
export const createDebouncedSetter = <T>(
  setState: (updates: Partial<T>) => void,
  delay: number = 100
): ((updates: Partial<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingUpdates: Partial<T> = {} as Partial<T>;

  return (updates: Partial<T>) => {
    pendingUpdates = { ...pendingUpdates, ...updates };

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      setState(pendingUpdates);
      pendingUpdates = {} as Partial<T>;
      timeoutId = null;
    }, delay);
  };
};

/**
 * Optimistic update helper - update UI immediately, rollback on error
 */
export const optimisticUpdate = async <T>(
  optimisticState: Partial<T>,
  setState: (updates: Partial<T>) => void,
  asyncOperation: () => Promise<Partial<T>>,
  rollbackState: Partial<T>
): Promise<void> => {
  // Apply optimistic update immediately
  setState(optimisticState);

  try {
    // Perform async operation
    const result = await asyncOperation();
    // Update with real result
    setState(result);
  } catch (error) {
    // Rollback on error
    setState(rollbackState);
    throw error;
  }
};
