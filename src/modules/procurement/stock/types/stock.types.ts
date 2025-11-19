/**
 * Stock Management Types
 * Type definitions for stock management components
 */

export interface StockItemData {
  id: string;
  itemCode: string;
  description: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reservedStock: number;
  availableStock: number;
  averageCost: number;
  totalValue: number;
  currency: string;
  location: string;
  supplier: string;
  lastReceived?: Date;
  lastIssued?: Date;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'excess-stock';
  stockTurnover: number;
  leadTime: number;
  reorderPoint: number;
  abc_classification: 'A' | 'B' | 'C';
  movementHistory: StockMovement[];
}

export interface StockMovement {
  type: 'receipt' | 'issue' | 'transfer' | 'adjustment';
  quantity: number;
  date: Date;
  reference: string;
  location?: string;
}

export interface StockMovementData {
  id: string;
  type: 'asn' | 'grn' | 'issue' | 'transfer' | 'adjustment';
  reference: string;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  fromLocation?: string;
  toLocation?: string;
  createdDate: Date;
  processedDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdBy: string;
  notes?: string;
}

export interface StockStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'excess-stock';
export type StockMovementType = 'asn' | 'grn' | 'issue' | 'transfer' | 'adjustment';
export type StockTab = 'inventory' | 'movements' | 'transfers';
export type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'excess-stock';
export type StockSortBy = 'item-code' | 'description' | 'stock-level' | 'value' | 'last-received';
