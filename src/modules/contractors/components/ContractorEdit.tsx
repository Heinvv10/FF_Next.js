/**
 * ContractorEdit Component - Edit existing contractor following FibreFlow patterns
 * Integrated with Neon database and Firebase for full functionality
 */

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useContractorEdit,
  ContractorEditHeader,
  ContractorEditForm
} from './edit';

export function ContractorEdit() {
  const {
    contractor,
    formData,
    isLoading,
    isSubmitting,
    handleInputChange,
    handleTagsChange,
    handleSubmit,
    navigate
  } = useContractorEdit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" label="Loading contractor..." />
      </div>
    );
  }

  if (!contractor) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ContractorEditHeader 
        onBack={() => navigate('/app/contractors')} 
      />

      <ContractorEditForm
        formData={formData}
        isSubmitting={isSubmitting}
        handleInputChange={handleInputChange}
        handleTagsChange={handleTagsChange}
        handleSubmit={handleSubmit}
        onCancel={() => navigate('/app/contractors')}
      />
    </div>
  );
}