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
export interface StockServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    stockService: boolean;
    queryService: boolean;
    commandService: boolean;
    movementService: boolean;
  };
  database: boolean;
  lastCheck: Date;
}

/**
 * Initialize stock management services and verify health
 */
export const initializeStockServices = async (): Promise<{
  success: boolean;
  services: string[];
  healthStatus: StockServiceHealth;
}> => {
  try {
    const stockService = new (await import('./StockService')).default();
    
    // Check health of all services
    const mainServiceHealth = await stockService.getHealthStatus();
    const stockOperations = new (await import('../api/stockOperations')).StockOperations();
    const operationsHealth = await stockOperations.getHealthStatus();
    
    const allHealthy = mainServiceHealth.success && 
                      operationsHealth.success && 
                      mainServiceHealth.data?.status === 'healthy' &&
                      operationsHealth.data?.status === 'healthy';

    const healthStatus: StockServiceHealth = {
      status: allHealthy ? 'healthy' : 'degraded',
      services: {
        stockService: mainServiceHealth.success,
        queryService: mainServiceHealth.success,
        commandService: mainServiceHealth.success,
        movementService: mainServiceHealth.success,
      },
      database: allHealthy,
      lastCheck: new Date(),
    };

    return {
      success: allHealthy,
      services: [
        'StockService',
        'StockQueryService', 
        'StockCommandService', 
        'StockMovementService',
        'StockOperations',
        'StockCalculations'
      ],
      healthStatus,
    };
  } catch (error) {
    return {
      success: false,
      services: [],
      healthStatus: {
        status: 'unhealthy',
        services: {
          stockService: false,
          queryService: false,
          commandService: false,
          movementService: false,
        },
        database: false,
        lastCheck: new Date(),
      },
    };
  }
};

/**
 * Create a stock service instance with default configuration
 */
export const createStockService = () => {
  return new (require('./StockService')).default();
};

/**
 * Create stock operations instance for API use
 */
export const createStockOperations = () => {
  return new (require('../api/stockOperations')).StockOperations();
};

// 🟢 WORKING: Utility functions for common operations
export const StockUtils = {
  /**
   * Validate stock movement data
   */
  validateMovementData: (movementData: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!movementData.projectId) errors.push('Project ID is required');
    if (!movementData.movementType) errors.push('Movement type is required');
    if (!movementData.referenceNumber) errors.push('Reference number is required');
    if (!movementData.movementDate) errors.push('Movement date is required');
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate stock position data
   */
  validatePositionData: (positionData: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!positionData.projectId) errors.push('Project ID is required');
    if (!positionData.itemCode) errors.push('Item code is required');
    if (!positionData.itemName) errors.push('Item name is required');
    if (!positionData.uom) errors.push('Unit of measure is required');
    
    if (positionData.onHandQuantity && positionData.onHandQuantity < 0) {
      errors.push('On-hand quantity cannot be negative');
    }
    
    if (positionData.reorderLevel && positionData.reorderLevel < 0) {
      errors.push('Reorder level cannot be negative');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Format stock status for display
   */
  formatStockStatus: (status: string): string => {
    const statusMap: Record<string, string> = {
      'normal': 'Normal',
      'low': 'Low Stock',
      'critical': 'Critical Stock',
      'excess': 'Excess Stock',
      'obsolete': 'Obsolete',
    };
    return statusMap[status] || status;
  },

  /**
   * Format movement type for display
   */
  formatMovementType: (type: string): string => {
    const typeMap: Record<string, string> = {
      'ASN': 'Advanced Shipping Notice',
      'GRN': 'Goods Receipt Note',
      'ISSUE': 'Stock Issue',
      'RETURN': 'Stock Return',
      'TRANSFER': 'Stock Transfer',
      'ADJUSTMENT': 'Stock Adjustment',
    };
    return typeMap[type] || type;
  },

  /**
   * Calculate stock value from position
   */
  calculatePositionValue: (position: any): number => {
    const quantity = position.onHandQuantity || 0;
    const cost = position.averageUnitCost || 0;
    return quantity * cost;
  },

  /**
   * Determine if item needs reordering
   */
  needsReorder: (position: any): boolean => {
    const availableQuantity = position.availableQuantity || 0;
    const reorderLevel = position.reorderLevel || 0;
    return reorderLevel > 0 && availableQuantity <= reorderLevel;
  },

  /**
   * Calculate stock coverage in days
   */
  calculateStockCoverage: (position: any, dailyUsage: number): number => {
    if (dailyUsage <= 0) return 0;
    const availableQuantity = position.availableQuantity || 0;
    return Math.floor(availableQuantity / dailyUsage);
  },

  /**
   * Format quantity with UOM
   */
  formatQuantity: (quantity: number, uom: string): string => {
    return `${quantity.toLocaleString()} ${uom}`;
  },

  /**
   * Format currency value
   */
  formatCurrency: (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  },

  /**
   * Calculate fill rate for items
   */
  calculateFillRate: (demanded: number, supplied: number): number => {
    if (demanded <= 0) return 0;
    return Math.round((supplied / demanded) * 100);
  },

  /**
   * Get stock status color for UI
   */
  getStockStatusColor: (status: string): string => {
    const colorMap: Record<string, string> = {
      'normal': 'green',
      'low': 'yellow',
      'critical': 'red',
      'excess': 'blue',
      'obsolete': 'gray',
    };
    return colorMap[status] || 'gray';
  },
};

// 🟢 WORKING: Constants and enums
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

// 🟢 WORKING: Version information
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

// Default export for convenience
export default {
  StockService: require('./StockService').default,
  StockOperations: require('../api/stockOperations').StockOperations,
  StockCalculations: require('./utils/stockCalculations').StockCalculations,
  StockUtils,
  STOCK_CONSTANTS,
  initializeStockServices,
  createStockService,
  createStockOperations,
  getModuleInfo,
};