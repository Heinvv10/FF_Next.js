/**
 * Contract Types Component
 * Displays staff breakdown by contract type with colored progress bars
 */

import { Clock } from 'lucide-react';

interface ContractTypesProps {
  staffByContractType: Record<string, number>;
  totalStaff: number;
}

export function ContractTypes({ staffByContractType, totalStaff }: ContractTypesProps) {
  const getContractColor = (type: string) => {
    switch (type) {
      case 'permanent': return 'bg-green-500';
      case 'contract': return 'bg-orange-500';
      case 'temporary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-[var(--ff-bg-secondary)] rounded-lg border border-[var(--ff-border-light)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--ff-text-primary)]">Contract Types</h3>
        <Clock className="w-5 h-5 text-[var(--ff-text-secondary)]" />
      </div>
      <div className="space-y-3">
        {Object.entries(staffByContractType).map(([type, count]) => {
          const percentage = (count / totalStaff) * 100;
          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--ff-text-secondary)] capitalize">
                  {type.replace('_', ' ')}
                </span>
                <span className="text-sm font-medium text-[var(--ff-text-primary)]">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-[var(--ff-border-light)] rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getContractColor(type)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}