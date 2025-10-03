/**
 * Rate Card Item Component
 * Individual rate card item in the list
 * @module RateCardManagement
 */

import React from 'react';
import { Calendar, DollarSign, FileText } from 'lucide-react';
import { formatDate } from '@/src/utils/dateHelpers';
import { formatCurrency } from '@/lib/utils';
import { RateCardItemProps } from '../types/rateCardManagement.types';
import { StatusBadge } from './StatusBadge';
import { ApprovalBadge } from './ApprovalBadge';
import { RateCardActionsMenu } from './RateCardActionsMenu';

export function RateCardItem({
  rateCard,
  onEdit,
  onView,
  onClone,
  onArchive,
  onDelete,
  onSubmitForApproval
}: RateCardItemProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {rateCard.name}
            </h3>
            <StatusBadge status={rateCard.status} />
            <ApprovalBadge status={rateCard.approvalStatus} />
          </div>

          {/* Description */}
          {rateCard.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {rateCard.description}
            </p>
          )}

          {/* Key Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {/* Effective Date */}
            <div className="flex items-center text-gray-500">
              <Calendar className="w-4 h-4 mr-1.5" />
              <span>
                {formatDate(rateCard.effectiveDate)}
              </span>
            </div>

            {/* Total Rate Items */}
            <div className="flex items-center text-gray-500">
              <FileText className="w-4 h-4 mr-1.5" />
              <span>
                {rateCard.rateItems?.length || 0} rate items
              </span>
            </div>

            {/* Base Rate */}
            <div className="flex items-center text-gray-900 font-medium">
              <DollarSign className="w-4 h-4 mr-1.5" />
              <span>
                {formatCurrency(rateCard.baseRate || 0)}
              </span>
            </div>

            {/* Last Updated */}
            <div className="text-gray-500">
              Updated {formatDate(rateCard.updatedAt)}
            </div>
          </div>

          {/* Tags/Categories */}
          {rateCard.categories && rateCard.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {rateCard.categories.slice(0, 3).map((category, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {category}
                </span>
              ))}
              {rateCard.categories.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                  +{rateCard.categories.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className="ml-4 relative">
          <RateCardActionsMenu
            rateCard={rateCard}
            onEdit={onEdit}
            onView={onView}
            onClone={onClone}
            onArchive={onArchive}
            onDelete={onDelete}
            onSubmitForApproval={onSubmitForApproval}
            isVisible={false}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
}