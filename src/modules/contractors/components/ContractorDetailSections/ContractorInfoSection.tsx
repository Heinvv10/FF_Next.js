/**
 * Contractor Info Section
 * Header section with company name, status, and basic info
 */

import { ContractorSectionProps, ragColors, statusColors } from './types';

export function ContractorInfoSection({ contractor }: ContractorSectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{contractor.companyName}</h1>
      <div className="flex items-center gap-4 mt-2">
        {contractor.status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[contractor.status] || 'bg-gray-100 text-gray-800'}`}>
            {contractor.status.replace('_', ' ').toUpperCase()}
          </span>
        )}
        {contractor.ragOverall && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ragColors[contractor.ragOverall] || 'bg-gray-100 text-gray-800'}`}>
            RAG: {contractor.ragOverall.toUpperCase()}
          </span>
        )}
        {contractor.registrationNumber && (
          <span className="text-sm text-gray-500">
            {contractor.registrationNumber}
          </span>
        )}
      </div>
      {contractor.industryCategory && (
        <p className="text-gray-600 mt-1">{contractor.industryCategory}</p>
      )}
    </div>
  );
}