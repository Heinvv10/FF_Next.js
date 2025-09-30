/**
 * ApplicationTableHeader - Table header component with sorting capabilities
 * Extracted from ApplicationTable.tsx for constitutional compliance
 */

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ApplicationTableHeaderProps {
  columns: TableColumn[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  selectedIds: string[];
  applications: any[];
  onSelectAll: (selected: boolean) => void;
}

export function ApplicationTableHeader({
  columns,
  sortBy,
  sortOrder,
  onSort,
  selectedIds,
  applications,
  onSelectAll
}: ApplicationTableHeaderProps) {
  const isAllSelected = applications.length > 0 && selectedIds.length === applications.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < applications.length;

  return (
    <thead className="bg-gray-50">
      <tr>
        {/* Select All Checkbox */}
        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected;
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </th>

        {/* Column Headers */}
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
              column.align === 'center' ? 'text-center' : 
              column.align === 'right' ? 'text-right' : 'text-left'
            }`}
            style={{ width: column.width }}
          >
            {column.sortable && onSort ? (
              <button
                onClick={() => onSort(column.key)}
                className="group inline-flex items-center space-x-1 text-left font-medium text-gray-500 hover:text-gray-700"
              >
                <span>{column.label}</span>
                <span className="ml-2 flex-none rounded text-gray-400 group-hover:visible">
                  {sortBy === column.key ? (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )
                  ) : (
                    <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  )}
                </span>
              </button>
            ) : (
              column.label
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}