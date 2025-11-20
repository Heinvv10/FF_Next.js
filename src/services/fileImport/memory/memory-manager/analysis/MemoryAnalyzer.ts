/**
 * Memory Analyzer
 * Analyzes memory trends and provides recommendations
 */

import type { MemoryStats } from '../../types';
import { MEMORY_CONFIG } from '../config';

export class MemoryAnalyzer {
  /**
   * Get memory usage trend
   */
  public getTrend(history: MemoryStats[]): 'stable' | 'increasing' | 'decreasing' {
    if (history.length < MEMORY_CONFIG.MIN_HISTORY_FOR_TREND) return 'stable';

    const recent = history.slice(-MEMORY_CONFIG.RECENT_HISTORY_COUNT);
    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;

    const change = (last - first) / first;

    if (Math.abs(change) < MEMORY_CONFIG.STABLE_THRESHOLD) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Get memory recommendations
   */
  public getRecommendations(
    currentStats: MemoryStats,
    history: MemoryStats[],
    peakUsage: number
  ): string[] {
    const recommendations: string[] = [];

    if (currentStats.heapTotal === 0) {
      return ['Memory monitoring not available in this environment'];
    }

    const usageRatio = currentStats.heapUsed / currentStats.heapTotal;
    const trend = this.getTrend(history);

    if (usageRatio > MEMORY_CONFIG.WARNING_THRESHOLD) {
      recommendations.push('Consider processing data in smaller chunks');
      recommendations.push('Enable streaming mode for large files');
    }

    if (trend === 'increasing') {
      recommendations.push('Memory usage is trending upward - monitor closely');
      recommendations.push('Consider clearing unnecessary data structures');
    }

    if (history.length > 50 && peakUsage > currentStats.heapTotal * MEMORY_CONFIG.PEAK_THRESHOLD) {
      recommendations.push('Peak memory usage is very high - consider using Web Workers');
    }

    return recommendations.length > 0 ? recommendations : ['Memory usage is within normal limits'];
  }
}
