/**
 * Document Filter Presets Component
 * Quick filter preset buttons
 * @module DocumentFilters
 */

import React from 'react';
import { Tag } from 'lucide-react';
import { FilterPreset } from '../types/documentFilters.types';

interface DocumentFilterPresetsProps {
  presets: FilterPreset[];
  selectedPreset: FilterPreset | null;
  applyPreset: (preset: FilterPreset) => void;
}

export function DocumentFilterPresets({ presets, selectedPreset, applyPreset }: DocumentFilterPresetsProps) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
      <div className="flex items-center gap-2 overflow-x-auto">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors ${
              selectedPreset?.id === preset.id
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            title={preset.description}
          >
            <Tag className="w-3 h-3 mr-1" />
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}