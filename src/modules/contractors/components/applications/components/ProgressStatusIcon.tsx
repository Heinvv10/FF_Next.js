/**
 * Progress Status Icon Component
 * Displays appropriate icon based on progress status
 */

import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { ProgressStatus } from '../utils/progressUtils';

interface ProgressStatusIconProps {
  status: ProgressStatus['status'];
  className?: string;
}

export function ProgressStatusIcon({ status, className = '' }: ProgressStatusIconProps) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className={`h-5 w-5 text-green-500 ${className}`} />;
    case 'near-complete':
      return <TrendingUp className={`h-5 w-5 text-blue-500 ${className}`} />;
    case 'in-progress':
      return <Clock className={`h-5 w-5 text-yellow-500 ${className}`} />;
    case 'started':
      return <Clock className={`h-5 w-5 text-orange-500 ${className}`} />;
    default:
      return <AlertTriangle className={`h-5 w-5 text-gray-400 ${className}`} />;
  }
}