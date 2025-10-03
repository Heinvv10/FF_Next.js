/**
 * ProvinceSelect - South African province dropdown component
 * Provides selection for all SA provinces
 */

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/components/ui/Select';
import { SA_PROVINCES } from '@/constants/contractor/validation';
import type { SAProvince } from '@/types/contractor/import.types';

interface ProvinceSelectProps {
  value?: SAProvince;
  onChange: (value: SAProvince) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function ProvinceSelect({
  value,
  onChange,
  error,
  className = '',
  disabled = false,
  label = 'Province*'
}: ProvinceSelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <Select 
        value={value || ''} 
        onValueChange={(newValue) => onChange(newValue as SAProvince)}
        disabled={disabled}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Select province" />
        </SelectTrigger>
        <SelectContent>
          {SA_PROVINCES.map((province) => (
            <SelectItem key={province} value={province}>
              {province}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      <p className="text-gray-500 text-xs mt-1">
        South African province or region
      </p>
    </div>
  );
}