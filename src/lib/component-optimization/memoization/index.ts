/**
 * Memoization Utilities
 * Deep and shallow memoization for React components
 */

import { memo, ComponentType } from 'react';

/**
 * Deep equality check using JSON stringification
 */
export function deepEqual(prev: any, next: any): boolean {
  return JSON.stringify(prev) === JSON.stringify(next);
}

/**
 * Deep comparison memo
 * Use for components with complex props that need deep comparison
 */
export function deepMemo<T extends ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prev: any, next: any) => boolean
): T {
  return memo(Component, propsAreEqual || deepEqual) as T;
}

/**
 * Shallow comparison memo (React.memo default behavior)
 * Best for simple props - most performant option
 */
export function shallowMemo<T extends ComponentType<any>>(Component: T): T {
  return memo(Component) as T;
}
