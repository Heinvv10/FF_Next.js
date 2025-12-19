// src/modules/ticketing/components/FilterPanel.tsx
// Advanced filtering panel for tickets with multiple criteria
'use client';

import React, { useState } from 'react';
import type { TicketStatus, TicketPriority, TicketSource } from '../types';

interface FilterOptions {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  source?: TicketSource[];
  assignedTo?: string[];
  createdBy?: string[];
  dateFrom?: string;
  dateTo?: string;
  slaBreached?: boolean;
  slaNearBreach?: boolean;
  billable?: boolean;
  billingApprovalPending?: boolean;
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
  teamMembers?: Array<{ id: string; name: string }>;
  showAdvanced?: boolean;
}

export function FilterPanel({
  onFilterChange,
  teamMembers = [],
  showAdvanced = false,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(showAdvanced);
  const [filters, setFilters] = useState<FilterOptions>({});

  function updateFilter(key: keyof FilterOptions, value: any) {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  }

  function toggleArrayFilter(key: keyof FilterOptions, value: string) {
    const current = (filters[key] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, newValue.length > 0 ? newValue : undefined);
  }

  function clearFilters() {
    setFilters({});
    onFilterChange({});
  }

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof FilterOptions] !== undefined
  ).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="space-y-1">
              {(['open', 'in_progress', 'awaiting_customer', 'resolved', 'closed'] as TicketStatus[]).map(
                (status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.status || []).includes(status)}
                      onChange={() => toggleArrayFilter('status', status)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="space-y-1">
              {(['critical', 'high', 'medium', 'low'] as TicketPriority[]).map((priority) => (
                <label key={priority} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.priority || []).includes(priority)}
                    onChange={() => toggleArrayFilter('priority', priority)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{priority}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <div className="space-y-1">
              {([
                'qcontact',
                'whatsapp_inbound',
                'whatsapp_outbound',
                'email',
                'construction',
                'internal',
                'adhoc',
              ] as TicketSource[]).map((source) => (
                <label key={source} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.source || []).includes(source)}
                    onChange={() => toggleArrayFilter('source', source)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {source.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Assigned To Filter */}
          {teamMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {teamMembers.map((member) => (
                  <label key={member.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(filters.assignedTo || []).includes(member.id)}
                      onChange={() => toggleArrayFilter('assignedTo', member.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Created Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SLA Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SLA Status</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.slaBreached || false}
                  onChange={(e) => updateFilter('slaBreached', e.target.checked || undefined)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">SLA Breached</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.slaNearBreach || false}
                  onChange={(e) => updateFilter('slaNearBreach', e.target.checked || undefined)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Near SLA Breach (&lt; 2 hours)</span>
              </label>
            </div>
          </div>

          {/* Billing Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Billing</label>
            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.billable || false}
                  onChange={(e) => updateFilter('billable', e.target.checked || undefined)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Billable Tickets</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.billingApprovalPending || false}
                  onChange={(e) =>
                    updateFilter('billingApprovalPending', e.target.checked || undefined)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Billing Approval Pending</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
