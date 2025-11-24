/**
 * Stock Service Version Information
 * Module metadata and version tracking
 */

export const STOCK_SERVICE_VERSION = '1.0.0';
export const STOCK_SERVICE_BUILD_DATE = new Date().toISOString();

/**
 * Get module information
 */
export const getModuleInfo = () => ({
  name: 'Stock Management Service',
  version: STOCK_SERVICE_VERSION,
  buildDate: STOCK_SERVICE_BUILD_DATE,
  components: [
    'StockService',
    'StockQueryService',
    'StockCommandService',
    'StockMovementService',
    'StockOperations',
    'StockCalculations',
  ],
  features: [
    'Stock Position Management',
    'Stock Movement Processing',
    'Cable Drum Tracking',
    'GRN/Issue/Transfer/Return Processing',
    'Stock Reservations',
    'ABC Analysis',
    'Reorder Analysis',
    'Stock Aging',
    'Turnover Analysis',
    'Real-time Stock Updates',
    'Comprehensive Reporting',
    'Enterprise Error Handling',
  ],
});
