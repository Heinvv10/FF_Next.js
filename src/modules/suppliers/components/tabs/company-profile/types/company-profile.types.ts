// ============= Company Profile Types =============
// Type definitions for supplier company profiles

import type { Supplier } from '../../../../context/SuppliersPortalContext';

export interface ExtendedSupplier extends Supplier {
  email: string;
  phone: string;
  website: string;
  address: string;
  contactPerson: string;
  certifications: string[];
  businessSector: string[];
  paymentTerms: string;
  deliveryRegions: string[];
  yearEstablished: number;
  employeeCount: string;
  annualRevenue: string;
  description: string;
}

export type ViewMode = 'grid' | 'list';

export interface FilterState {
  searchTerm: string;
  statusFilter: string;
  categoryFilter: string;
}
