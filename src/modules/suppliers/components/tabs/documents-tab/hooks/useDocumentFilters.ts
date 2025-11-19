// ============= Document Filters Hook =============
// Custom hook for managing document filtering and search

import { useState, useMemo } from 'react';
import type { SupplierDocument } from '../types/documents.types';
import type { Supplier } from '../../../../context/SuppliersPortalContext';

interface UseDocumentFiltersProps {
  documents: SupplierDocument[];
  selectedSupplier: Supplier | undefined;
}

export const useDocumentFilters = ({ documents, selectedSupplier }: UseDocumentFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [requirementFilter, setRequirementFilter] = useState<string>('all');

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by selected supplier
    if (selectedSupplier) {
      filtered = filtered.filter(doc => doc.supplierId === selectedSupplier.id);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Filter by requirement
    if (requirementFilter === 'required') {
      filtered = filtered.filter(doc => doc.isRequired);
    } else if (requirementFilter === 'optional') {
      filtered = filtered.filter(doc => !doc.isRequired);
    }

    return filtered;
  }, [documents, selectedSupplier, searchTerm, typeFilter, statusFilter, requirementFilter]);

  return {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    requirementFilter,
    setRequirementFilter,
    filteredDocuments
  };
};
