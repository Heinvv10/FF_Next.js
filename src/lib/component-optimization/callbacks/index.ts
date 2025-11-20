/**
 * Callback Optimization Hooks
 * Stable, debounced, and throttled callbacks
 */

import { useRef, useEffect, useCallback } from 'react';

/**
 * Stable callback hook
 * Creates a callback that never changes reference
 * but always has access to latest values
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(((...args) => {
    return callbackRef.current(...args);
  }) as T, []);
}

/**
 * Debounced callback
 * Delays execution until after wait milliseconds have elapsed
 * Useful for search inputs, resize handlers
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * Throttled callback
 * Limits execution to at most once per wait milliseconds
 * Useful for scroll handlers, mouse move events
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    }) as T,
    [callback, delay]
  );
}
