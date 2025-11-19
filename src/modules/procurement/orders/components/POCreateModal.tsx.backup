// ============= PO Create Modal Component =============

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  User, 
  MapPin, 
  DollarSign,
  Package
} from 'lucide-react';
import {
  VelocityButton,
  GlassCard
} from '../../../../components/ui';
import type { 
  CreatePORequest, 
  CreatePOItemRequest,
  POOrderType 
} from '../../../../types/procurement/po.types';
import { poService } from '../../../../services/procurement/poService';

interface POCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
  rfqId?: string;
  quoteId?: string;
  projectId?: string;
}

interface FormData {
  projectId: string;
  rfqId?: string;
  quoteId?: string;
  supplierId: string;
  title: string;
  description?: string;
  orderType: POOrderType;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  expectedDeliveryDate?: Date;
  items: (CreatePOItemRequest & { tempId: string })[];
  notes?: string;
  internalNotes?: string;
}

export const POCreateModal: React.FC<POCreateModalProps> = ({ 
  onClose, 
  onCreated,
  rfqId,
  quoteId,
  projectId 
}) => {
  const [formData, setFormData] = useState<FormData>(() => {
    const data: FormData = {
      projectId: projectId || 'proj-001',
      supplierId: '',
      title: '',
      orderType: 'GOODS' as POOrderType,
      paymentTerms: '30 days net',
      deliveryTerms: 'DDP - Delivered Duty Paid',
      deliveryAddress: {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'South Africa'
      },
      items: []
    };
    if (rfqId) data.rfqId = rfqId;
    if (quoteId) data.quoteId = quoteId;
    return data;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  
  // Mock suppliers
  const mockSuppliers = [
    { id: 'supplier-001', name: 'FiberTech Solutions', code: 'FTS001' },
    { id: 'supplier-002', name: 'Network Install Pro', code: 'NIP001' },
    { id: 'supplier-003', name: 'Cable Systems Ltd', code: 'CSL001' }
  ];
  
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  const addItem = () => {
    const newItem: CreatePOItemRequest & { tempId: string } = {
      tempId: `temp-${Date.now()}`,
      description: '',
      category: '',
      quantity: 1,
      uom: 'pieces',
      unitPrice: 0,
      specifications: {}
    };
    
    updateFormData({
      items: [...formData.items, newItem]
    });
  };
  
  const updateItem = (tempId: string, updates: Partial<CreatePOItemRequest>) => {
    updateFormData({
      items: formData.items.map(item => 
        item.tempId === tempId ? { ...item, ...updates } : item
      )
    });
  };
  
  const removeItem = (tempId: string) => {
    updateFormData({
      items: formData.items.filter(item => item.tempId !== tempId)
    });
  };
  
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const taxAmount = subtotal * 0.15;
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };
  
  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.supplierId) return 'Supplier is required';
    if (formData.items.length === 0) return 'At least one item is required';
    if (!formData.deliveryAddress.street.trim()) return 'Delivery address is required';
    
    for (const item of formData.items) {
      if (!item.description.trim()) return 'Item description is required';
      if (item.quantity <= 0) return 'Item quantity must be greater than 0';
      if (item.unitPrice < 0) return 'Item unit price cannot be negative';
    }
    
    return null;
  };
  
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { items: formItems, ...restFormData } = formData;
      const cleanItems = formItems.map(({ tempId: _tempId, ...item }) => item);
      
      const createRequest: CreatePORequest = {
        ...restFormData,
        items: cleanItems
      };
      
      await poService.createPO(createRequest);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };
  
  const { subtotal, taxAmount, total } = calculateTotals();
  
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Basic Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter PO title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData({ description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter PO description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Type *
            </label>
            <select
              value={formData.orderType}
              onChange={(e) => updateFormData({ orderType: e.target.value as POOrderType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="GOODS">Goods</option>
              <option value="SERVICES">Services</option>
              <option value="MIXED">Mixed</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Supplier Information
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier *
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => updateFormData({ supplierId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a supplier</option>
              {mockSuppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => updateFormData({ paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="30 days net">30 days net</option>
                <option value="60 days net">60 days net</option>
                <option value="90 days net">90 days net</option>
                <option value="COD">Cash on Delivery</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Terms
              </label>
              <input
                type="text"
                value={formData.deliveryTerms}
                onChange={(e) => updateFormData({ deliveryTerms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter delivery terms"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Delivery Address
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.street}
              onChange={(e) => updateFormData({ 
                deliveryAddress: { 
                  ...formData.deliveryAddress, 
                  street: e.target.value 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter street address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.city}
              onChange={(e) => updateFormData({ 
                deliveryAddress: { 
                  ...formData.deliveryAddress, 
                  city: e.target.value 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter city"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Province *
            </label>
            <select
              value={formData.deliveryAddress.province}
              onChange={(e) => updateFormData({ 
                deliveryAddress: { 
                  ...formData.deliveryAddress, 
                  province: e.target.value 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select province</option>
              <option value="Gauteng">Gauteng</option>
              <option value="Western Cape">Western Cape</option>
              <option value="KwaZulu-Natal">KwaZulu-Natal</option>
              <option value="Eastern Cape">Eastern Cape</option>
              <option value="Free State">Free State</option>
              <option value="Limpopo">Limpopo</option>
              <option value="Mpumalanga">Mpumalanga</option>
              <option value="North West">North West</option>
              <option value="Northern Cape">Northern Cape</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code *
            </label>
            <input
              type="text"
              value={formData.deliveryAddress.postalCode}
              onChange={(e) => updateFormData({ 
                deliveryAddress: { 
                  ...formData.deliveryAddress, 
                  postalCode: e.target.value 
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter postal code"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={formData.expectedDeliveryDate ? 
                new Date(formData.expectedDeliveryDate).toISOString().split('T')[0] : 
                ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  updateFormData({ expectedDeliveryDate: new Date(e.target.value) });
                } else {
                  const { expectedDeliveryDate: _expectedDeliveryDate, ...rest } = formData;
                  setFormData(rest as FormData);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Line Items
        </h3>
        <VelocityButton
          variant="outline"
          size="sm"
          onClick={addItem}
          icon={<Plus className="h-4 w-4" />}
        >
          Add Item
        </VelocityButton>
      </div>
      
      {formData.items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No items added yet</p>
          <VelocityButton
            variant="outline"
            size="sm"
            onClick={addItem}
            className="mt-4"
            icon={<Plus className="h-4 w-4" />}
          >
            Add First Item
          </VelocityButton>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <GlassCard key={item.tempId} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-medium text-gray-900">Item #{index + 1}</h4>
                <button
                  onClick={() => removeItem(item.tempId)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.tempId, { description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter item description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={item.category || ''}
                    onChange={(e) => updateItem(item.tempId, { category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter category"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UOM
                  </label>
                  <select
                    value={item.uom}
                    onChange={(e) => updateItem(item.tempId, { uom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pieces">Pieces</option>
                    <option value="meters">Meters</option>
                    <option value="kg">Kilograms</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="lots">Lots</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.tempId, { quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (ZAR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.tempId, { unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Line Total
                  </label>
                  <input
                    type="text"
                    value={new Intl.NumberFormat('en-ZA', { 
                      style: 'currency', 
                      currency: 'ZAR' 
                    }).format(item.quantity * item.unitPrice)}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                  />
                </div>
              </div>
            </GlassCard>
          ))}
          
          <GlassCard className="p-4 bg-blue-50">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Order Summary
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (15%):</span>
                <span>{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                <span>Total:</span>
                <span>{new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(total)}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Notes & Review</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (visible to supplier)
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter any notes for the supplier"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Internal Notes (not visible to supplier)
          </label>
          <textarea
            value={formData.internalNotes || ''}
            onChange={(e) => updateFormData({ internalNotes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter internal notes"
          />
        </div>
      </div>
      
      <GlassCard className="p-6 bg-gray-50">
        <h4 className="text-lg font-semibold mb-4">Order Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p><span className="font-medium">Title:</span> {formData.title}</p>
            <p><span className="font-medium">Supplier:</span> {mockSuppliers.find(s => s.id === formData.supplierId)?.name}</p>
            <p><span className="font-medium">Order Type:</span> {formData.orderType}</p>
            <p><span className="font-medium">Payment Terms:</span> {formData.paymentTerms}</p>
          </div>
          <div>
            <p><span className="font-medium">Items:</span> {formData.items.length}</p>
            <p><span className="font-medium">Subtotal:</span> {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(subtotal)}</p>
            <p><span className="font-medium">VAT:</span> {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(taxAmount)}</p>
            <p className="text-lg font-semibold"><span>Total:</span> {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(total)}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Purchase Order</h2>
            <div className="flex items-center space-x-2 mt-2">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-0.5 ml-2 ${
                      step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
        
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div>
            {step > 1 && (
              <VelocityButton
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Previous
              </VelocityButton>
            )}
          </div>
          
          <div className="flex space-x-3">
            <VelocityButton
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </VelocityButton>
            
            {step < 3 ? (
              <VelocityButton
                onClick={() => setStep(step + 1)}
                disabled={loading}
              >
                Next
              </VelocityButton>
            ) : (
              <VelocityButton
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
              >
                Create Purchase Order
              </VelocityButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};