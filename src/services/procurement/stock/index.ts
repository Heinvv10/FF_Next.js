/**
 * Stock Management Module - Main Export Index
 * Central exports for all stock management services, types, and utilities
 */

// 🟢 WORKING: Main Service Classes
export { default as StockService } from './StockService';
export { default as StockQueryService } from './core/StockQueryService';
export { default as StockCommandService } from './core/StockCommandService';
export { default as StockMovementService } from './core/StockMovementService';

// 🟢 WORKING: API Operations
export { StockOperations } from '../api/stockOperations';

// 🟢 WORKING: Utilities and Calculations
export {
  StockCalculations,
  stockCalculations,
  default as stockCalculationsDefault
} from './utils/stockCalculations';

// 🟢 WORKING: Service Types and Interfaces
export type {
  StockFilters,
  MovementFilters,
  StockDashboardData,
  BulkMovementRequest
} from './StockService';

export type {
  CreateStockPositionData,
  StockAdjustmentData,
  StockReservationData
} from './core/StockCommandService';

export type {
  GRNData,
  IssueData,
  TransferData,
  ReturnData
} from './core/StockMovementService';

// 🟢 WORKING: Calculation Types
export type {
  StockValueBreakdown,
  StockABC,
  ReorderAnalysis,
  CableDrumUtilization,
  TurnoverAnalysis
} from './utils/stockCalculations';

// 🟢 WORKING: Re-export all stock types from the main types module
export type {
  StockPosition,
  StockMovement,
  StockMovementItem,
  CableDrum,
  DrumUsageHistory,
  StockStatusType,
  MovementTypeType,
  MovementStatusType,
  ItemStatusType,
  QualityCheckStatusType
} from '@/types/procurement/stock';

// 🟢 WORKING: Error classes
export {
  StockError,
  InsufficientStockError,
  StockReservationError,
  StockMovementError,
  StockTransferError,
  StockAdjustmentError,
  StockTrackingError,
  StockErrorHandler,
  StockErrorFactory,
  isStockError,
  getStockErrorType
} from '../errors/stock';

// 🟢 WORKING: Service initialization and health check
export type { StockServiceHealth } from './index-modules/initialization/ServiceInitializer';

export {
  initializeStockServices,
  createStockService,
  createStockOperations
} from './index-modules/initialization/ServiceInitializer';

// 🟢 WORKING: Utility functions for common operations
export { StockUtils } from './index-modules/utils';

// 🟢 WORKING: Constants and enums
export {
  STOCK_CONSTANTS,
  STOCK_STATUS_PRIORITIES,
  MOVEMENT_TYPE_PRIORITIES
} from './index-modules/config/constants';

// 🟢 WORKING: Version information
export {
  STOCK_SERVICE_VERSION,
  STOCK_SERVICE_BUILD_DATE,
  getModuleInfo
} from './index-modules/config/version';

// Default export for convenience
export default {
  StockService: require('./StockService').default,
  StockOperations: require('../api/stockOperations').StockOperations,
  StockCalculations: require('./utils/stockCalculations').StockCalculations,
  StockUtils: require('./index-modules/utils').StockUtils,
  STOCK_CONSTANTS: require('./index-modules/config/constants').STOCK_CONSTANTS,
  initializeStockServices: require('./index-modules/initialization/ServiceInitializer').initializeStockServices,
  createStockService: require('./index-modules/initialization/ServiceInitializer').createStockService,
  createStockOperations: require('./index-modules/initialization/ServiceInitializer').createStockOperations,
  getModuleInfo: require('./index-modules/config/version').getModuleInfo,
};
