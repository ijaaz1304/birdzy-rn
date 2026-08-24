/**
 * Back handler utility for managing Android back button behavior
 */

import { useEffect, useRef } from "react";
import { BackHandler } from "react-native";
export interface BackHandlerOptions {
  enabled?: boolean;
  onBackPress?: () => boolean | void | null | undefined;
  priority?: number;
}

interface BackHandlerSubscription {
  id: string;
  handler: () => boolean | void | null | undefined;
  priority: number;
}

/** Subscription returned by BackHandler.addEventListener; has .remove() (no removeEventListener in RN) */
type BackHandlerSubscriptionRef = { remove: () => void } | null;

class BackHandlerManager {
  private subscriptions: Map<string, BackHandlerSubscription> = new Map();
  private listener: (() => boolean) | null = null;
  private subscriptionRef: BackHandlerSubscriptionRef = null;

  subscribe(
    id: string,
    handler: () => boolean | void | null | undefined,
    priority: number = 0
  ): () => void {
    this.subscriptions.set(id, { id, handler, priority });
    this.updateListener();

    return () => {
      this.subscriptions.delete(id);
      this.updateListener();
    };
  }

  private updateListener() {
    // BackHandler.addEventListener returns a subscription with .remove(); there is no removeEventListener
    if (this.subscriptionRef) {
      this.subscriptionRef.remove();
      this.subscriptionRef = null;
    }
    this.listener = null;

    if (this.subscriptions.size === 0) {
      return;
    }

    // Sort by priority (higher priority first)
    const sorted = Array.from(this.subscriptions.values()).sort(
      (a, b) => b.priority - a.priority
    );

    this.listener = () => {
      for (const subscription of sorted) {
        const result = subscription.handler();
        if (result === true) {
          return true; // Handled, prevent default
        }
        if (result === false) {
          return false; // Not handled, allow default
        }
      }
      return false; // Default: allow back navigation
    };

    this.subscriptionRef = BackHandler.addEventListener(
      "hardwareBackPress",
      this.listener
    );
  }
}

const backHandlerManager = new BackHandlerManager();

/**
 * Hook to handle Android back button press
 * @param options Configuration options
 * @returns void
 *
 * @example
 * ```tsx
 * useBackHandler({
 *   enabled: true,
 *   onBackPress: () => {
 *     // Handle back press
 *     closeModal();
 *     return true; // Prevent default back behavior
 *   },
 *   priority: 10, // Higher priority handlers are called first
 * });
 * ```
 */
export const useBackHandler = (options: BackHandlerOptions = {}) => {
  const { enabled = true, onBackPress, priority = 0 } = options;

  const handlerRef = useRef(onBackPress);
  const idRef = useRef(`back-handler-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    handlerRef.current = onBackPress;
  }, [onBackPress]);

  useEffect(() => {
    if (!enabled || !onBackPress) {
      return;
    }

    const unsubscribe = backHandlerManager.subscribe(
      idRef.current,
      () => handlerRef.current?.(),
      priority
    );

    return unsubscribe;
  }, [enabled, priority]);
};

/**
 * Utility function to handle back press programmatically
 * Useful for custom back button implementations
 */
export const handleBackPress = (
  handler: () => boolean | void | null | undefined
): void => {
  handler();
};

/**
 * Check if back handler is available (Android only)
 */
export const isBackHandlerAvailable = (): boolean => {
  return (
    BackHandler !== null && typeof BackHandler.addEventListener === "function"
  );
};
