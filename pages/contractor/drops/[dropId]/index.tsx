'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DropWithDetails, ChecklistItem } from '@/modules/drops-quality-control/types';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  Download,
  Camera,
  Upload,
  RefreshCw
} from 'lucide-react';

const ContractorDropDetails: React.FC = () => {
  const router = useRouter();
  const { dropId } = router.query;
  const [drop, setDrop] = useState<DropWithDetails | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (dropId) {
      fetchDropDetails();
    }
  }, [dropId]);

  const fetchDropDetails = async () => {
    try {
      setLoading(true);

      // Fetch drop details
      const dropResponse = await fetch(`/api/drops/${dropId}`);
      const dropData = await dropResponse.json();
      setDrop(dropData);

      // Fetch checklist (if available)
      try {
        const checklistResponse = await fetch(`/api/drops/${dropId}/checklist`);
        if (checklistResponse.ok) {
          const checklistData = await checklistResponse.json();
          // Ensure checklistData is an array
          if (Array.isArray(checklistData)) {
            setChecklist(checklistData);
          } else {
            console.warn('Checklist data is not an array:', checklistData);
            setChecklist([]);
          }
        } else {
          console.warn('Checklist API not available, using empty checklist');
          setChecklist([]);
        }
      } catch (checklistError) {
        console.warn('Error fetching checklist, using empty checklist:', checklistError);
        setChecklist([]);
      }
    } catch (error) {
      console.error('Error fetching drop details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'needs-rectification':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'needs-rectification':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'A': return 'Pre-Install Context';
      case 'B': return 'Installation Execution';
      case 'C': return 'Assets & IDs';
      case 'D': return 'Verification';
      case 'E': return 'Customer Acceptance';
      default: return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'A': return 'border-blue-200 bg-blue-50';
      case 'B': return 'border-green-200 bg-green-50';
      case 'C': return 'border-yellow-200 bg-yellow-50';
      case 'D': return 'border-purple-200 bg-purple-50';
      case 'E': return 'border-pink-200 bg-pink-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const groupedChecklist = (Array.isArray(checklist) ? checklist : []).reduce((acc, item) => {
    if (!acc[item.phase]) {
      acc[item.phase] = [];
    }
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading drop details...</p>
        </div>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Drop Not Found</h2>
          <p className="text-gray-600 mb-4">The requested drop could not be found or you don't have access to it.</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Drop {drop.drop_number}
                </h1>
                <p className="text-sm text-gray-500">
                  {drop.customer_address}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchDropDetails}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className={`rounded-lg border p-4 mb-6 ${getStatusColor(drop.qc_status)}`}>
          <div className="flex items-center space-x-3">
            {getStatusIcon(drop.qc_status)}
            <div>
              <h3 className="font-semibold">
                Status: {drop.qc_status.replace('-', ' ').toUpperCase()}
              </h3>
              <p className="text-sm opacity-90">
                Last updated: {new Date(drop.qc_updated_at || drop.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Drop Number</p>
            <p className="text-lg font-semibold">{drop.drop_number}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Pole Number</p>
            <p className="text-lg font-semibold">{drop.pole_number}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Progress</p>
            <p className="text-lg font-semibold">
              {drop.completed_steps}/{drop.total_steps} ({Math.round((drop.completed_steps / drop.total_steps) * 100)}%)
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Agent Review</p>
            <p className="text-lg font-semibold">
              {drop.review ? 'Completed' : 'Pending'}
            </p>
          </div>
        </div>

        {/* Agent Feedback */}
        {drop.review && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Feedback</h3>
              <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mb-3 ${
                drop.review.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {drop.review.status === 'approved' ? '✅ Approved' : '❌ Needs Rectification'}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{drop.review.feedback}</p>

              {drop.review.missing_steps && drop.review.missing_steps.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Items requiring attention:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {drop.review.missing_steps.map((stepNum) => {
                      const item = checklist.find(c => c.step_number === stepNum);
                      return (
                        <div key={stepNum} className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">
                            Step {stepNum}: {item?.step_name || 'Unknown step'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checklist by Phase */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">14-Step Quality Checklist</h2>

          {Object.entries(groupedChecklist).map(([phase, items]) => (
            <div key={phase} className="bg-white rounded-lg shadow">
              <div className={`p-4 border-b ${getPhaseColor(phase)}`}>
                <h3 className="text-lg font-semibold text-gray-900">
                  Phase {phase}: {getPhaseName(phase)}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.step_number}
                      className={`p-4 border rounded-lg ${
                        item.is_completed
                          ? 'border-green-300 bg-green-50'
                          : drop.review?.missing_steps?.includes(item.step_number)
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          item.is_completed
                            ? 'border-green-500 bg-green-500 text-white'
                            : drop.review?.missing_steps?.includes(item.step_number)
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {item.is_completed ? '✓' : drop.review?.missing_steps?.includes(item.step_number) ? '✗' : item.step_number}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            Step {item.step_number}: {item.step_name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {/* Description would come from CHECKLIST_TEMPLATE */}
                            {item.step_name.includes('Frontage') && 'Wide shot of house, street number visible'}
                            {item.step_name.includes('Wall') && 'Show intended ONT spot + power outlet'}
                            {item.step_name.includes('Cable Span') && 'Wide shot showing full span'}
                            {item.step_name.includes('Entry Point') && 'Close-up of entry penetration'}
                            {item.step_name.includes('Fibre Entry') && 'Show slack loop + clips/conduit'}
                            {item.step_name.includes('Patched') && 'Label with Drop Number visible'}
                            {item.step_name.includes('Work Area') && 'ONT, fibre routing & electrical outlet'}
                            {item.step_name.includes('Barcode') && 'Scan barcode + photo of label'}
                            {item.step_name.includes('Serial') && 'Scan/enter serial + photo of label'}
                            {item.step_name.includes('Powermeter') && 'Enter dBm + photo of meter screen'}
                            {item.step_name.includes('Broadband') && 'ONT light ON + Fibertime sticker'}
                            {item.step_name.includes('Signature') && 'Digital signature + customer name'}
                          </div>

                          {drop.review?.missing_steps?.includes(item.step_number) && (
                            <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              This item needs to be corrected and resubmitted
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {drop.qc_status === 'needs-rectification' && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Action Required</h3>
            </div>
            <p className="text-blue-800 mb-4">
              Please complete the missing checklist items identified in the agent feedback above, then resubmit for review.
            </p>
            <div className="flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Upload className="w-4 h-4 inline mr-2" />
                Upload Photos
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Resubmit for Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorDropDetails;