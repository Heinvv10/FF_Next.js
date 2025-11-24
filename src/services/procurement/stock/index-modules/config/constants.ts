/**
 * Stock Management Constants
 * Configuration constants and enums for stock management
 */

export const STOCK_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 1000,
  DEFAULT_REORDER_DAYS: 7,
  MAX_CABLE_DRUM_LENGTH: 10000, // meters
  MIN_CABLE_DRUM_LENGTH: 100,   // meters
  QUALITY_CHECK_TIMEOUT_HOURS: 24,
  MOVEMENT_REFERENCE_PREFIX: {
    GRN: 'GRN',
    ISSUE: 'ISS',
    TRANSFER: 'TRF',
    RETURN: 'RTN',
    ADJUSTMENT: 'ADJ',
  },
} as const;

export const STOCK_STATUS_PRIORITIES = {
  'critical': 1,
  'low': 2,
  'normal': 3,
  'excess': 4,
  'obsolete': 5,
} as const;

export const MOVEMENT_TYPE_PRIORITIES = {
  'ASN': 1,
  'GRN': 2,
  'ISSUE': 3,
  'RETURN': 4,
  'TRANSFER': 5,
  'ADJUSTMENT': 6,
} as const;
