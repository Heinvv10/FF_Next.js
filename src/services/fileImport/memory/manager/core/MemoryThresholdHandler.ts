/**
 * Memory Threshold Handler
 * Monitors memory thresholds and triggers appropriate responses
 */

import type { MemoryStats, MemoryThresholds } from '../types/memory-manager.types';
import { calculateUsageRatio } from '../utils/memoryUtils';
import { emitMemoryEvent } from '../utils/memoryEvents';
import { log } from '@/lib/logger';

export class MemoryThresholdHandler {
  private warningThreshold: number;
  private criticalThreshold: number;

  constructor(thresholds: MemoryThresholds = { warning: 0.8, critical: 0.9 }) {
    this.warningThreshold = thresholds.warning;
    this.criticalThreshold = thresholds.critical;
  }

  /**
   * Check memory thresholds and take action
   */
  public checkThresholds(
    stats: MemoryStats,
    onHighMemory: () => void,
    onCriticalMemory: () => void
  ): void {
    if (stats.heapTotal === 0) return;

    const usageRatio = calculateUsageRatio(stats.heapUsed, stats.heapTotal);

    if (usageRatio >= this.criticalThreshold) {
      log.warn('Critical memory usage detected:', { data: usageRatio * 100 + '%' }, 'MemoryManager');
      onCriticalMemory();
    } else if (usageRatio >= this.warningThreshold) {
      log.warn('High memory usage detected:', { data: usageRatio * 100 + '%' }, 'MemoryManager');
      onHighMemory();
    }
  }

  /**
   * Handle high memory usage
   */
  public handleHighMemory(stats: MemoryStats): void {
    emitMemoryEvent('warning', {
      level: 'high',
      usage: stats,
      suggestion: 'Consider processing data in smaller chunks'
    });
  }

  /**
   * Handle critical memory usage
   */
  public handleCriticalMemory(stats: MemoryStats): void {
    emitMemoryEvent('critical', {
      level: 'critical',
      usage: stats,
      suggestion: 'Processing may fail due to memory constraints'
    });
  }

  /**
   * Update thresholds
   */
  public updateThresholds(thresholds: Partial<MemoryThresholds>): void {
    if (thresholds.warning !== undefined) {
      this.warningThreshold = thresholds.warning;
    }
    if (thresholds.critical !== undefined) {
      this.criticalThreshold = thresholds.critical;
    }
  }

  /**
   * Get current thresholds
   */
  public getThresholds(): MemoryThresholds {
    return {
      warning: this.warningThreshold,
      critical: this.criticalThreshold
    };
  }
}
