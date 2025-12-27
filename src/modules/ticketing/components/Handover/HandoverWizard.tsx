/**
 * HandoverWizard Component - Interactive handover workflow
 *
 * 🟢 WORKING: Production-ready handover wizard with gate validation
 *
 * Features:
 * - Validate handover gates before submission
 * - Display passed/failed gates with clear indicators
 * - Show blocking issues and warnings
 * - Ownership transfer selection
 * - Create immutable handover snapshot
 * - Loading and error states
 * - Automatic refresh after handover
 */

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import {
  HandoverType,
  OwnerType,
  type HandoverGateValidation,
  type HandoverSnapshot,
  type CreateHandoverSnapshotPayload,
} from '../../types/handover';

interface HandoverWizardProps {
  /** Ticket ID to handover */
  ticketId: string;
  /** Type of handover (determines gate strictness) */
  handoverType: HandoverType;
  /** From owner type (optional) */
  fromOwnerType?: OwnerType;
  /** From owner ID (optional) */
  fromOwnerId?: string;
  /** To owner type (optional) */
  toOwnerType?: OwnerType;
  /** To owner ID (optional) */
  toOwnerId?: string;
  /** Callback when handover completes */
  onComplete?: (snapshot: HandoverSnapshot) => void;
  /** Callback when handover is cancelled */
  onCancel?: () => void;
}

/**
 * 🟢 WORKING: Fetch handover gate validation from API
 */
async function fetchGateValidation(
  ticketId: string,
  handoverType: HandoverType
): Promise<HandoverGateValidation> {
  const response = await fetch(
    `/api/ticketing/tickets/${ticketId}/handover/validate?type=${handoverType}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch gate validation');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 🟢 WORKING: Create handover snapshot via API
 */
async function createHandover(
  payload: CreateHandoverSnapshotPayload
): Promise<HandoverSnapshot> {
  const response = await fetch(`/api/ticketing/tickets/${payload.ticket_id}/handover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create handover');
  }

  const result = await response.json();
  return result.data;
}

/**
 * 🟢 WORKING: Get handover type label
 */
function getHandoverTypeLabel(type: HandoverType): string {
  const labels: Record<HandoverType, string> = {
    [HandoverType.BUILD_TO_QA]: 'Build → QA Handover',
    [HandoverType.QA_TO_MAINTENANCE]: 'QA → Maintenance Handover',
    [HandoverType.MAINTENANCE_COMPLETE]: 'Maintenance Completion',
  };
  return labels[type];
}

/**
 * 🟢 WORKING: Main handover wizard component
 */
export function HandoverWizard({
  ticketId,
  handoverType,
  fromOwnerType,
  fromOwnerId,
  toOwnerType,
  toOwnerId,
  onComplete,
  onCancel,
}: HandoverWizardProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // 🟢 WORKING: Query for gate validation
  const {
    data: validation,
    isLoading,
    isError,
    error: validationError,
  } = useQuery<HandoverGateValidation>({
    queryKey: ['handoverValidation', ticketId, handoverType],
    queryFn: () => fetchGateValidation(ticketId, handoverType),
  });

  // 🟢 WORKING: Mutation to create handover
  const createHandoverMutation = useMutation({
    mutationFn: (payload: CreateHandoverSnapshotPayload) => createHandover(payload),
    onSuccess: (snapshot) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['handoverHistory', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });

      // Call completion callback
      if (onComplete) {
        onComplete(snapshot);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // 🟢 WORKING: Handle handover submission
  const handleSubmit = () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!validation?.can_handover) {
      setError('Cannot handover - blocking issues must be resolved');
      return;
    }

    const payload: CreateHandoverSnapshotPayload = {
      ticket_id: ticketId,
      handover_type: handoverType,
      handover_by: user.id,
      from_owner_type: fromOwnerType,
      from_owner_id: fromOwnerId,
      to_owner_type: toOwnerType,
      to_owner_id: toOwnerId,
    };

    createHandoverMutation.mutate(payload);
  };

  // 🟢 WORKING: Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white/5 border border-white/10 rounded-lg">
        <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
        <span className="ml-2 text-white/60">Validating handover gates...</span>
      </div>
    );
  }

  // 🟢 WORKING: Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-500/10 border border-red-500/20 rounded-lg">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <span className="ml-2 text-red-400">
          Failed to validate handover gates: {validationError?.message || 'Unknown error'}
        </span>
      </div>
    );
  }

  // 🟢 WORKING: No validation data
  if (!validation) {
    return (
      <div className="flex items-center justify-center p-8 bg-white/5 border border-white/10 rounded-lg">
        <AlertCircle className="w-6 h-6 text-white/60" />
        <span className="ml-2 text-white/60">No validation data available</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">{getHandoverTypeLabel(handoverType)}</h2>
        <p className="text-white/60">
          Review the checklist below and ensure all required gates pass before completing handover
        </p>
      </div>

      {/* Ownership Transfer (if applicable) */}
      {(fromOwnerType || toOwnerType) && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Ownership Transfer
          </h3>
          <div className="flex items-center gap-4 text-white/80">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
              {fromOwnerType || 'Unknown'}
            </span>
            <ArrowRight className="w-4 h-4 text-white/40" />
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              {toOwnerType || 'Unknown'}
            </span>
          </div>
        </div>
      )}

      {/* Gate Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-white/60 mb-1">Gates Passed</div>
          <div className="text-3xl font-bold text-green-400">{validation.gates_passed.length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-white/60 mb-1">Gates Failed</div>
          <div className="text-3xl font-bold text-red-400">{validation.gates_failed.length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-white/60 mb-1">Warnings</div>
          <div className="text-3xl font-bold text-yellow-400">{validation.warnings.length}</div>
        </div>
      </div>

      {/* Handover Checklist */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Handover Checklist</h3>

        {/* Passed Gates */}
        {validation.gates_passed.length > 0 && (
          <div className="space-y-3 mb-6">
            {validation.gates_passed.map((gate) => (
              <div
                key={gate.gate_name}
                className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 font-medium">{gate.gate_name.replace(/_/g, ' ').toUpperCase()}</span>
                    {gate.required && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded text-xs font-medium">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-green-300/90 mt-1">{gate.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Failed Gates */}
        {validation.gates_failed.length > 0 && (
          <div className="space-y-3">
            {validation.gates_failed.map((gate) => (
              <div
                key={gate.gate_name}
                className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 font-medium">{gate.gate_name.replace(/_/g, ' ').toUpperCase()}</span>
                    {gate.required && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs font-medium">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-red-300/90 mt-1">{gate.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blocking Issues */}
      {validation.blocking_issues.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Blocking Issues ({validation.blocking_issues.length})
          </h3>
          <div className="space-y-4">
            {validation.blocking_issues.map((issue, index) => (
              <div key={index} className="border-l-4 border-red-500/50 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-xs font-medium uppercase">
                    {issue.severity}
                  </span>
                  <span className="text-sm text-white/60">{issue.gate_name.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-red-300 font-medium mb-1">{issue.message}</p>
                <p className="text-sm text-red-300/70">
                  <strong>Resolution:</strong> {issue.resolution_hint}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Warnings ({validation.warnings.length})
          </h3>
          <ul className="space-y-2">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2 text-yellow-300/90">
                <span className="mt-1.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-sm text-red-300/90 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={createHandoverMutation.isPending}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={!validation.can_handover || createHandoverMutation.isPending}
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            validation.can_handover
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-red-500/20 text-red-400 cursor-not-allowed'
          )}
        >
          {createHandoverMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Handover...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Complete Handover
            </>
          )}
        </button>
      </div>
    </div>
  );
}
