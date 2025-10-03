/**
 * RateItemsAddForm Component
 * Form for adding new rate items to a rate card
 * Extracted to comply with constitutional 300-line limit
 */

import React from 'react';
import { ServiceTemplate, ContractorRateItemFormData, ContractorRateCard } from '@/types/contractor';

export interface ServiceTemplateSelectorProps {
  templates: ServiceTemplate[];
  rateItems: any[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ServiceTemplateSelector({
  templates,
  rateItems,
  value,
  onChange,
  disabled = false
}: ServiceTemplateSelectorProps) {
  const availableTemplates = templates.filter(template => 
    !rateItems.some(item => item.serviceTemplateId === template.id) || 
    template.id === value
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
    >
      <option value="">Select service...</option>
      {availableTemplates.map(template => (
        <option key={template.id} value={template.id}>
          {template.code ? `${template.code} - ` : ''}{template.name}
        </option>
      ))}
    </select>
  );
}

export interface RateItemsAddFormProps {
  show: boolean;
  rateCard: ContractorRateCard;
  templates: ServiceTemplate[];
  rateItems: any[];
  newItemData: ContractorRateItemFormData;
  onNewItemDataChange: React.Dispatch<React.SetStateAction<ContractorRateItemFormData>>;
  onAddItem: () => Promise<void>;
  onCancel: () => void;
}

export function RateItemsAddForm({
  show,
  rateCard,
  templates,
  rateItems,
  newItemData,
  onNewItemDataChange,
  onAddItem,
  onCancel
}: RateItemsAddFormProps) {
  if (!show) return null;

  const handleTemplateChange = (value: string) => {
    const template = templates.find(t => t.id === value);
    onNewItemDataChange(prev => ({
      ...prev,
      serviceTemplateId: value,
      // Auto-fill from template
      rate: template?.baseRate || prev.rate
    }));
  };

  const handleRateChange = (value: string) => {
    onNewItemDataChange(prev => ({
      ...prev,
      rate: parseFloat(value) || 0
    }));
  };

  const handleCancel = () => {
    onCancel();
    onNewItemDataChange({
      serviceTemplateId: '',
      rate: 0,
      isNegotiable: false
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-medium text-gray-900 mb-3">Add New Service Rate</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Template
          </label>
          <ServiceTemplateSelector
            templates={templates}
            rateItems={rateItems}
            value={newItemData.serviceTemplateId}
            onChange={handleTemplateChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate ({rateCard.currency})
          </label>
          <input
            type="number"
            step="0.01"
            value={newItemData.rate}
            onChange={(e) => handleRateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            &nbsp;
          </label>
          <div className="flex space-x-2">
            <button
              onClick={onAddItem}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              disabled={!newItemData.serviceTemplateId || newItemData.rate <= 0}
            >
              Add
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}