/**
 * Mock Stock Data
 * Sample data for stock management - would be fetched from API in production
 */
import type { StockItemData, StockMovementData } from '../types/stock.types';

export const mockStockItems: StockItemData[] = [
  {
    id: 'STK-001',
    itemCode: 'FO-CABLE-SM-12C',
    description: 'Single Mode Fiber Optic Cable 12 Core',
    category: 'Fiber Optic Cables',
    unit: 'Meters',
    currentStock: 2500,
    minimumStock: 500,
    maximumStock: 5000,
    reservedStock: 300,
    availableStock: 2200,
    averageCost: 25.50,
    totalValue: 63750,
    currency: 'ZAR',
    location: 'Warehouse A - Section 1',
    supplier: 'Fiber Optics Solutions Ltd',
    lastReceived: new Date('2024-01-15'),
    lastIssued: new Date('2024-01-18'),
    status: 'in-stock',
    stockTurnover: 2.3,
    leadTime: 14,
    reorderPoint: 750,
    abc_classification: 'A',
    movementHistory: [
      { type: 'receipt', quantity: 1000, date: new Date('2024-01-15'), reference: 'GRN-2024-001' },
      { type: 'issue', quantity: 200, date: new Date('2024-01-18'), reference: 'ISS-2024-005' }
    ]
  },
  {
    id: 'STK-002',
    itemCode: 'SPLICE-ENCL-24',
    description: 'Splice Enclosure 24 Port',
    category: 'Network Equipment',
    unit: 'Each',
    currentStock: 15,
    minimumStock: 20,
    maximumStock: 100,
    reservedStock: 5,
    availableStock: 10,
    averageCost: 450,
    totalValue: 6750,
    currency: 'ZAR',
    location: 'Warehouse B - Section 3',
    supplier: 'Network Infrastructure Co',
    lastReceived: new Date('2024-01-10'),
    lastIssued: new Date('2024-01-16'),
    status: 'low-stock',
    stockTurnover: 1.8,
    leadTime: 21,
    reorderPoint: 30,
    abc_classification: 'B',
    movementHistory: [
      { type: 'receipt', quantity: 25, date: new Date('2024-01-10'), reference: 'GRN-2024-002' },
      { type: 'issue', quantity: 10, date: new Date('2024-01-16'), reference: 'ISS-2024-008' }
    ]
  },
  {
    id: 'STK-003',
    itemCode: 'DROP-CABLE-2C',
    description: 'Drop Cable 2 Core FTTH',
    category: 'Drop Cables',
    unit: 'Meters',
    currentStock: 0,
    minimumStock: 1000,
    maximumStock: 10000,
    reservedStock: 0,
    availableStock: 0,
    averageCost: 8.75,
    totalValue: 0,
    currency: 'ZAR',
    location: 'Warehouse A - Section 2',
    supplier: 'Premium Cables SA',
    lastIssued: new Date('2024-01-12'),
    status: 'out-of-stock',
    stockTurnover: 3.2,
    leadTime: 10,
    reorderPoint: 1500,
    abc_classification: 'A',
    movementHistory: [
      { type: 'issue', quantity: 800, date: new Date('2024-01-12'), reference: 'ISS-2024-003' }
    ]
  }
];

export const mockStockMovements: StockMovementData[] = [
  {
    id: 'MOV-001',
    type: 'asn',
    reference: 'ASN-2024-001',
    itemCode: 'FO-CABLE-SM-12C',
    itemDescription: 'Single Mode Fiber Optic Cable 12 Core',
    quantity: 2000,
    unit: 'Meters',
    toLocation: 'Warehouse A - Section 1',
    createdDate: new Date('2024-01-20'),
    status: 'pending',
    createdBy: 'System',
    notes: 'Expected delivery from Fiber Optics Solutions Ltd'
  },
  {
    id: 'MOV-002',
    type: 'grn',
    reference: 'GRN-2024-003',
    itemCode: 'SPLICE-ENCL-24',
    itemDescription: 'Splice Enclosure 24 Port',
    quantity: 50,
    unit: 'Each',
    toLocation: 'Warehouse B - Section 3',
    createdDate: new Date('2024-01-19'),
    processedDate: new Date('2024-01-19'),
    status: 'completed',
    createdBy: 'John Smith',
    notes: 'Received in good condition'
  },
  {
    id: 'MOV-003',
    type: 'transfer',
    reference: 'TRF-2024-001',
    itemCode: 'FO-CABLE-SM-12C',
    itemDescription: 'Single Mode Fiber Optic Cable 12 Core',
    quantity: 500,
    unit: 'Meters',
    fromLocation: 'Warehouse A - Section 1',
    toLocation: 'Site Store - Project Alpha',
    createdDate: new Date('2024-01-18'),
    status: 'in-progress',
    createdBy: 'Sarah Johnson'
  }
];
