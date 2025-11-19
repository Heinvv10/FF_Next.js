import { useState, useMemo } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Package,
  Plus,
  Filter,
  Eye,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Search,
  Truck,
  FileText,
  BarChart3,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '@/src/shared/components/ui/Button';
import type { ProcurementPortalContext } from '@/types/procurement/portal.types';

interface StockItemData {
  id: string;
  itemCode: string;
  description: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reservedStock: number;
  availableStock: number;
  averageCost: number;
  totalValue: number;
  currency: string;
  location: string;
  supplier: string;
  lastReceived?: Date;
  lastIssued?: Date;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'excess-stock';
  stockTurnover: number;
  leadTime: number;
  reorderPoint: number;
  abc_classification: 'A' | 'B' | 'C';
  movementHistory: {
    type: 'receipt' | 'issue' | 'transfer' | 'adjustment';
    quantity: number;
    date: Date;
    reference: string;
    location?: string;
  }[];
}

interface StockMovementData {
  id: string;
  type: 'asn' | 'grn' | 'issue' | 'transfer' | 'adjustment';
  reference: string;
  itemCode: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  fromLocation?: string;
  toLocation?: string;
  createdDate: Date;
  processedDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdBy: string;
  notes?: string;
}

export default function StockManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portalContext = useOutletContext<ProcurementPortalContext>();
  const { selectedProject, permissions } = portalContext || {};

  // State management
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'transfers'>('inventory');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('filter') || 'all');
  const [sortBy, setSortBy] = useState<string>('item-code');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock stock data - would be fetched from API
  const stockItems: StockItemData[] = [
    {
      id: 'STK-001',
      itemCode: 'FO-CABLE-SM-12C',
      description: 'Single Mode Fiber Optic Cable 12 Core',
      category: 'Fiber Optic Cables',
      unit: 'Meters',
      currentStock: 2500,
      minimumStock: 500,
      maximumStock: 5000,
      reservedStock: 300,
      availableStock: 2200,
      averageCost: 25.50,
      totalValue: 63750,
      currency: 'ZAR',
      location: 'Warehouse A - Section 1',
      supplier: 'Fiber Optics Solutions Ltd',
      lastReceived: new Date('2024-01-15'),
      lastIssued: new Date('2024-01-18'),
      status: 'in-stock',
      stockTurnover: 2.3,
      leadTime: 14,
      reorderPoint: 750,
      abc_classification: 'A',
      movementHistory: [
        { type: 'receipt', quantity: 1000, date: new Date('2024-01-15'), reference: 'GRN-2024-001' },
        { type: 'issue', quantity: 200, date: new Date('2024-01-18'), reference: 'ISS-2024-005' }
      ]
    },
    {
      id: 'STK-002',
      itemCode: 'SPLICE-ENCL-24',
      description: 'Splice Enclosure 24 Port',
      category: 'Network Equipment',
      unit: 'Each',
      currentStock: 15,
      minimumStock: 20,
      maximumStock: 100,
      reservedStock: 5,
      availableStock: 10,
      averageCost: 450,
      totalValue: 6750,
      currency: 'ZAR',
      location: 'Warehouse B - Section 3',
      supplier: 'Network Infrastructure Co',
      lastReceived: new Date('2024-01-10'),
      lastIssued: new Date('2024-01-16'),
      status: 'low-stock',
      stockTurnover: 1.8,
      leadTime: 21,
      reorderPoint: 30,
      abc_classification: 'B',
      movementHistory: [
        { type: 'receipt', quantity: 25, date: new Date('2024-01-10'), reference: 'GRN-2024-002' },
        { type: 'issue', quantity: 10, date: new Date('2024-01-16'), reference: 'ISS-2024-008' }
      ]
    },
    {
      id: 'STK-003',
      itemCode: 'DROP-CABLE-2C',
      description: 'Drop Cable 2 Core FTTH',
      category: 'Drop Cables',
      unit: 'Meters',
      currentStock: 0,
      minimumStock: 1000,
      maximumStock: 10000,
      reservedStock: 0,
      availableStock: 0,
      averageCost: 8.75,
      totalValue: 0,
      currency: 'ZAR',
      location: 'Warehouse A - Section 2',
      supplier: 'Premium Cables SA',
      lastIssued: new Date('2024-01-12'),
      status: 'out-of-stock',
      stockTurnover: 3.2,
      leadTime: 10,
      reorderPoint: 1500,
      abc_classification: 'A',
      movementHistory: [
        { type: 'issue', quantity: 800, date: new Date('2024-01-12'), reference: 'ISS-2024-003' }
      ]
    }
  ];

  // Mock stock movements
  const stockMovements: StockMovementData[] = [
    {
      id: 'MOV-001',
      type: 'asn',
      reference: 'ASN-2024-001',
      itemCode: 'FO-CABLE-SM-12C',
      itemDescription: 'Single Mode Fiber Optic Cable 12 Core',
      quantity: 2000,
      unit: 'Meters',
      toLocation: 'Warehouse A - Section 1',
      createdDate: new Date('2024-01-20'),
      status: 'pending',
      createdBy: 'System',
      notes: 'Expected delivery from Fiber Optics Solutions Ltd'
    },
    {
      id: 'MOV-002',
      type: 'grn',
      reference: 'GRN-2024-003',
      itemCode: 'SPLICE-ENCL-24',
      itemDescription: 'Splice Enclosure 24 Port',
      quantity: 50,
      unit: 'Each',
      toLocation: 'Warehouse B - Section 3',
      createdDate: new Date('2024-01-19'),
      processedDate: new Date('2024-01-19'),
      status: 'completed',
      createdBy: 'John Smith',
      notes: 'Received in good condition'
    },
    {
      id: 'MOV-003',
      type: 'transfer',
      reference: 'TRF-2024-001',
      itemCode: 'FO-CABLE-SM-12C',
      itemDescription: 'Single Mode Fiber Optic Cable 12 Core',
      quantity: 500,
      unit: 'Meters',
      fromLocation: 'Warehouse A - Section 1',
      toLocation: 'Site Store - Project Alpha',
      createdDate: new Date('2024-01-18'),
      status: 'in-progress',
      createdBy: 'Sarah Johnson'
    }
  ];

  // Filter and sort stock items
  const filteredItems = useMemo(() => {
    let filtered = stockItems;

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'low-stock') {
        filtered = filtered.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock');
      } else {
        filtered = filtered.filter(item => item.status === filterStatus);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'item-code':
          return a.itemCode.localeCompare(b.itemCode);
        case 'description':
          return a.description.localeCompare(b.description);
        case 'stock-level':
          return b.currentStock - a.currentStock;
        case 'value':
          return b.totalValue - a.totalValue;
        case 'last-received':
          if (!a.lastReceived || !b.lastReceived) return 0;
          return b.lastReceived.getTime() - a.lastReceived.getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [stockItems, filterStatus, sortBy, searchTerm]);

  // Calculate statistics
  const stats = {
    totalItems: stockItems.length,
    totalValue: stockItems.reduce((sum, item) => sum + item.totalValue, 0),
    lowStock: stockItems.filter(item => item.status === 'low-stock').length,
    outOfStock: stockItems.filter(item => item.status === 'out-of-stock').length,
    pendingMovements: stockMovements.filter(mov => mov.status === 'pending').length,
    avgTurnover: stockItems.reduce((sum, item) => sum + item.stockTurnover, 0) / stockItems.length
  };

  const getStatusBadge = (status: StockItemData['status']) => {
    const config = {
      'in-stock': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'low-stock': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      'out-of-stock': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'excess-stock': { color: 'bg-blue-100 text-blue-800', icon: Package }
    };

    const { color, icon: Icon } = config[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getMovementTypeBadge = (type: StockMovementData['type']) => {
    const config = {
      'asn': { color: 'bg-blue-100 text-blue-800', label: 'ASN', icon: Truck },
      'grn': { color: 'bg-green-100 text-green-800', label: 'GRN', icon: Package },
      'issue': { color: 'bg-purple-100 text-purple-800', label: 'Issue', icon: ArrowRight },
      'transfer': { color: 'bg-orange-100 text-orange-800', label: 'Transfer', icon: ArrowLeft },
      'adjustment': { color: 'bg-gray-100 text-gray-800', label: 'Adjustment', icon: FileText }
    };

    const { color, label, icon: Icon } = config[type];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>
    );
  };

  const handleStockAction = (_itemId: string, _action: 'issue' | 'receive' | 'adjust' | 'transfer') => {

  };

  const handleBulkAction = (_action: string) => {
    if (selectedItems.length === 0) return;

  };

  if (!selectedProject) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Project</h3>
          <p className="text-gray-500">Choose a project to view and manage stock inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track inventory, manage stock movements, and control project materials
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/app/procurement/stock/reports')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Stock Reports
          </Button>
          <Button
            onClick={() => navigate('/app/procurement/stock/receive')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Receive Stock
          </Button>
        </div>
      </div>

      {/* Stock Alerts */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Stock Level Alerts</h3>
              <p className="text-sm text-red-700 mt-1">
                {stats.outOfStock > 0 && `${stats.outOfStock} item${stats.outOfStock !== 1 ? 's' : ''} out of stock. `}
                {stats.lowStock > 0 && `${stats.lowStock} item${stats.lowStock !== 1 ? 's' : ''} below minimum level.`}
                {' '}Immediate action required to avoid production delays.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setFilterStatus('low-stock')}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              View Items
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Critical Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock + stats.outOfStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                R {stats.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Pending Movements</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingMovements}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'inventory', label: 'Inventory' },
              { key: 'movements', label: 'Movements' },
              { key: 'transfers', label: 'Transfers' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm w-64"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="in-stock">In Stock</option>
                      <option value="low-stock">Low/Out of Stock</option>
                      <option value="excess-stock">Excess Stock</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="item-code">Item Code</option>
                      <option value="description">Description</option>
                      <option value="stock-level">Stock Level</option>
                      <option value="value">Total Value</option>
                      <option value="last-received">Last Received</option>
                    </select>
                  </div>
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{selectedItems.length} selected</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('issue')}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Bulk Issue
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('transfer')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Bulk Transfer
                    </Button>
                  </div>
                )}
              </div>

              {/* Stock Items List */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="p-6 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, item.id]);
                              } else {
                                setSelectedItems(selectedItems.filter(id => id !== item.id));
                              }
                            }}
                            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{item.itemCode}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.abc_classification === 'A' ? 'bg-red-100 text-red-700' :
                                item.abc_classification === 'B' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                Class {item.abc_classification}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{item.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Tag className="h-4 w-4" />
                                {item.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {item.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="h-4 w-4" />
                                {item.supplier}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Current Stock</p>
                          <p className="font-semibold text-gray-900">
                            {item.currentStock.toLocaleString()} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Available</p>
                          <p className="font-semibold text-green-600">
                            {item.availableStock.toLocaleString()} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Reserved</p>
                          <p className="font-semibold text-orange-600">
                            {item.reservedStock.toLocaleString()} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Min Stock</p>
                          <p className="font-semibold text-gray-900">
                            {item.minimumStock.toLocaleString()} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Value</p>
                          <p className="font-semibold text-gray-900">
                            {item.currency} {item.totalValue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Turnover</p>
                          <p className="font-semibold text-blue-600">{item.stockTurnover}x</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {item.lastReceived && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Last received: {item.lastReceived.toLocaleDateString()}
                            </span>
                          )}
                          {item.lastIssued && (
                            <span className="flex items-center gap-1">
                              <ArrowRight className="h-4 w-4" />
                              Last issued: {item.lastIssued.toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/app/procurement/stock/${item.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          
                          {permissions?.canManageStock && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStockAction(item.id, 'issue')}
                              >
                                <ArrowRight className="h-4 w-4 mr-1" />
                                Issue
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStockAction(item.id, 'transfer')}
                              >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Transfer
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {filteredItems.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No stock items found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== 'all'
                      ? 'Try adjusting your search or filters.'
                      : 'Start by receiving stock from purchase orders.'
                    }
                  </p>
                  <Button
                    onClick={() => navigate('/app/procurement/stock/receive')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Receive First Item
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Movements Tab */}
          {activeTab === 'movements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Stock Movements</h3>
                <Button
                  variant="outline"
                  onClick={() => navigate('/app/procurement/stock/movements')}
                >
                  View All Movements
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {stockMovements.map((movement) => (
                    <div key={movement.id} className="p-6 bg-white hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{movement.reference}</h4>
                            {getMovementTypeBadge(movement.type)}
                          </div>
                          <p className="text-gray-700 mb-2">{movement.itemDescription}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{movement.itemCode}</span>
                            <span>{movement.quantity.toLocaleString()} {movement.unit}</span>
                            {movement.fromLocation && (
                              <span>From: {movement.fromLocation}</span>
                            )}
                            {movement.toLocation && (
                              <span>To: {movement.toLocation}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            movement.status === 'completed' ? 'bg-green-100 text-green-800' :
                            movement.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                            movement.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {movement.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {movement.createdBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {movement.createdDate.toLocaleDateString()}
                          </span>
                          {movement.processedDate && (
                            <span>Processed: {movement.processedDate.toLocaleDateString()}</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/app/procurement/stock/movements/${movement.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transfers Tab */}
          {activeTab === 'transfers' && (
            <div className="text-center py-12">
              <ArrowLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inter-Project Transfers</h3>
              <p className="text-gray-500 mb-6">
                Manage material transfers between projects and locations.
              </p>
              <Button
                onClick={() => navigate('/app/procurement/stock/transfers')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Manage Transfers
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}