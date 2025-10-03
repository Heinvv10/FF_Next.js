/**
 * Rate Items Grid Component (Refactored)
 * Main orchestrating component - constitutionally compliant (<200 lines)
 * Uses custom hook and extracted components for business logic and UI
 */

import React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';

import { RateItemsGridProps } from '@/types/contractor';
import { useRateItemsGrid } from './hooks/useRateItemsGrid';
import { RateItemsGridFilters } from './filters/RateItemsGridFilters';
import { RateItemsAddForm } from './actions/RateItemsAddForm';
import { RateItemsTable } from './table/RateItemsTable';

export function RateItemsGrid({ 
  rateCard,
  serviceTemplates = [],
  onRateItemAdd,
  onRateItemUpdate,
  onRateItemDelete,
  editable = true
}: RateItemsGridProps) {
  const {
    // Data state
    rateItems,
    templates,
    loading,
    error,
    
    // Edit state
    editingItemId,
    editingData,
    
    // Add form state
    showAddForm,
    newItemData,
    
    // Filter state
    searchTerm,
    selectedCategory,
    showOnlyNegotiable,
    filteredItems,
    
    // Actions
    setError,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDeleteItem,
    handleAddItem,
    setShowAddForm,
    setNewItemData,
    setEditingData,
    
    // Filter actions
    setSearchTerm,
    setSelectedCategory,
    setShowOnlyNegotiable
  } = useRateItemsGrid({
    rateCard,
    serviceTemplates,
    onRateItemAdd,
    onRateItemUpdate,
    onRateItemDelete
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading rate items...</span>
      </div>
    );
  }

  return (
    <div className="rate-items-grid">
      {/* Header with filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Service Rates</h3>
            <p className="text-sm text-gray-500">
              {filteredItems.length} of {rateItems.length} services
            </p>
          </div>
          {editable && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <RateItemsGridFilters
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          showOnlyNegotiable={showOnlyNegotiable}
          onSearchChange={setSearchTerm}
          onCategoryChange={setSelectedCategory}
          onNegotiableChange={setShowOnlyNegotiable}
        />
      </div>

      {/* Add new item form */}
      <RateItemsAddForm
        show={showAddForm && editable}
        rateCard={rateCard}
        templates={templates}
        rateItems={rateItems}
        newItemData={newItemData}
        onNewItemDataChange={setNewItemData}
        onAddItem={handleAddItem}
        onCancel={() => setShowAddForm(false)}
      />

      {/* Rate items table */}
      <RateItemsTable
        rateCard={rateCard}
        items={filteredItems}
        editingItemId={editingItemId}
        editingData={editingData}
        onEditingDataChange={setEditingData}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onDeleteItem={handleDeleteItem}
        editable={editable}
      />
    </div>
  );
}