/**
 * Component Optimization Utilities
 * Story 3.3: Frontend Performance Optimization
 *
 * React performance optimization helpers
 */

import { memo, useMemo, useCallback, useRef, useEffect, ComponentType } from 'react';

/**
 * Deep comparison memo
 * Use for components with complex props
 */
export function deepMemo<T extends ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prev: any, next: any) => boolean
): T {
  return memo(Component, propsAreEqual || deepEqual) as T;
}

/**
 * Deep equality check
 */
function deepEqual(prev: any, next: any): boolean {
  return JSON.stringify(prev) === JSON.stringify(next);
}

/**
 * Shallow comparison memo (React.memo default behavior)
 * Best for simple props
 */
export function shallowMemo<T extends ComponentType<any>>(Component: T): T {
  return memo(Component) as T;
}

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
 * Returns true if value has changed
 */
export function useChanged<T>(value: T): boolean {
  const prev = usePrevious(value);
  return prev !== value;
}

/**
 * Lazy initialization hook
 * Initializes a value only once
 */
export function useLazyInit<T>(init: () => T): T {
  const ref = useRef<T>();

  if (ref.current === undefined) {
    ref.current = init();
  }

  return ref.current;
}

/**
 * Optimized list rendering wrapper
 * Memoizes list items to prevent unnecessary re-renders
 */
export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'No items',
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
}) {
  const renderedItems = useMemo(
    () =>
      items.map((item, index) => (
        <MemoizedListItem
          key={keyExtractor(item, index)}
          item={item}
          index={index}
          renderItem={renderItem}
        />
      )),
    [items, renderItem, keyExtractor]
  );

  if (items.length === 0) {
    return <div className="text-center text-gray-500 py-8">{emptyMessage}</div>;
  }

  return <>{renderedItems}</>;
}

/**
 * Memoized list item component
 */
const MemoizedListItem = memo(
  function ListItem<T>({
    item,
    index,
    renderItem,
  }: {
    item: T;
    index: number;
    renderItem: (item: T, index: number) => React.ReactNode;
  }) {
    return <>{renderItem(item, index)}</>;
  },
  (prev, next) => {
    return prev.item === next.item && prev.index === next.index;
  }
);

/**
 * Virtualized list hook
 * For rendering large lists efficiently
 */
export function useVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = React.useMemo(
    () => Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i),
    [startIndex, endIndex]
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []),
  };
}

/**
 * Intersection Observer hook
 * For lazy loading images or components
 */
export function useIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    observerRef.current = new IntersectionObserver(callback, options);
    return () => observerRef.current?.disconnect();
  }, [callback, options]);

  const observe = useCallback((element: Element) => {
    observerRef.current?.observe(element);
  }, []);

  const unobserve = useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
  }, []);

  return { observe, unobserve };
}

/**
 * Lazy image component
 * Only loads image when visible in viewport
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  onLoad,
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isVisible ? src : undefined}
      alt={alt}
      className={className}
      onLoad={onLoad}
      loading="lazy"
    />
  );
});

/**
 * Performance monitor component
 * Logs render times in development
 */
export function withPerformanceMonitor<P extends object>(
  Component: ComponentType<P>,
  name: string
): ComponentType<P> {
  if (process.env.NODE_ENV !== 'development') {
    return Component;
  }

  return function PerformanceMonitoredComponent(props: P) {
    const renderCount = useRef(0);
    const startTime = useRef(0);

    useEffect(() => {
      renderCount.current++;
      const renderTime = performance.now() - startTime.current;
      console.log(
        `[Performance] ${name} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
      );
    });

    startTime.current = performance.now();

    return <Component {...props} />;
  };
}

/**
 * Render count tracker
 * For debugging unnecessary re-renders
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[RenderCount] ${componentName}: ${renderCount.current}`);
    }
  });

  return renderCount.current;
}

/**
 * Why did you update hook
 * Logs which props caused a re-render
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current && process.env.NODE_ENV === 'development') {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidYouUpdate] ${name}`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// Re-export React's optimization hooks for convenience
export { memo, useMemo, useCallback } from 'react';
