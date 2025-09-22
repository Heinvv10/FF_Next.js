/**
 * Professional Information Section - Specializations & Certifications
 * Handles contractor specializations and certifications input
 */

import type { ContractorFormData } from '@/types/contractor.types';

interface ProfessionalInfoSectionProps {
  formData: ContractorFormData;
  handleInputChange: (field: keyof ContractorFormData, value: any) => void;
  handleSpecializationsChange: (value: string) => void;
  handleCertificationsChange: (value: string) => void;
}

export function ProfessionalInfoSection({
  formData,
  handleInputChange,
  handleSpecializationsChange,
  handleCertificationsChange
}: ProfessionalInfoSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Professional Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specializations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specializations (comma-separated)
          </label>
          <input
            type="text"
            value={formData.specializations.join(', ')}
            onChange={(e) => handleSpecializationsChange(e.target.value)}
            placeholder="e.g., Fiber Optic Installation, Network Cabling, Splicing"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Areas of expertise and specializations
          </p>
        </div>

        {/* Certifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Certifications (comma-separated)
          </label>
          <input
            type="text"
            value={formData.certifications.join(', ')}
            onChange={(e) => handleCertificationsChange(e.target.value)}
            placeholder="e.g., Fiber Optic Certified, Network+, Safety Training"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Professional certifications and licenses
          </p>
        </div>
      </div>
    </div>
  );
}