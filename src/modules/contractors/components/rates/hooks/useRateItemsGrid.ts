/**
 * Custom hook for RateItemsGrid business logic
 * Extracted to comply with constitutional 300-line limit
 * Handles state management, API calls, and business operations
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  ContractorRateItem,
  ServiceTemplate,
  ContractorRateItemFormData,
  ContractorRateCard
} from '@/types/contractor';
import { RateItemApiService, ServiceTemplateApiService } from '@/services/contractor';
import { log } from '@/lib/logger';

export interface UseRateItemsGridProps {
  rateCard: ContractorRateCard;
  serviceTemplates?: ServiceTemplate[];
  onRateItemAdd?: (item: ContractorRateItem) => void;
  onRateItemUpdate?: (item: ContractorRateItem) => void;
  onRateItemDelete?: (itemId: string) => void;
}

export interface UseRateItemsGridReturn {
  // Data state
  rateItems: ContractorRateItem[];
  templates: ServiceTemplate[];
  loading: boolean;
  error: string | null;
  
  // Edit state
  editingItemId: string | null;
  editingData: Partial<ContractorRateItemFormData>;
  
  // Add form state
  showAddForm: boolean;
  newItemData: ContractorRateItemFormData;
  
  // Filter state  
  searchTerm: string;
  selectedCategory: 'deliverable' | 'service' | '';
  showOnlyNegotiable: boolean;
  filteredItems: ContractorRateItem[];
  
  // Actions
  setError: (error: string | null) => void;
  handleStartEdit: (item: ContractorRateItem) => void;
  handleSaveEdit: (itemId: string) => Promise<void>;
  handleCancelEdit: () => void;
  handleDeleteItem: (itemId: string) => Promise<void>;
  handleAddItem: () => Promise<void>;
  setShowAddForm: (show: boolean) => void;
  setNewItemData: React.Dispatch<React.SetStateAction<ContractorRateItemFormData>>;
  setEditingData: React.Dispatch<React.SetStateAction<Partial<ContractorRateItemFormData>>>;
  
  // Filter actions
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: 'deliverable' | 'service' | '') => void;
  setShowOnlyNegotiable: (show: boolean) => void;
}

export function useRateItemsGrid({
  rateCard,
  serviceTemplates = [],
  onRateItemAdd,
  onRateItemUpdate,
  onRateItemDelete
}: UseRateItemsGridProps): UseRateItemsGridReturn {
  // Data state
  const [rateItems, setRateItems] = useState<ContractorRateItem[]>([]);
  const [templates, setTemplates] = useState<ServiceTemplate[]>(serviceTemplates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<ContractorRateItemFormData>>({});
  
  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemData, setNewItemData] = useState<ContractorRateItemFormData>({
    serviceTemplateId: '',
    rate: 0,
    isNegotiable: false
  });
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'deliverable' | 'service' | ''>('');
  const [showOnlyNegotiable, setShowOnlyNegotiable] = useState(false);

  // Load rate items and templates
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [itemsResponse, templatesResponse] = await Promise.all([
          RateItemApiService.getRateItems(rateCard.id),
          serviceTemplates.length === 0 
            ? ServiceTemplateApiService.getServiceTemplates({ isActive: true })
            : Promise.resolve({ data: serviceTemplates })
        ]);
        
        setRateItems(itemsResponse);
        setTemplates(templatesResponse.data);
        
      } catch (err) {
        setError('Failed to load rate items');
        log.error('Error loading rate items:', { data: err }, 'useRateItemsGrid');
      } finally {
        setLoading(false);
      }
    };

    if (rateCard.id) {
      loadData();
    }
  }, [rateCard.id, serviceTemplates]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = [...rateItems];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.serviceName.toLowerCase().includes(term) ||
        item.serviceCode?.toLowerCase().includes(term) ||
        item.unit?.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Apply negotiable filter
    if (showOnlyNegotiable) {
      filtered = filtered.filter(item => item.isNegotiable);
    }
    
    return filtered.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
  }, [rateItems, searchTerm, selectedCategory, showOnlyNegotiable]);

  // Start editing an item
  const handleStartEdit = (item: ContractorRateItem) => {
    setEditingItemId(item.id);
    setEditingData({
      rate: item.rate,
      isNegotiable: item.isNegotiable
    });
  };

  // Save edited item
  const handleSaveEdit = async (itemId: string) => {
    try {
      const updatedItem = await RateItemApiService.updateRateItem(itemId, editingData);
      
      setRateItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updatedItem } : item
      ));
      
      setEditingItemId(null);
      setEditingData({});
      onRateItemUpdate?.(updatedItem);
      
    } catch (err) {
      log.error('Error updating rate item:', { data: err }, 'useRateItemsGrid');
      setError('Failed to update rate item');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingData({});
  };

  // Add new item
  const handleAddItem = async () => {
    try {
      const newItem = await RateItemApiService.createRateItem({
        ...newItemData,
        rateCardId: rateCard.id
      });
      
      setRateItems(prev => [...prev, newItem]);
      setShowAddForm(false);
      setNewItemData({
        serviceTemplateId: '',
        rate: 0,
        isNegotiable: false
      });
      
      onRateItemAdd?.(newItem);
      
    } catch (err) {
      log.error('Error adding rate item:', { data: err }, 'useRateItemsGrid');
      setError('Failed to add rate item');
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      await RateItemApiService.deleteRateItem(itemId);
      
      setRateItems(prev => prev.filter(item => item.id !== itemId));
      onRateItemDelete?.(itemId);
      
    } catch (err) {
      log.error('Error deleting rate item:', { data: err }, 'useRateItemsGrid');
      setError('Failed to delete rate item');
    }
  };

  return {
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
  };
}