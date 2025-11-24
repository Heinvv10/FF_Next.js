/**
 * Excel Processing Constants
 * Performance and security limits
 */

// Performance limits
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_ROWS = 100000;
export const MAX_COLUMNS = 1000;
export const MAX_CELL_LENGTH = 10000;
export const CHUNK_SIZE = 1000; // Process rows in chunks for better memory management

// Security patterns to detect and block
export const DANGEROUS_PATTERNS = [
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
  /<script/i,
  /eval\(/i,
  /Function\(/i,
  /document\./i,
  /window\./i
];
