/**
 * Value Optimization Hooks
 * Memoization, previous values, and lazy initialization
 */

import { useRef, useEffect, useMemo } from 'react';

/**
 * Memoized value with dependencies
 * Wrapper around useMemo with better semantics
 */
export function useComputedValue<T>(
  compute: () => T,
  dependencies: React.DependencyList
): T {
  return useMemo(compute, dependencies);
}

/**
 * Previous value hook
 * Returns the previous value of a variable
 * Useful for detecting changes and animations
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Compare and re-render only if changed
 * Returns true if value has changed since last render
 */
export function useChanged<T>(value: T): boolean {
  const prev = usePrevious(value);
  return prev !== value;
}

/**
 * Lazy initialization hook
 * Initializes a value only once (on first render)
 * Useful for expensive initialization
 */
export function useLazyInit<T>(init: () => T): T {
  const ref = useRef<T>();

  if (ref.current === undefined) {
    ref.current = init();
  }

  return ref.current;
}
