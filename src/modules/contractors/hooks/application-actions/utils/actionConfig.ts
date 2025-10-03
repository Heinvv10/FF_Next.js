/**
 * Application Actions Configuration
 * Action definitions and configurations based on application status
 * @module ApplicationActions
 */

import { Check, X, MessageCircle, ArrowUp, AlertTriangle, FileText } from 'lucide-react';
import { ActionItem } from '../types/applicationActions.types';

/**
 * Get available actions based on application status
 */
export function getAvailableActions(status: string, compact: boolean = false): ActionItem[] {
  const actions: ActionItem[] = [];

  switch (status) {
    case 'pending':
      actions.push(
        {
          action: 'approve',
          label: 'Approve',
          icon: Check,
          color: 'green',
          primary: true
        },
        {
          action: 'reject',
          label: 'Reject',
          icon: X,
          color: 'red',
          primary: compact
        },
        {
          action: 'request_info',
          label: 'Request Info',
          icon: MessageCircle,
          color: 'orange'
        }
      );
      break;

    case 'info_requested':
      actions.push(
        {
          action: 'approve',
          label: 'Approve',
          icon: Check,
          color: 'green',
          primary: true
        },
        {
          action: 'reject',
          label: 'Reject',
          icon: X,
          color: 'red'
        },
        {
          action: 'escalate',
          label: 'Escalate',
          icon: ArrowUp,
          color: 'blue'
        }
      );
      break;

    case 'under_review':
      actions.push(
        {
          action: 'approve',
          label: 'Approve',
          icon: Check,
          color: 'green',
          primary: true
        },
        {
          action: 'reject',
          label: 'Reject',
          icon: X,
          color: 'red'
        },
        {
          action: 'flag',
          label: 'Flag Issue',
          icon: AlertTriangle,
          color: 'orange'
        }
      );
      break;

    case 'approved':
      actions.push(
        {
          action: 'revoke',
          label: 'Revoke Approval',
          icon: X,
          color: 'red',
          primary: true
        },
        {
          action: 'add_note',
          label: 'Add Note',
          icon: FileText,
          color: 'blue'
        }
      );
      break;

    case 'rejected':
      actions.push(
        {
          action: 'reconsider',
          label: 'Reconsider',
          icon: ArrowUp,
          color: 'blue',
          primary: true
        },
        {
          action: 'add_note',
          label: 'Add Note',
          icon: FileText,
          color: 'gray'
        }
      );
      break;

    default:
      // No actions available for other statuses
      break;
  }

  return actions;
}

/**
 * Get action labels and messages for confirmations
 */
export const ACTION_LABELS: Record<string, string> = {
  reject: 'Reject Application',
  revoke: 'Revoke Approval',
  escalate: 'Escalate Application',
  request_info: 'Request Information'
};

export const ACTION_MESSAGES: Record<string, string> = {
  reject: 'Are you sure you want to reject this application? This action cannot be undone.',
  revoke: 'Are you sure you want to revoke this approval? The contractor will be notified.',
  escalate: 'This application will be escalated to a senior reviewer.',
  request_info: 'Additional information will be requested from the contractor.'
};

export const SUCCESS_LABELS: Record<string, string> = {
  approve: 'approved',
  reject: 'rejected',
  revoke: 'revoked',
  escalate: 'escalated',
  request_info: 'updated - information requested',
  flag: 'flagged for review',
  add_note: 'updated with note',
  reconsider: 'marked for reconsideration'
};

/**
 * Actions that require confirmation
 */
export const CONFIRMATION_REQUIRED = ['reject', 'revoke', 'escalate'];

/**
 * Actions that require a reason
 */
export const REASON_REQUIRED = ['reject', 'revoke', 'request_info'];