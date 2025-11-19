// ============= Document Status Configuration =============
// Status badge configuration for document status display

import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  type LucideIcon
} from 'lucide-react';

export interface DocumentStatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  iconColor: string;
}

type DocumentStatusKey = 'current' | 'expiring_soon' | 'expired' | 'pending_review' | 'rejected';

export const statusConfig: Record<DocumentStatusKey, DocumentStatusConfig> = {
  current: {
    label: 'Current',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600'
  },
  expiring_soon: {
    label: 'Expiring Soon',
    icon: AlertTriangle,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600'
  },
  expired: {
    label: 'Expired',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600'
  },
  pending_review: {
    label: 'Pending Review',
    icon: Clock,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600'
  }
};
