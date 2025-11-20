/**
 * Memory Monitor
 * Core memory monitoring and statistics tracking
 */

import type { MemoryStats } from '../../types';
import { MEMORY_CONFIG } from '../config';

export class MemoryMonitor {
  private intervalId?: NodeJS.Timeout | number;
  private memoryHistory: MemoryStats[] = [];
  private onStatsCallback?: (stats: MemoryStats) => void;

  /**
   * Start memory monitoring
   */
  public startMonitoring(callback?: (stats: MemoryStats) => void): void {
    if (typeof window === 'undefined') return;

    this.onStatsCallback = callback;

    this.intervalId = setInterval(() => {
      const stats = this.getCurrentMemoryStats();
      this.recordMemoryStats(stats);

      if (this.onStatsCallback) {
        this.onStatsCallback(stats);
      }
    }, MEMORY_CONFIG.CHECK_INTERVAL) as NodeJS.Timeout | number;
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId as NodeJS.Timeout);
      this.intervalId = undefined;
    }
  }

  /**
   * Get current memory statistics
   */
  public getCurrentMemoryStats(): MemoryStats {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: 0, // Not available in browser
        peakUsage: Math.max(
          memory.usedJSHeapSize,
          this.getPeakUsage()
        )
      };
    }

    // Fallback for environments without memory API
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      peakUsage: 0
    };
  }

  /**
   * Record memory statistics in history
   */
  private recordMemoryStats(stats: MemoryStats): void {
    this.memoryHistory.push({
      ...stats,
      gcCount: this.memoryHistory.length // Simple counter for history
    });

    // Keep history within limits
    if (this.memoryHistory.length > MEMORY_CONFIG.MAX_HISTORY_LENGTH) {
      this.memoryHistory.shift();
    }
  }

  /**
   * Get peak memory usage from history
   */
  public getPeakUsage(): number {
    if (this.memoryHistory.length === 0) return 0;

    return Math.max(...this.memoryHistory.map(stats => stats.heapUsed));
  }

  /**
   * Get memory history
   */
  public getHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * Trim memory history (for cleanup)
   */
  public trimHistory(keepLast: number = MEMORY_CONFIG.EMERGENCY_HISTORY_COUNT): void {
    this.memoryHistory = this.memoryHistory.slice(-keepLast);
  }

  /**
   * Reset memory tracking
   */
  public reset(): void {
    this.memoryHistory = [];
  }

  /**
   * Check if monitoring is active
   */
  public isMonitoring(): boolean {
    return this.intervalId !== undefined;
  }
}
