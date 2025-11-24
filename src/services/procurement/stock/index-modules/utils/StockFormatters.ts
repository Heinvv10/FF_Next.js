/**
 * Stock Formatters
 * Formatting functions for stock display
 */

/**
 * Format stock status for display
 */
export function formatStockStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'normal': 'Normal',
    'low': 'Low Stock',
    'critical': 'Critical Stock',
    'excess': 'Excess Stock',
    'obsolete': 'Obsolete',
  };
  return statusMap[status] || status;
}

/**
 * Format movement type for display
 */
export function formatMovementType(type: string): string {
  const typeMap: Record<string, string> = {
    'ASN': 'Advanced Shipping Notice',
    'GRN': 'Goods Receipt Note',
    'ISSUE': 'Stock Issue',
    'RETURN': 'Stock Return',
    'TRANSFER': 'Stock Transfer',
    'ADJUSTMENT': 'Stock Adjustment',
  };
  return typeMap[type] || type;
}

/**
 * Format quantity with UOM
 */
export function formatQuantity(quantity: number, uom: string): string {
  return `${quantity.toLocaleString()} ${uom}`;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Get stock status color for UI
 */
export function getStockStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'normal': 'green',
    'low': 'yellow',
    'critical': 'red',
    'excess': 'blue',
    'obsolete': 'gray',
  };
  return colorMap[status] || 'gray';
}
