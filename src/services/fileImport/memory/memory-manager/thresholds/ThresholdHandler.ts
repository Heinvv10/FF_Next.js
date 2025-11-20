/**
 * Threshold Handler
 * Checks memory thresholds and triggers appropriate actions
 */

import type { MemoryStats } from '../../types';
import { MEMORY_CONFIG } from '../config';
import { log } from '@/lib/logger';
import { emitMemoryEvent } from '../utils/eventEmitter';

export class ThresholdHandler {
  /**
   * Check memory thresholds and take action
   */
  public checkThresholds(
    stats: MemoryStats,
    onHighMemory?: () => void,
    onCriticalMemory?: () => void
  ): void {
    if (stats.heapTotal === 0) return;

    const usageRatio = stats.heapUsed / stats.heapTotal;

    if (usageRatio >= MEMORY_CONFIG.CRITICAL_THRESHOLD) {
      log.warn('Critical memory usage detected:', { data: usageRatio * 100 + '%' }, 'MemoryManager');
      this.handleCriticalMemory(stats);
      onCriticalMemory?.();
    } else if (usageRatio >= MEMORY_CONFIG.WARNING_THRESHOLD) {
      log.warn('High memory usage detected:', { data: usageRatio * 100 + '%' }, 'MemoryManager');
      this.handleHighMemory(stats);
      onHighMemory?.();
    }
  }

  /**
   * Handle high memory usage
   */
  private handleHighMemory(stats: MemoryStats): void {
    // Emit warning event
    emitMemoryEvent('warning', {
      level: 'high',
      usage: stats,
      suggestion: 'Consider processing data in smaller chunks'
    });
  }

  /**
   * Handle critical memory usage
   */
  private handleCriticalMemory(stats: MemoryStats): void {
    // Emit critical event
    emitMemoryEvent('critical', {
      level: 'critical',
      usage: stats,
      suggestion: 'Processing may fail due to memory constraints'
    });
  }
}
