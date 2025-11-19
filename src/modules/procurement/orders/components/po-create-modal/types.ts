// ============= PO Create Modal Types =============

import type { CreatePOItemRequest, POOrderType } from '../../../../../types/procurement/po.types';

export interface POCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
  rfqId?: string;
  quoteId?: string;
  projectId?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface POFormData {
  projectId: string;
  rfqId?: string;
  quoteId?: string;
  supplierId: string;
  title: string;
  description?: string;
  orderType: POOrderType;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryAddress: DeliveryAddress;
  expectedDeliveryDate?: Date;
  items: (CreatePOItemRequest & { tempId: string })[];
  notes?: string;
  internalNotes?: string;
}

export interface POFormErrors {
  [key: string]: string;
}

export interface POTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
}

// Mock suppliers data
export const mockSuppliers: Supplier[] = [
  { id: 'supplier-001', name: 'FiberTech Solutions', code: 'FTS001' },
  { id: 'supplier-002', name: 'Network Install Pro', code: 'NIP001' },
  { id: 'supplier-003', name: 'Cable Systems Ltd', code: 'CSL001' }
];

// South African provinces
export const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
] as const;
