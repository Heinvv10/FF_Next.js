// ============= Document Summary Component =============
// Summary statistics cards for document overview

import React from 'react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield
} from 'lucide-react';
import type { SupplierDocument } from '../types/documents.types';

interface DocumentSummaryProps {
  documents: SupplierDocument[];
}

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({ documents }) => {
  const stats = {
    total: documents.length,
    current: documents.filter(d => d.status === 'current').length,
    expiringSoon: documents.filter(d => d.status === 'expiring_soon').length,
    expired: documents.filter(d => d.status === 'expired').length,
    pendingReview: documents.filter(d => d.status === 'pending_review').length,
    required: documents.filter(d => d.isRequired).length
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
        <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
        <div className="text-sm text-blue-700">Total Documents</div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-green-900">{stats.current}</div>
        <div className="text-sm text-green-700">Current</div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
        <AlertTriangle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-yellow-900">{stats.expiringSoon}</div>
        <div className="text-sm text-yellow-700">Expiring Soon</div>
      </div>

      <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
        <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-red-900">{stats.expired}</div>
        <div className="text-sm text-red-700">Expired</div>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-200">
        <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-purple-900">{stats.pendingReview}</div>
        <div className="text-sm text-purple-700">Pending Review</div>
      </div>

      <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-200">
        <Shield className="w-6 h-6 text-orange-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-orange-900">{stats.required}</div>
        <div className="text-sm text-orange-700">Required</div>
      </div>
    </div>
  );
};
