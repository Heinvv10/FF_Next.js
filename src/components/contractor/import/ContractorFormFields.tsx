/**
 * ContractorFormFields - Simplified container for form field components
 * Re-exports form components for backward compatibility
 */

// Re-export all form components from the new organized structure
export {
  BusinessTypeSelect,
  ProvinceSelect,
  ServiceSelect,
  RegionSelect
} from '@/components/contractor/forms';

// Re-export types for convenience
export type {
  BusinessType,
  SAProvince
} from '@/types/contractor/import.types';