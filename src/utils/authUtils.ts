/**
 * Authentication Utilities
 * Common functions for handling authentication state and waiting for auth
 */

import { useAuthStore } from "../features/auth/auth.store";

/**
 * Wait for authentication to complete
 * @param maxWaitTime Maximum time to wait in milliseconds (default: 5000ms)
 * @param checkInterval Interval to check auth state in milliseconds (default: 100ms)
 * @returns Promise that resolves when auth is ready or timeout
 */
export const waitForAuthentication = async (
  maxWaitTime: number = 5000,
  checkInterval: number = 100
): Promise<boolean> => {
  const { token, isLoading } = useAuthStore.getState();

  // If we already have a token, return immediately
  if (token) {
    return true;
  }

  // If auth is not loading, return immediately
  if (!isLoading) {
    return false;
  }

  // Wait for authentication to complete
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
    const currentState = useAuthStore.getState();

    // If we got a token, return true
    if (currentState.token) {
      return true;
    }

    // If auth is no longer loading and still no token, return false
    if (!currentState.isLoading && !currentState.token) {
      return false;
    }
  }

  // Timeout reached, check final state
  const finalState = useAuthStore.getState();
  return !!finalState.token;
};

/**
 * Check if authentication is ready (has token or not loading)
 * @returns boolean indicating if auth is ready
 */
export const isAuthReady = (): boolean => {
  const { token, isLoading } = useAuthStore.getState();
  return !!token || !isLoading;
};
