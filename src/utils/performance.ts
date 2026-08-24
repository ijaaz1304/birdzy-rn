/**
 * Performance utilities for optimizing React Native app performance
 * Especially important for Android which can be slower than iOS
 */

import { InteractionManager } from "react-native";
/**
 * Run a function after all interactions have completed
 * Use this for heavy operations that don't need to block the UI
 */
export const runAfterInteractions = (callback: () => void) => {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
};

/**
 * Throttle a function to limit how often it can be called
 * Useful for scroll handlers, resize handlers, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Debounce a function to delay execution until after a period of inactivity
 * Useful for search inputs, API calls, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Optimized timer that uses requestAnimationFrame when possible
 * Falls back to setInterval for compatibility
 */
export const createOptimizedTimer = (
  callback: () => void,
  interval: number
): (() => void) => {
  let rafId: number | null = null;
  let intervalId: NodeJS.Timeout | null = null;
  let lastTime = Date.now();

  const tick = () => {
    const now = Date.now();
    if (now - lastTime >= interval) {
      callback();
      lastTime = now;
    }
    rafId = requestAnimationFrame(tick);
  };

  // Use requestAnimationFrame for better performance (60fps max)
  // For intervals > 16ms, use setInterval
  if (interval <= 16) {
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  } else {
    intervalId = setInterval(callback, interval);
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }
};
