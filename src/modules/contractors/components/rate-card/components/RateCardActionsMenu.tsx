/**
 * Rate Card Actions Menu Component
 * Dropdown menu for rate card actions
 * @module RateCardManagement
 */

import React from 'react';
import { MoreHorizontal, Edit, Copy, Archive, Trash2, Eye } from 'lucide-react';
import { RateCardActionsMenuProps } from '../types/rateCardManagement.types';

export function RateCardActionsMenu({
  rateCard,
  onEdit,
  onView,
  onClone,
  onArchive,
  onDelete,
  onSubmitForApproval,
  isVisible,
  onClose
}: RateCardActionsMenuProps) {
  if (!isVisible) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        title="Edit rate card"
      >
        <Edit className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="absolute right-4 top-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView();
          onClose();
        }}
        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Eye className="w-4 h-4 mr-2" />
        View Details
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClone();
          onClose();
        }}
        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Copy className="w-4 h-4 mr-2" />
        Clone
      </button>

      {rateCard.approvalStatus === 'pending' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSubmitForApproval();
            onClose();
          }}
          className="w-full flex items-center px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
        >
          <Archive className="w-4 h-4 mr-2" />
          Submit for Approval
        </button>
      )}

      <div className="border-t border-gray-100 my-1" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onArchive();
          onClose();
        }}
        className="w-full flex items-center px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
      >
        <Archive className="w-4 h-4 mr-2" />
        Archive
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full flex items-center px-3 py-2 text-sm text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </button>
    </div>
  );
}