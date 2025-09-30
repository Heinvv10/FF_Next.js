/**
 * ApplicationTableRow - Individual table row component for applications
 * Extracted from ApplicationTable.tsx for constitutional compliance
 */

import React from 'react';
import { 
  Building2, 
  User, 
  Calendar,
  Mail,
  Phone,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { ApplicationSummary, ApprovalAction, ApprovalActionResult } from '../../../../types/contractor.types';
import { ApplicationActions } from '../ApplicationActions';
import { OnboardingProgressCard } from '../OnboardingProgressCard';

interface ApplicationTableRowProps {
  application: ApplicationSummary;
  isSelected: boolean;
  isExpanded: boolean;
  selectedIds: string[];
  onRowSelection: (applicationId: string, selected: boolean) => void;
  onView?: (contractorId: string) => void;
  onAction?: (contractorId: string, action: ApprovalAction, data?: any) => Promise<ApprovalActionResult>;
  toggleRowExpansion: (applicationId: string) => void;
  getStatusDisplay: (status: string, urgentFlags?: string[]) => {
    text: string;
    className: string;
  };
  formatDate: (date: Date | string) => string;
  getDaysInReview: (applicationDate: Date | string) => number;
}

export function ApplicationTableRow({
  application,
  isSelected,
  isExpanded,
  selectedIds,
  onRowSelection,
  onView,
  onAction,
  toggleRowExpansion,
  getStatusDisplay,
  formatDate,
  getDaysInReview
}: ApplicationTableRowProps) {
  const statusDisplay = getStatusDisplay(application.status, application.urgentFlags);
  const daysInReview = getDaysInReview(application.applicationDate);

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest('input, button, a, .no-row-click');
    if (!isInteractiveElement && onView) {
      onView(application.id);
    }
  };

  return (
    <React.Fragment>
      {/* Main Row */}
      <tr 
        className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} cursor-pointer`}
        onClick={handleRowClick}
      >
        {/* Selection Checkbox */}
        <td className="px-4 py-4 text-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onRowSelection(application.id, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </td>

        {/* Company */}
        <td className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Building2 className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {application.companyName}
              </div>
              {application.urgentFlags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {application.urgentFlags.slice(0, 2).map((flag, index) => (
                    <span
                      key={index}
                      className="px-1 py-0.5 text-xs bg-red-100 text-red-800 rounded"
                    >
                      {flag}
                    </span>
                  ))}
                  {application.urgentFlags.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{application.urgentFlags.length - 2} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Contact Person */}
        <td className="px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {application.contactPerson}
              </div>
              <div className="text-sm text-gray-500 flex items-center space-x-2">
                <Mail className="h-3 w-3" />
                <span>{application.contactEmail}</span>
              </div>
              {application.contactPhone && (
                <div className="text-sm text-gray-500 flex items-center space-x-2">
                  <Phone className="h-3 w-3" />
                  <span>{application.contactPhone}</span>
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-4 text-center">
          <span className={statusDisplay.className}>
            {statusDisplay.text}
          </span>
          {daysInReview > 7 && (
            <div className="text-xs text-orange-600 mt-1">
              {daysInReview} days old
            </div>
          )}
        </td>

        {/* Application Date */}
        <td className="px-4 py-4 text-sm text-gray-900">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{formatDate(application.applicationDate)}</span>
          </div>
        </td>

        {/* Progress */}
        <td className="px-4 py-4 text-center">
          <div className="flex items-center justify-center">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${application.completionPercentage}%` }}
              />
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {application.completionPercentage}%
            </span>
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-4 text-center">
          <div className="flex items-center justify-center space-x-2 no-row-click">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion(application.id);
              }}
              className="text-gray-400 hover:text-gray-600"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            <ApplicationActions
              contractorId={application.id}
              currentStatus={application.status}
              onAction={onAction}
              selectedIds={selectedIds}
            />
          </div>
        </td>
      </tr>

      {/* Expanded Details Row */}
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={7} className="px-4 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Onboarding Progress */}
                <div>
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Onboarding Progress
                  </h5>
                  <OnboardingProgressCard
                    contractorId={application.id}
                    currentStage={application.currentStage || 'application'}
                    completionPercentage={application.completionPercentage}
                  />
                </div>

                {/* Documents Summary */}
                <div>
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Documents Status
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Total Documents</span>
                      </div>
                      <span className="text-sm font-medium">
                        {application.documentsSubmitted || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 ml-6">Approved</span>
                      <span className="text-sm text-green-600 font-medium">
                        {application.documentsApproved || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 ml-6">Pending</span>
                      <span className="text-sm text-yellow-600 font-medium">
                        {(application.documentsSubmitted || 0) - (application.documentsApproved || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div>
                  <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Additional Information
                  </h5>
                  {application.notes && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">{application.notes}</p>
                    </div>
                  )}
                  
                  {application.urgentFlags.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Urgent Flags
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {application.urgentFlags.map((flag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}