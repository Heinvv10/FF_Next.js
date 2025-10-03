/**
 * Document Filter Types
 * @module DocumentFilters
 */

import { DocumentType } from '@/types/contractor.types';

export interface DocumentFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  documentTypeFilter: string;
  onDocumentTypeFilterChange: (type: string) => void;
  expiryFilter: string;
  onExpiryFilterChange: (expiry: string) => void;
  totalCount: number;
  filteredCount: number;
  enableAdvancedFilters?: boolean;
  enablePresets?: boolean;
  presets?: FilterPreset[];
  onPresetChange?: (preset: FilterPreset | null) => void;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: {
    status: string;
    documentType: string;
    expiry: string;
    search?: string;
  };
  isDefault?: boolean;
}

export interface DocumentFilterState {
  searchTerm: string;
  statusFilter: string;
  documentTypeFilter: string;
  expiryFilter: string;
  selectedPreset: FilterPreset | null;
  showAdvanced: boolean;
  isSearchFocused: boolean;
  searchSuggestions: string[];
}

export interface DocumentFilterActions {
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setDocumentTypeFilter: (type: string) => void;
  setExpiryFilter: (expiry: string) => void;
  setSelectedPreset: (preset: FilterPreset | null) => void;
  setShowAdvanced: (show: boolean) => void;
  setIsSearchFocused: (focused: boolean) => void;
  setSearchSuggestions: (suggestions: string[]) => void;
  clearAllFilters: () => void;
  applyPreset: (preset: FilterPreset) => void;
  handleSearchChange: (value: string) => void;
}

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Document Types' },
  { value: 'tax_clearance', label: 'Tax Clearance' },
  { value: 'insurance', label: 'Insurance Certificate' },
  { value: 'company_registration', label: 'Company Registration' },
  { value: 'vat_certificate', label: 'VAT Certificate' },
  { value: 'bee_certificate', label: 'BEE Certificate' },
  { value: 'safety_certificate', label: 'Safety Certificate' },
  { value: 'technical_certification', label: 'Technical Certification' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'reference_letter', label: 'Reference Letter' },
  { value: 'id_document', label: 'ID Document' },
  { value: 'other', label: 'Other Documents' }
];

export const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'pending-urgent',
    name: 'Pending & Urgent',
    description: 'Documents pending approval that are expiring soon',
    filters: {
      status: 'pending',
      documentType: 'all',
      expiry: 'expiring'
    },
    isDefault: true
  },
  {
    id: 'expired-documents',
    name: 'Expired Documents',
    description: 'All documents that have expired',
    filters: {
      status: 'all',
      documentType: 'all',
      expiry: 'expired'
    }
  },
  {
    id: 'compliance-critical',
    name: 'Compliance Critical',
    description: 'Critical compliance documents needing attention',
    filters: {
      status: 'pending',
      documentType: 'tax_clearance',
      expiry: 'all'
    }
  },
  {
    id: 'recently-rejected',
    name: 'Recently Rejected',
    description: 'Documents rejected in recent review cycles',
    filters: {
      status: 'rejected',
      documentType: 'all',
      expiry: 'all'
    }
  }
];