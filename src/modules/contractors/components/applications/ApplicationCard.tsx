/**
 * ApplicationCard - Individual application card component
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { ApplicationStatus } from './ApplicationStatus';
import { ContractorApplication, ApplicationAction } from './ApplicationTypes';

interface ApplicationCardProps {
  application: ContractorApplication;
  onAction: (action: ApplicationAction) => Promise<void>;
  isLoading?: boolean;
}

export function ApplicationCard({ application, onAction, isLoading = false }: ApplicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [showActionModal, setShowActionModal] = useState<string | null>(null);

  const handleAction = async (actionType: ApplicationAction['type']) => {
    await onAction({
      type: actionType,
      contractorId: application.id,
      notes: actionNotes,
      nextReviewDate: actionType === 'request_more_info' ?
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    });
    setShowActionModal(null);
    setActionNotes('');
  };

  const getRagColor = (rag: string) => {
    switch (rag) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'amber': return 'bg-yellow-100 text-yellow-800';
      case 'red': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Main Card Content */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Left side - Main info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {application.companyName}
              </h3>
              <ApplicationStatus status={application.status} />
            </div>

            <div className="flex items-center text-sm text-gray-600 mb-3">
              <User size={14} className="mr-1" />
              {application.contactPerson} •
              <Mail size={14} className="ml-2 mr-1" />
              {application.email}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Building size={14} className="mr-1" />
                {application.businessType.replace('_', ' ').toUpperCase()}
              </div>
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                Applied {format(new Date(application.createdAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>

          {/* Right side - Status and actions */}
          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            <div className="flex space-x-2">
              {application.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowActionModal('approve')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <CheckCircle size={14} className="inline mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowActionModal('reject')}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <XCircle size={14} className="inline mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => setShowActionModal('request_info')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <AlertCircle size={14} className="inline mr-1" />
                    More Info
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Phone size={14} className="mr-2" />
                    {application.phone}
                  </div>
                  <div className="flex items-center">
                    <Building size={14} className="mr-2" />
                    Reg: {application.registrationNumber}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Compliance Status</h4>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${getRagColor(application.ragOverall)}`}>
                    Overall: {application.ragOverall.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${getRagColor(application.ragFinancial)}`}>
                    Financial: {application.ragFinancial.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded ${getRagColor(application.ragCompliance)}`}>
                    Compliance: {application.ragCompliance.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {application.notes && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{application.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {showActionModal === 'approve' && 'Approve Application'}
              {showActionModal === 'reject' && 'Reject Application'}
              {showActionModal === 'request_info' && 'Request More Information'}
            </h3>

            <p className="text-gray-600 mb-4">
              {showActionModal === 'approve' && `Approve ${application.companyName} as a contractor?`}
              {showActionModal === 'reject' && `Reject ${application.companyName}'s application?`}
              {showActionModal === 'request_info' && `Request additional information from ${application.companyName}?`}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any notes or comments..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowActionModal(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(showActionModal as ApplicationAction['type'])}
                className={`px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50
                  ${showActionModal === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                  ${showActionModal === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                  ${showActionModal === 'request_info' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                `}
                disabled={isLoading}
              >
                {showActionModal === 'approve' && 'Approve'}
                {showActionModal === 'reject' && 'Reject'}
                {showActionModal === 'request_info' && 'Request Info'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}