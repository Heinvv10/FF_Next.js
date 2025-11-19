// ============= Empty State Component =============
// Empty state for no suppliers found

import React from 'react';
import { Building2 } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
      <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Suppliers Found</h3>
      <p className="text-gray-600">No suppliers match your current filters.</p>
    </div>
  );
};
