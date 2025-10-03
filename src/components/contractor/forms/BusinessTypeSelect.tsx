/**
 * BusinessTypeSelect - Business type dropdown component
 * Provides selection for South African business entity types
 */

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/components/ui/Select';
import { BUSINESS_TYPES } from '@/constants/contractor/validation';
import type { BusinessType } from '@/types/contractor/import.types';

interface BusinessTypeSelectProps {
  value?: BusinessType;
  onChange: (value: BusinessType) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function BusinessTypeSelect({
  value,
  onChange,
  error,
  className = '',
  disabled = false
}: BusinessTypeSelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Business Type*
      </label>
      <Select 
        value={value || ''} 
        onValueChange={(newValue) => onChange(newValue as BusinessType)}
        disabled={disabled}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Select business type" />
        </SelectTrigger>
        <SelectContent>
          {BUSINESS_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      <p className="text-gray-500 text-xs mt-1">
        South African business entity type
      </p>
    </div>
  );
}