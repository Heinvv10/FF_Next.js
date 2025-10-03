/**
 * RegionSelect - Multi-select province/region dropdown component
 * Allows selection of multiple provinces for service regions
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { SA_PROVINCES } from '@/constants/contractor/validation';
import type { SAProvince } from '@/types/contractor/import.types';

interface RegionSelectProps {
  value: SAProvince[];
  onChange: (regions: SAProvince[]) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function RegionSelect({
  value,
  onChange,
  error,
  className = '',
  disabled = false
}: RegionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleProvinceToggle = (province: SAProvince) => {
    const newValue = value.includes(province)
      ? value.filter(p => p !== province)
      : [...value, province];
    onChange(newValue);
  };

  const handleRemoveProvince = (province: SAProvince) => {
    onChange(value.filter(p => p !== province));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Region of Operations
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full text-left px-3 py-2 border rounded-md bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                     ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {value.length === 0 ? (
            <span className="text-gray-500">Select regions...</span>
          ) : (
            <span>{value.length} region(s) selected</span>
          )}
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 
                         dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {SA_PROVINCES.map((province) => (
              <label
                key={province}
                className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(province)}
                  onChange={() => handleProvinceToggle(province)}
                  className="mr-2"
                />
                <span className="text-gray-900 dark:text-gray-100">{province}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Selected regions tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((province) => (
            <span
              key={province}
              className="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900 
                        text-green-800 dark:text-green-200 rounded-md"
            >
              {province}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveProvince(province)}
                  className="ml-1 text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      <p className="text-gray-500 text-xs mt-1">
        Select provinces where contractor operates
      </p>
    </div>
  );
}