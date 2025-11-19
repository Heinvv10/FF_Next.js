// ============= Message Filters Hook =============
// Custom hook for managing message filtering and search

import { useState, useMemo } from 'react';
import type { MessageThread } from '../types/messages.types';
import type { Supplier } from '../../../../context/SuppliersPortalContext';

interface UseMessageFiltersProps {
  threads: MessageThread[];
  selectedSupplier: Supplier | undefined;
}

export const useMessageFilters = ({ threads, selectedSupplier }: UseMessageFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredThreads = useMemo(() => {
    let filtered = threads;

    // Filter by selected supplier
    if (selectedSupplier) {
      filtered = filtered.filter(thread => thread.supplierId === selectedSupplier.id);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(thread =>
        thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        thread.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(thread => thread.lastMessage.category === categoryFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(thread => thread.lastMessage.priority === priorityFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(thread => thread.lastMessage.status === statusFilter);
    }

    return filtered;
  }, [threads, selectedSupplier, searchTerm, categoryFilter, priorityFilter, statusFilter]);

  return {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    filteredThreads
  };
};
