/**
 * DocumentQueueFilters - Filter controls for document approval queue
 * Handles search, status filtering, and document type filtering
 * Extracted from DocumentApprovalQueue.tsx for constitutional compliance
 */

import React from 'react';
import { Search, Filter } from 'lucide-react';

interface DocumentQueueFiltersProps {
  searchTerm: string;
  statusFilter: string;
  documentTypeFilter: string;
  expiryFilter: string;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: string) => void;
  onDocumentTypeFilterChange: (type: string) => void;
  onExpiryFilterChange: (filter: string) => void;
}

export function DocumentQueueFilters({
  searchTerm,
  statusFilter,
  documentTypeFilter,
  expiryFilter,
  onSearchChange,
  onStatusFilterChange,
  onDocumentTypeFilterChange,
  onExpiryFilterChange
}: DocumentQueueFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">Filters</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Document Type Filter */}
        <div>
          <select
            value={documentTypeFilter}
            onChange={(e) => onDocumentTypeFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Document Types</option>
            <option value="insurance">Insurance Certificate</option>
            <option value="license">Business License</option>
            <option value="registration">Company Registration</option>
            <option value="tax">Tax Certificate</option>
            <option value="safety">Safety Certificate</option>
            <option value="certification">Professional Certification</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Expiry Filter */}
        <div>
          <select
            value={expiryFilter}
            onChange={(e) => onExpiryFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Expiry Status</option>
            <option value="expiring">Expiring Within 30 Days</option>
            <option value="expired">Expired Documents</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {searchTerm && (
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <span>Search: "{searchTerm}"</span>
            <button
              onClick={() => onSearchChange('')}
              className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        )}

        {statusFilter !== 'all' && (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <span>Status: {statusFilter}</span>
            <button
              onClick={() => onStatusFilterChange('all')}
              className="ml-1 hover:bg-green-200 rounded-full p-0.5"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        )}

        {documentTypeFilter !== 'all' && (
          <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
            <span>Type: {documentTypeFilter}</span>
            <button
              onClick={() => onDocumentTypeFilterChange('all')}
              className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        )}

        {expiryFilter !== 'all' && (
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
            <span>Expiry: {expiryFilter}</span>
            <button
              onClick={() => onExpiryFilterChange('all')}
              className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        )}

        {(searchTerm || statusFilter !== 'all' || documentTypeFilter !== 'all' || expiryFilter !== 'all') && (
          <button
            onClick={() => {
              onSearchChange('');
              onStatusFilterChange('all');
              onDocumentTypeFilterChange('all');
              onExpiryFilterChange('all');
            }}
            className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}