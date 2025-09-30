/**
 * useApplicationTable - Business logic hook for application table management
 * Extracted from ApplicationTable.tsx for constitutional compliance
 */

import { useState, useMemo } from 'react';
import { ApplicationSummary } from '../../../../types/contractor.types';

export interface UseApplicationTableProps {
  applications: ApplicationSummary[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface UseApplicationTableReturn {
  expandedRows: Set<string>;
  sortedApplications: ApplicationSummary[];
  handleSort: (columnKey: string) => void;
  handleRowSelection: (applicationId: string, selected: boolean) => void;
  handleSelectAll: (selected: boolean) => void;
  toggleRowExpansion: (applicationId: string) => void;
  getStatusDisplay: (status: string, urgentFlags?: string[]) => {
    text: string;
    className: string;
  };
  formatDate: (date: Date | string) => string;
  getDaysInReview: (applicationDate: Date | string) => number;
}

export function useApplicationTable({
  applications,
  sortBy,
  sortOrder,
  onSort,
  onSelectionChange
}: UseApplicationTableProps): UseApplicationTableReturn {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    
    if (sortBy === columnKey) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(columnKey, newOrder);
    } else {
      onSort(columnKey, 'asc');
    }
  };

  const handleRowSelection = (applicationId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelectedIds = selected 
      ? [...(onSelectionChange as any).currentSelected || [], applicationId]
      : (onSelectionChange as any).currentSelected?.filter((id: string) => id !== applicationId) || [];
    
    onSelectionChange(newSelectedIds);
  };

  const handleSelectAll = (selected: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelectedIds = selected ? applications.map(app => app.id) : [];
    onSelectionChange(newSelectedIds);
  };

  const toggleRowExpansion = (applicationId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusDisplay = (status: string, urgentFlags: string[] = []) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    
    switch (status) {
      case 'pending':
        return {
          text: 'Pending Review',
          className: `${baseClasses} bg-yellow-100 text-yellow-800`
        };
      case 'in_review':
        return {
          text: 'In Review',
          className: `${baseClasses} bg-blue-100 text-blue-800`
        };
      case 'approved':
        return {
          text: 'Approved',
          className: `${baseClasses} bg-green-100 text-green-800`
        };
      case 'rejected':
        return {
          text: 'Rejected',
          className: `${baseClasses} bg-red-100 text-red-800`
        };
      case 'incomplete':
        return {
          text: 'Needs Information',
          className: `${baseClasses} bg-orange-100 text-orange-800`
        };
      default:
        return {
          text: status,
          className: `${baseClasses} bg-gray-100 text-gray-800`
        };
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return 'Invalid Date';
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysInReview = (applicationDate: Date | string) => {
    const appDate = typeof applicationDate === 'string' ? new Date(applicationDate) : applicationDate;
    const now = new Date();
    const diffTime = now.getTime() - appDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const sortedApplications = useMemo(() => {
    if (!sortBy || !sortOrder) {
      return applications;
    }

    return [...applications].sort((a, b) => {
      let aValue: any = a[sortBy as keyof ApplicationSummary];
      let bValue: any = b[sortBy as keyof ApplicationSummary];

      // Handle date sorting
      if (sortBy === 'applicationDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();
      
      if (aStr < bStr) return sortOrder === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [applications, sortBy, sortOrder]);

  return {
    expandedRows,
    sortedApplications,
    handleSort,
    handleRowSelection,
    handleSelectAll,
    toggleRowExpansion,
    getStatusDisplay,
    formatDate,
    getDaysInReview
  };
}