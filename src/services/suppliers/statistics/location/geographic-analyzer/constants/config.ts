/**
 * Geographic Analyzer Configuration
 * Constants and configuration for geographic analysis
 */

/**
 * Major cities in Canada for expansion analysis
 */
export const MAJOR_CITIES = [
  'Toronto',
  'Vancouver',
  'Montreal',
  'Calgary',
  'Ottawa',
  'Edmonton',
  'Mississauga',
  'Winnipeg',
  'Quebec City',
  'Hamilton'
] as const;

/**
 * Risk thresholds
 */
export const RISK_THRESHOLDS = {
  /** High concentration risk threshold */
  HIGH_CONCENTRATION: 0.3,

  /** Medium concentration risk threshold */
  MEDIUM_CONCENTRATION: 0.15,

  /** Minimum location coverage threshold */
  MIN_LOCATION_COVERAGE: 80,

  /** Single location dependency threshold (%) */
  MAX_SINGLE_LOCATION_SHARE: 40,

  /** Underserved region supplier threshold */
  UNDERSERVED_THRESHOLD: 5
} as const;

/**
 * Search defaults
 */
export const SEARCH_DEFAULTS = {
  /** Default search radius in km */
  RADIUS: 50,

  /** Default unit of measurement */
  UNIT: 'km' as const,

  /** Default sort field */
  SORT_BY: 'distance' as const,

  /** Miles to kilometers conversion factor */
  MILES_TO_KM: 1.60934
} as const;

/**
 * Analysis configuration
 */
export const ANALYSIS_CONFIG = {
  /** Minimum rating for growing market classification */
  MIN_GROWING_MARKET_RATING: 4.0,

  /** Maximum supplier count for growing market */
  MAX_GROWING_MARKET_SUPPLIERS: 20,

  /** Number of top categories to return */
  TOP_CATEGORIES_LIMIT: 5,

  /** Number of growing markets to identify */
  GROWING_MARKETS_LIMIT: 5,

  /** Number of underserved cities to highlight */
  UNDERSERVED_CITIES_LIMIT: 3
} as const;
