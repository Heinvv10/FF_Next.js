/**
 * Processing Estimator
 * Estimates memory requirements for file processing
 */

import type { MemoryStats } from '../../types';
import { MEMORY_CONFIG } from '../config';
import { formatBytes } from '../utils/formatters';

export interface ProcessingCapability {
  canProcess: boolean;
  reason?: string;
  suggestions: string[];
}

export class ProcessingEstimator {
  /**
   * Estimate memory needed for processing
   */
  public estimateMemoryNeeded(fileSize: number, fileType: string): number {
    const multiplier = MEMORY_CONFIG.FILE_MULTIPLIERS[fileType] || 3;
    return fileSize * multiplier;
  }

  /**
   * Check if processing is feasible with current memory
   */
  public canProcessFile(
    fileSize: number,
    fileType: string,
    currentStats: MemoryStats
  ): ProcessingCapability {
    const needed = this.estimateMemoryNeeded(fileSize, fileType);
    const available = currentStats.heapTotal - currentStats.heapUsed;
    const suggestions: string[] = [];

    if (currentStats.heapTotal === 0) {
      // Memory API not available
      return {
        canProcess: true,
        suggestions: ['Memory monitoring not available - proceed with caution']
      };
    }

    if (needed > available * MEMORY_CONFIG.HIGH_MEMORY_THRESHOLD) {
      suggestions.push('Use streaming mode to reduce memory usage');
      suggestions.push('Process file in smaller chunks');
      suggestions.push('Consider using Web Workers');

      if (needed > available * MEMORY_CONFIG.CANNOT_PROCESS_THRESHOLD) {
        return {
          canProcess: false,
          reason: `Estimated memory needed (${formatBytes(needed)}) exceeds available memory (${formatBytes(available)})`,
          suggestions
        };
      }

      return {
        canProcess: true,
        reason: 'Memory usage will be high',
        suggestions
      };
    }

    return {
      canProcess: true,
      suggestions: ['Memory usage should be within acceptable limits']
    };
  }
}
