/**
 * Contract Types Component
 * Displays staff breakdown by SA-compliant contract types with colored progress bars
 *
 * Color Legend:
 * - Permanent → Green (stable, full protection)
 * - Fixed-term → Blue (time-limited employee)
 * - Part-time → Cyan (<24 hrs/week)
 * - Temporary → Yellow (casual/seasonal)
 * - Independent Contractor → Purple (not an employee)
 * - Intern → Pink (skills development)
 */

import { Clock, Users } from 'lucide-react';
import { SA_CONTRACT_TYPE_LABELS } from '@/types/staff/compliance.types';

interface ContractTypesProps {
  staffByContractType: Record<string, number>;
  totalStaff: number;
}

// SA Contract Type Color Configuration
const CONTRACT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  // SA-compliant contract types
  permanent: { bg: 'bg-green-500', text: 'text-green-500' },
  fixed_term: { bg: 'bg-blue-500', text: 'text-blue-500' },
  part_time: { bg: 'bg-cyan-500', text: 'text-cyan-500' },
  temporary: { bg: 'bg-yellow-500', text: 'text-yellow-500' },
  independent_contractor: { bg: 'bg-purple-500', text: 'text-purple-500' },
  intern: { bg: 'bg-pink-500', text: 'text-pink-500' },
  // Legacy types (for backward compatibility)
  contract: { bg: 'bg-blue-500', text: 'text-blue-500' },      // Maps to fixed_term
  freelance: { bg: 'bg-purple-500', text: 'text-purple-500' }, // Maps to independent_contractor
  consultant: { bg: 'bg-purple-500', text: 'text-purple-500' }, // Maps to independent_contractor
};

// Human-readable labels for all contract types
const CONTRACT_TYPE_DISPLAY_LABELS: Record<string, string> = {
  ...SA_CONTRACT_TYPE_LABELS,
  // Legacy type labels
  contract: 'Contract',
  freelance: 'Freelance',
  consultant: 'Consultant',
};

export function ContractTypes({ staffByContractType, totalStaff }: ContractTypesProps) {
  const getContractColor = (type: string) => {
    return CONTRACT_TYPE_COLORS[type]?.bg || 'bg-gray-500';
  };

  const getContractLabel = (type: string) => {
    return CONTRACT_TYPE_DISPLAY_LABELS[type] || type.replace(/_/g, ' ');
  };

  // Sort by count descending
  const sortedEntries = Object.entries(staffByContractType).sort(([, a], [, b]) => b - a);

  // Calculate employees vs contractors
  const employeeTypes = ['permanent', 'fixed_term', 'part_time', 'temporary', 'intern', 'contract'];
  const employeeCount = sortedEntries
    .filter(([type]) => employeeTypes.includes(type))
    .reduce((sum, [, count]) => sum + count, 0);
  const contractorCount = totalStaff - employeeCount;

  return (
    <div className="bg-[var(--ff-bg-secondary)] rounded-lg border border-[var(--ff-border-light)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--ff-text-primary)]">Contract Types</h3>
        <Clock className="w-5 h-5 text-[var(--ff-text-secondary)]" />
      </div>

      {/* Employee vs Contractor Summary */}
      <div className="flex gap-4 mb-4 p-3 bg-[var(--ff-bg-tertiary)] rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-green-500" />
          <span className="text-sm text-[var(--ff-text-secondary)]">
            Employees: <span className="font-medium text-[var(--ff-text-primary)]">{employeeCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-500" />
          <span className="text-sm text-[var(--ff-text-secondary)]">
            Contractors: <span className="font-medium text-[var(--ff-text-primary)]">{contractorCount}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {sortedEntries.map(([type, count]) => {
          const percentage = totalStaff > 0 ? (count / totalStaff) * 100 : 0;
          return (
            <div key={type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[var(--ff-text-secondary)]">
                  {getContractLabel(type)}
                </span>
                <span className="text-sm font-medium text-[var(--ff-text-primary)]">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-[var(--ff-border-light)] rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getContractColor(type)} transition-all duration-300`}
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