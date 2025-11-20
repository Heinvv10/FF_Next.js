/**
 * Memory Manager
 * Monitors and optimizes memory usage during file processing
 */

import type { MemoryStats } from '../types';
import { log } from '@/lib/logger';

export class MemoryManager {
  private memoryCheckInterval: number = 5000; // Check every 5 seconds
  private intervalId?: NodeJS.Timeout | number;
  private memoryHistory: MemoryStats[] = [];
  private readonly maxHistoryLength = 100;
  private warningThreshold = 0.8; // 80% of heap
  private criticalThreshold = 0.9; // 90% of heap

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.intervalId = setInterval(() => {
      const stats = this.getCurrentMemoryStats();
      this.recordMemoryStats(stats);
      this.checkMemoryThresholds(stats);
    }, this.memoryCheckInterval) as NodeJS.Timeout | number;
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId as NodeJS.Timeout);
      this.intervalId = undefined as any;
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
    if (this.memoryHistory.length > this.maxHistoryLength) {
      this.memoryHistory.shift();
    }
  }

  /**
   * Check memory thresholds and take action
   */
  private checkMemoryThresholds(stats: MemoryStats): void {
    if (stats.heapTotal === 0) return;

    const usageRatio = stats.heapUsed / stats.heapTotal;

    if (usageRatio >= this.criticalThreshold) {
      log.warn('Critical memory usage detected:', { data: usageRatio * 100 + '%' }, 'MemoryManager');
      this.handleCriticalMemory();
    } else if (usageRatio >= this.warningThreshold) {
      log.warn('High memory usage detected:', { data: usageRatio * 100 + '%' }, 'MemoryManager');
      this.handleHighMemory();
    }
  }

  /**
   * Handle high memory usage
   */
  private handleHighMemory(): void {
    // Suggest garbage collection
    this.suggestGarbageCollection();
    
    // Emit warning event
    this.emitMemoryEvent('warning', {
      level: 'high',
      usage: this.getCurrentMemoryStats(),
      suggestion: 'Consider processing data in smaller chunks'
    });
  }

  /**
   * Handle critical memory usage
   */
  private handleCriticalMemory(): void {
    // Force garbage collection if available
    this.forceGarbageCollection();
    
    // Clear any cached data
    this.clearCaches();
    
    // Emit critical event
    this.emitMemoryEvent('critical', {
      level: 'critical',
      usage: this.getCurrentMemoryStats(),
      suggestion: 'Processing may fail due to memory constraints'
    });
  }

  /**
   * Suggest garbage collection
   */
  private suggestGarbageCollection(): void {
    // In Node.js environments with --expose-gc flag
    if (typeof global !== 'undefined' && (global as any).gc) {
      (global as any).gc();
      return;
    }

    // In browsers with gc exposed (development mode)
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
      return;
    }

    // Fallback: create memory pressure to trigger natural GC
    this.createMemoryPressure();
  }

  /**
   * Force garbage collection
   */
  public forceGarbageCollection(): void {
    this.suggestGarbageCollection();
    
    // Additional cleanup strategies
    this.cleanupEventListeners();
    this.clearWeakReferences();
  }

  /**
   * Create memory pressure to encourage GC
   */
  private createMemoryPressure(): void {
    // Create and immediately discard large arrays to trigger GC
    for (let i = 0; i < 10; i++) {
      const pressure = new Array(100000).fill(0);
      // Let it be garbage collected automatically
      // Note: pressure will be garbage collected at the end of this block scope
      if (pressure.length === 0) {
        // This condition will never be true, but prevents the variable from being marked as unused
        throw new Error('Unexpected empty pressure array');
      }
    }
  }

  /**
   * Clear caches and temporary data
   */
  private clearCaches(): void {
    // Clear any internal caches
    this.memoryHistory = this.memoryHistory.slice(-10); // Keep only recent history
    
    // Emit cache clear event
    this.emitMemoryEvent('cache-cleared', {
      message: 'Internal caches cleared to free memory'
    });
  }

  /**
   * Clean up event listeners
   */
  private cleanupEventListeners(): void {
    // This would be implemented based on specific event listeners used
    // For now, just emit an event
    this.emitMemoryEvent('cleanup', {
      message: 'Event listeners cleanup performed'
    });
  }

  /**
   * Clear weak references
   */
  private clearWeakReferences(): void {
    // Implementation would depend on specific weak references used
    // For now, just emit an event
    this.emitMemoryEvent('weakref-cleared', {
      message: 'Weak references cleared'
    });
  }

  /**
   * Get peak memory usage from history
   */
  private getPeakUsage(): number {
    if (this.memoryHistory.length === 0) return 0;
    
    return Math.max(...this.memoryHistory.map(stats => stats.heapUsed));
  }

  /**
   * Get memory usage trend
   */
  public getMemoryTrend(): 'stable' | 'increasing' | 'decreasing' {
    if (this.memoryHistory.length < 5) return 'stable';

    const recent = this.memoryHistory.slice(-5);
    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;
    
    const change = (last - first) / first;
    
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Get memory recommendations
   */
  public getMemoryRecommendations(): string[] {
    const stats = this.getCurrentMemoryStats();
    const recommendations: string[] = [];

    if (stats.heapTotal === 0) {
      return ['Memory monitoring not available in this environment'];
    }

    const usageRatio = stats.heapUsed / stats.heapTotal;
    const trend = this.getMemoryTrend();

    if (usageRatio > this.warningThreshold) {
      recommendations.push('Consider processing data in smaller chunks');
      recommendations.push('Enable streaming mode for large files');
    }

    if (trend === 'increasing') {
      recommendations.push('Memory usage is trending upward - monitor closely');
      recommendations.push('Consider clearing unnecessary data structures');
    }

    if (this.memoryHistory.length > 50 && this.getPeakUsage() > stats.heapTotal * 0.95) {
      recommendations.push('Peak memory usage is very high - consider using Web Workers');
    }

    return recommendations.length > 0 ? recommendations : ['Memory usage is within normal limits'];
  }

  /**
   * Estimate memory needed for processing
   */
  public estimateMemoryNeeded(fileSize: number, fileType: string): number {
    const multipliers: Record<string, number> = {
      csv: 3,    // CSV typically expands 3x in memory
      xlsx: 5,   // Excel can expand 5x due to formatting and structure
      xls: 4,    // Legacy Excel format
      json: 2    // JSON is relatively compact
    };

    const multiplier = multipliers[fileType] || 3;
    return fileSize * multiplier;
  }

  /**
   * Check if processing is feasible with current memory
   */
  public canProcessFile(fileSize: number, fileType: string): {
    canProcess: boolean;
    reason?: string;
    suggestions: string[];
  } {
    const stats = this.getCurrentMemoryStats();
    const needed = this.estimateMemoryNeeded(fileSize, fileType);
    const available = stats.heapTotal - stats.heapUsed;
    const suggestions: string[] = [];

    if (stats.heapTotal === 0) {
      // Memory API not available
      return {
        canProcess: true,
        suggestions: ['Memory monitoring not available - proceed with caution']
      };
    }

    if (needed > available * 0.8) {
      suggestions.push('Use streaming mode to reduce memory usage');
      suggestions.push('Process file in smaller chunks');
      suggestions.push('Consider using Web Workers');

      if (needed > available * 1.2) {
        return {
          canProcess: false,
          reason: `Estimated memory needed (${this.formatBytes(needed)}) exceeds available memory (${this.formatBytes(available)})`,
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

  /**
   * Format bytes for human reading
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Emit memory event
   */
  private emitMemoryEvent(type: string, data: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`memory-${type}`, { detail: data }));
    }
  }

  /**
   * Get memory report
   */
  public getMemoryReport(): {
    current: MemoryStats;
    peak: number;
    trend: string;
    recommendations: string[];
    history: MemoryStats[];
  } {
    return {
      current: this.getCurrentMemoryStats(),
      peak: this.getPeakUsage(),
      trend: this.getMemoryTrend(),
      recommendations: this.getMemoryRecommendations(),
      history: [...this.memoryHistory]
    };
  }

  /**
   * Reset memory tracking
   */
  public reset(): void {
    this.memoryHistory = [];
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    this.reset();
  }

  /**
   * Destructor
   */
  public destroy(): void {
    this.cleanup();
  }
}