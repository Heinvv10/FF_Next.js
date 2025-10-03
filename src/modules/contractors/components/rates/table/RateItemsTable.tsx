/**
 * RateItemsTable Component  
 * Table display for rate items with inline editing
 * Extracted to comply with constitutional 300-line limit
 */

import React from 'react';
import { Edit, Trash2, Save, X, DollarSign } from 'lucide-react';
import { 
  ContractorRateItem, 
  ContractorRateItemFormData, 
  ContractorRateCard 
} from '@/types/contractor';
import { formatCurrency } from '@/lib/utils';

export interface RateItemsTableProps {
  rateCard: ContractorRateCard;
  items: ContractorRateItem[];
  editingItemId: string | null;
  editingData: Partial<ContractorRateItemFormData>;
  onEditingDataChange: React.Dispatch<React.SetStateAction<Partial<ContractorRateItemFormData>>>;
  onStartEdit: (item: ContractorRateItem) => void;
  onSaveEdit: (itemId: string) => Promise<void>;
  onCancelEdit: () => void;
  onDeleteItem: (itemId: string) => Promise<void>;
  editable?: boolean;
}

export function RateItemsTable({
  rateCard,
  items,
  editingItemId,
  editingData,
  onEditingDataChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteItem,
  editable = true
}: RateItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No rate items found</h3>
        <p className="text-gray-500 mb-4">
          Add service rates to complete this rate card
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Service
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rate ({rateCard.currency})
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Negotiable
            </th>
            {editable && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              {/* Service Name */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {item.serviceName}
                </div>
                {item.category && (
                  <div className="text-xs text-gray-500 capitalize">
                    {item.category}
                  </div>
                )}
              </td>

              {/* Service Code */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.serviceCode || '-'}
              </td>

              {/* Unit */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.unit || '-'}
              </td>

              {/* Rate */}
              <td className="px-6 py-4 whitespace-nowrap">
                {editingItemId === item.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editingData.rate || 0}
                    onChange={(e) => onEditingDataChange(prev => ({
                      ...prev,
                      rate: parseFloat(e.target.value) || 0
                    }))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.rate, rateCard.currency)}
                  </div>
                )}
              </td>

              {/* Negotiable */}
              <td className="px-6 py-4 whitespace-nowrap">
                {editingItemId === item.id ? (
                  <input
                    type="checkbox"
                    checked={editingData.isNegotiable || false}
                    onChange={(e) => onEditingDataChange(prev => ({
                      ...prev,
                      isNegotiable: e.target.checked
                    }))}
                    className="rounded text-blue-600"
                  />
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.isNegotiable
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.isNegotiable ? 'Yes' : 'No'}
                  </span>
                )}
              </td>

              {/* Actions */}
              {editable && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingItemId === item.id ? (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onSaveEdit(item.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onCancelEdit}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onStartEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}