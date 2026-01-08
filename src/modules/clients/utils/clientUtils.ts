import { ClientStatus, ClientPriority, ClientCategory } from '@/types/client.types';

export const getStatusColor = (status: ClientStatus): string => {
  switch (status) {
    case ClientStatus.ACTIVE:
      return 'bg-green-500/20 text-green-400';
    case ClientStatus.INACTIVE:
      return 'bg-gray-500/20 text-gray-400';
    case ClientStatus.PROSPECT:
      return 'bg-blue-500/20 text-blue-400';
    case ClientStatus.CHURNED:
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export const getPriorityColor = (priority: ClientPriority): string => {
  switch (priority) {
    case ClientPriority.VIP:
      return 'bg-purple-500/20 text-purple-400';
    case ClientPriority.CRITICAL:
      return 'bg-red-500/20 text-red-400';
    case ClientPriority.HIGH:
      return 'bg-orange-500/20 text-orange-400';
    case ClientPriority.MEDIUM:
      return 'bg-yellow-500/20 text-yellow-400';
    case ClientPriority.LOW:
      return 'bg-gray-500/20 text-gray-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

export const getCategoryIcon = (category: ClientCategory): string => {
  switch (category) {
    case ClientCategory.ENTERPRISE:
      return '🏢';
    case ClientCategory.SME:
      return '🏪';
    case ClientCategory.RESIDENTIAL:
      return '🏠';
    case ClientCategory.GOVERNMENT:
      return '🏛️';
    case ClientCategory.NON_PROFIT:
      return '❤️';
    case ClientCategory.EDUCATION:
      return '🎓';
    case ClientCategory.HEALTHCARE:
      return '🏥';
    default:
      return '📋';
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};