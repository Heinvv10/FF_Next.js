/**
 * PendingApplicationsList - Full contractor application management interface
 * Complete workflow for reviewing, approving, and managing contractor applications
 */

import React from 'react';
import { AlertCircle, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useContractorApplications } from '../hooks/useContractorApplications';
import { ApplicationFilters } from './applications/ApplicationFilters';
import { ApplicationCard } from './applications/ApplicationCard';
import { ApplicationStats } from './applications/ApplicationTypes';

export function PendingApplicationsList() {
  const {
    applications,
    stats,
    filters,
    isLoading,
    error,
    setFilters,
    handleApplicationAction,
    refreshApplications,
  } = useContractorApplications();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contractor Applications</h2>
        <p className="text-gray-600">Review and manage contractor applications and onboarding process</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Applications</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pending Review</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.inReview}</div>
              <div className="text-sm text-gray-500">In Review</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ApplicationFilters
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refreshApplications}
        isLoading={isLoading}
      />

      {/* Applications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading applications...</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="flex-shrink-0 mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500">
              {filters.search || filters.status !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'No contractor applications have been submitted yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Showing {applications.length} of {stats.total} applications
              </div>
            </div>

            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onAction={handleApplicationAction}
                isLoading={isLoading}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}