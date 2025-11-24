/**
 * Memory Utilities
 * Helper functions for memory formatting and calculations
 */

/**
 * Format bytes for human reading
 */
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate memory usage ratio
 */
export function calculateUsageRatio(heapUsed: number, heapTotal: number): number {
  if (heapTotal === 0) return 0;
  return heapUsed / heapTotal;
}

/**
 * File type memory multipliers
 * Estimates how much memory a file type typically uses relative to file size
 */
export const FILE_MEMORY_MULTIPLIERS: Record<string, number> = {
  csv: 3,    // CSV typically expands 3x in memory
  xlsx: 5,   // Excel can expand 5x due to formatting and structure
  xls: 4,    // Legacy Excel format
  json: 2    // JSON is relatively compact
};

/**
 * Estimate memory needed for file processing
 */
export function estimateFileMemory(fileSize: number, fileType: string): number {
  const multiplier = FILE_MEMORY_MULTIPLIERS[fileType] || 3;
  return fileSize * multiplier;
}
