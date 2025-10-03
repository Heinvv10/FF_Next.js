/**
 * QuickApprovalButton - Simple one-click approval button
 * Extracted from ApprovalActions for constitutional compliance
 * Focused component <100 lines
 */

import React from 'react';
import { Check } from 'lucide-react';
import { ContractorDocument } from '@/types/contractor.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface QuickApprovalButtonProps {
  document: ContractorDocument;
  onApprove: () => Promise<void> | void;
  disabled?: boolean;
  processing?: boolean;
}

export function QuickApprovalButton({
  document,
  onApprove,
  disabled = false,
  processing = false,
}: QuickApprovalButtonProps) {
  return (
    <button
      onClick={onApprove}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
        transition-colors duration-200
        ${disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700 focus:bg-green-700'
        }
      `}
      title={`Quick approve ${document.name}`}
    >
      {processing ? (
        <LoadingSpinner size="sm" className="text-white" />
      ) : (
        <Check className="w-4 h-4" />
      )}
      Quick Approve
    </button>
  );
}