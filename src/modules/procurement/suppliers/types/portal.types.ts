/**
 * Supplier Portal Types
 * Shared types for supplier portal components
 */

export interface SupplierSession {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  authenticated: boolean;
}

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
}

export interface SupplierStats {
  activeRFQs: number;
  completedQuotes: number;
  averageScore: number;
  complianceStatus: 'compliant' | 'pending' | 'non-compliant';
  documentsExpiring: number;
  winRate: number;
}

export type SupplierPortalTab = 'dashboard' | 'rfqs' | 'profile' | 'performance' | 'documents' | 'messages';
