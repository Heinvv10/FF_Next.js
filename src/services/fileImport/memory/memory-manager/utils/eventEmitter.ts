/**
 * Event Emitter
 * Utility for emitting memory-related events
 */

/**
 * Emit memory event
 */
export function emitMemoryEvent(type: string, data: any): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(`memory-${type}`, { detail: data }));
  }
}
