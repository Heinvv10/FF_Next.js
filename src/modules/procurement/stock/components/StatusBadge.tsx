import React from 'react';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { StockStatus } from '../types/stock.types';

interface StatusBadgeProps {
  status: StockStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    'in-stock': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'In Stock' },
    'low-stock': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Low Stock' },
    'out-of-stock': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Out of Stock' },
    'excess-stock': { color: 'bg-blue-100 text-blue-800', icon: Package, label: 'Excess Stock' }
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
};
