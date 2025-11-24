/**
 * Memory Events
 * Utilities for emitting memory-related events
 */

import type { MemoryEventType, MemoryEventData } from '../types/memory-manager.types';

/**
 * Emit memory event to window
 */
export function emitMemoryEvent(type: MemoryEventType, data: MemoryEventData): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(`memory-${type}`, { detail: data })
    );
  }
}

/**
 * Listen to memory events
 */
export function onMemoryEvent(
  type: MemoryEventType,
  callback: (data: MemoryEventData) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op cleanup function
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<MemoryEventData>;
    callback(customEvent.detail);
  };

  window.addEventListener(`memory-${type}`, handler);

  // Return cleanup function
  return () => {
    window.removeEventListener(`memory-${type}`, handler);
  };
}
