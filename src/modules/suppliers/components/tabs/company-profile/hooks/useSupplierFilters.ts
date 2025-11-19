// ============= Supplier Filters Hook =============
// Custom hook for managing supplier filtering and search

import { useState, useMemo } from 'react';
import type { ExtendedSupplier, ViewMode } from '../types/company-profile.types';

interface UseSupplierFiltersProps {
  suppliers: ExtendedSupplier[];
}

export const useSupplierFilters = ({ suppliers }: UseSupplierFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Get unique categories
  const categories = useMemo(
    () => [...new Set(suppliers.map(s => s.category))],
    [suppliers]
  );

  // Filter suppliers based on all criteria
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }

    return filtered;
  }, [suppliers, searchTerm, statusFilter, categoryFilter]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    viewMode,
    setViewMode,
    categories,
    filteredSuppliers
  };
};
