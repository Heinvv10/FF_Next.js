/**
 * Performance and Security Limits
 * Configuration for file size, rows, columns, and processing constraints
 */

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_ROWS = 100000;
export const MAX_COLUMNS = 1000;
export const MAX_CELL_LENGTH = 10000;
export const CHUNK_SIZE = 1000; // Process rows in chunks for better memory management

export const DEFAULT_LIMITS = {
  maxFileSize: MAX_FILE_SIZE,
  maxRows: MAX_ROWS,
  maxColumns: MAX_COLUMNS,
  maxCellLength: MAX_CELL_LENGTH,
  chunkSize: CHUNK_SIZE,
} as const;
