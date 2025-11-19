/**
 * Quote Submission Types
 * Type definitions for quote submission modal and related components
 */

export interface RFQInvitation {
  id: string;
  rfqNumber: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'awarded' | 'rejected';
  projectName: string;
  estimatedValue: number;
  urgency: 'low' | 'medium' | 'high';
  items?: RFQItem[];
}

export interface RFQItem {
  id: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

export interface QuoteLineItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  deliveryTime: number; // in days
  notes?: string;
}

export interface QuoteSubmission {
  rfqId: string;
  supplierId: string;
  totalAmount: number;
  currency: string;
  validityPeriod: number; // in days
  paymentTerms: string;
  deliveryTerms: string;
  deliveryLocation: string;
  estimatedDeliveryDate: string;
  lineItems: QuoteLineItem[];
  additionalNotes?: string;
  attachments?: File[];
  warranties?: string;
  certifications?: string[];
}

export interface QuoteFormData extends Partial<QuoteSubmission> {}

export interface QuoteFormErrors extends Record<string, string> {}
