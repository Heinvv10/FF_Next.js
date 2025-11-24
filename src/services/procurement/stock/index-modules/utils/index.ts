/**
 * Stock Utilities
 * Centralized export for all stock utility functions
 */

import * as Validators from './StockValidators';
import * as Formatters from './StockFormatters';
import * as Calculators from './StockCalculators';

/**
 * Combined StockUtils object for convenience
 */
export const StockUtils = {
  // Validators
  validateMovementData: Validators.validateMovementData,
  validatePositionData: Validators.validatePositionData,

  // Formatters
  formatStockStatus: Formatters.formatStockStatus,
  formatMovementType: Formatters.formatMovementType,
  formatQuantity: Formatters.formatQuantity,
  formatCurrency: Formatters.formatCurrency,
  getStockStatusColor: Formatters.getStockStatusColor,

  // Calculators
  calculatePositionValue: Calculators.calculatePositionValue,
  needsReorder: Calculators.needsReorder,
  calculateStockCoverage: Calculators.calculateStockCoverage,
  calculateFillRate: Calculators.calculateFillRate,
};

// Export individual modules for granular imports
export { Validators, Formatters, Calculators };
