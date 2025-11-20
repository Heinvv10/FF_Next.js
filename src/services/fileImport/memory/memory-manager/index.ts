/**
 * Memory Manager - Main Orchestrator
 * Integrates all memory management modules
 */

import type { MemoryStats } from '../types';
import { MemoryMonitor } from './monitoring/MemoryMonitor';
import { ThresholdHandler } from './thresholds/ThresholdHandler';
import { GarbageCollector } from './gc/GarbageCollector';
import { MemoryAnalyzer } from './analysis/MemoryAnalyzer';
import { ProcessingEstimator, type ProcessingCapability } from './processing/ProcessingEstimator';

export class MemoryManager {
  private monitor: MemoryMonitor;
  private thresholdHandler: ThresholdHandler;
  private gc: GarbageCollector;
  private analyzer: MemoryAnalyzer;
  private estimator: ProcessingEstimator;

  constructor() {
    this.monitor = new MemoryMonitor();
    this.thresholdHandler = new ThresholdHandler();
    this.gc = new GarbageCollector();
    this.analyzer = new MemoryAnalyzer();
    this.estimator = new ProcessingEstimator();

    this.startMonitoring();
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    this.monitor.startMonitoring((stats) => {
      this.thresholdHandler.checkThresholds(
        stats,
        () => this.handleHighMemory(),
        () => this.handleCriticalMemory()
      );
    });
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    this.monitor.stopMonitoring();
  }

  /**
   * Get current memory statistics
   */
  public getCurrentMemoryStats(): MemoryStats {
    return this.monitor.getCurrentMemoryStats();
  }

  /**
   * Handle high memory usage
   */
  private handleHighMemory(): void {
    this.gc.suggest();
  }

  /**
   * Handle critical memory usage
   */
  private handleCriticalMemory(): void {
    this.gc.force();
    this.monitor.trimHistory();
    this.gc.clearCaches();
  }

  /**
   * Force garbage collection
   */
  public forceGarbageCollection(): void {
    this.gc.force();
  }

  /**
   * Get memory usage trend
   */
  public getMemoryTrend(): 'stable' | 'increasing' | 'decreasing' {
    return this.analyzer.getTrend(this.monitor.getHistory());
  }

  /**
   * Get memory recommendations
   */
  public getMemoryRecommendations(): string[] {
    return this.analyzer.getRecommendations(
      this.monitor.getCurrentMemoryStats(),
      this.monitor.getHistory(),
      this.monitor.getPeakUsage()
    );
  }

  /**
   * Estimate memory needed for processing
   */
  public estimateMemoryNeeded(fileSize: number, fileType: string): number {
    return this.estimator.estimateMemoryNeeded(fileSize, fileType);
  }

  /**
   * Check if processing is feasible with current memory
   */
  public canProcessFile(fileSize: number, fileType: string): ProcessingCapability {
    return this.estimator.canProcessFile(
      fileSize,
      fileType,
      this.monitor.getCurrentMemoryStats()
    );
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
      current: this.monitor.getCurrentMemoryStats(),
      peak: this.monitor.getPeakUsage(),
      trend: this.getMemoryTrend(),
      recommendations: this.getMemoryRecommendations(),
      history: this.monitor.getHistory()
    };
  }

  /**
   * Reset memory tracking
   */
  public reset(): void {
    this.monitor.reset();
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
