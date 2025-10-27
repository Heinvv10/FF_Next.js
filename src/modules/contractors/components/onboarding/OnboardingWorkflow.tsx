/**
 * OnboardingWorkflow Component - Contractor onboarding process manager
 * Following FibreFlow patterns and keeping under 250 lines
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, FileText, Upload, User, Shield, Award } from 'lucide-react';
import { contractorOnboardingService, OnboardingProgress } from '@/services/contractor/contractorOnboardingService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

interface OnboardingWorkflowProps {
  contractorId: string;
  contractorName: string;
}

export function OnboardingWorkflow({ contractorId, contractorName }: OnboardingWorkflowProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadOnboardingProgress();
  }, [contractorId]);

  const loadOnboardingProgress = async () => {
    try {
      setIsLoading(true);
      const onboardingProgress = await contractorOnboardingService.getOnboardingProgress(contractorId);
      setProgress(onboardingProgress);
    } catch (error) {
      log.error('Failed to load onboarding progress:', { data: error }, 'OnboardingWorkflow');
      toast.error('Failed to load onboarding progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChecklistUpdate = async (stageId: string, checklistItemId: string, completed: boolean) => {
    if (!progress) return;
    
    try {
      setIsUpdating(true);
      const updatedProgress = await contractorOnboardingService.updateStageCompletion(
        contractorId,
        stageId,
        checklistItemId,
        completed
      );
      setProgress(updatedProgress);
      toast.success('Progress updated successfully');
    } catch (error) {
      log.error('Failed to update progress:', { data: error }, 'OnboardingWorkflow');
      toast.error('Failed to update progress');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!progress) return;
    
    try {
      setIsUpdating(true);
      const updatedProgress = await contractorOnboardingService.submitForApproval(contractorId);
      setProgress(updatedProgress);
      toast.success('Submitted for approval successfully');
    } catch (error: any) {
      log.error('Failed to submit for approval:', { data: error }, 'OnboardingWorkflow');
      toast.error(error.message || 'Failed to submit for approval');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageIcon = (stageId: string) => {
    switch (stageId) {
      case 'company_info':
        return <User className="w-5 h-5" />;
      case 'financial_info':
        return <FileText className="w-5 h-5" />;
      case 'insurance_compliance':
        return <Shield className="w-5 h-5" />;
      case 'technical_qualification':
        return <Award className="w-5 h-5" />;
      case 'final_review':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      legal: 'text-blue-600',
      financial: 'text-green-600',
      technical: 'text-purple-600',
      safety: 'text-orange-600',
      insurance: 'text-red-600'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" label="Loading onboarding progress..." />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">Failed to load onboarding progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Onboarding Progress</h2>
            <p className="text-gray-600">{contractorName}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(progress.overallStatus)}`}>
            {getStatusIcon(progress.overallStatus)}
            <span className="ml-1">{progress.overallStatus.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress.completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        {progress.overallStatus === 'completed' && (
          <button
            onClick={handleSubmitForApproval}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Submit for Approval
          </button>
        )}
      </div>

      {/* Onboarding Stages */}
      <div className="space-y-4">
        {progress.stages.map((stage) => (
          <div key={stage.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stage.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                  {getStageIcon(stage.id)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{stage.name}</h3>
                  <p className="text-sm text-gray-600">{stage.description}</p>
                </div>
              </div>
              {stage.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              {stage.checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => handleChecklistUpdate(stage.id, item.id, e.target.checked)}
                    disabled={isUpdating}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${item.completed ? 'text-gray-900 line-through' : 'text-gray-700'}`}>
                      {item.description}
                      {item.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className={`text-xs ${getCategoryColor(item.category)}`}>
                      {item.category.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Upload Hint */}
            {stage.documents.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Required Documents:</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {stage.documents.join(', ').replace(/_/g, ' ')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rejection Reason */}
      {progress.overallStatus === 'rejected' && progress.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Rejected</span>
          </div>
          <p className="text-red-700">{progress.rejectionReason}</p>
        </div>
      )}

      {/* Approval Info */}
      {progress.overallStatus === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Approved</span>
          </div>
          {progress.approvedBy && progress.approvedAt && (
            <p className="text-green-700">
              Approved by {progress.approvedBy} on {progress.approvedAt.toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}