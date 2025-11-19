import { 
  Package, 
  FileText, 
  Send, 
  ShoppingCart, 
  Clock, 
  Truck,
  Quote,
  ClipboardList,
  TrendingUp,
  Users,
  ArrowRight,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useBOQs } from './hooks/useBOQ';
import { useRFQs } from './hooks/useRFQ';
import { BOQStatus, RFQStatus } from '@/types/procurement.types';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from '@/src/shared/components/ui/Button';
import type { 
  ProcurementPortalContext
} from '@/types/procurement/portal.types';
import type { LucideIcon } from 'lucide-react';
import { AllProjectsOverview } from './components/AllProjectsOverview';

// Local types for component
interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: string;
}

// Using ProcurementModuleCard directly since it now has all needed properties


export function ProcurementOverview() {
  const navigate = useNavigate();
  const portalContext = useOutletContext<ProcurementPortalContext>();
  const { selectedProject, viewMode, aggregateMetrics, projectSummaries, permissions } = portalContext || {};
  
  const { data: boqs } = useBOQs();
  const { data: rfqs } = useRFQs();

  // Calculate statistics
  const stats = {
    boq: {
      total: boqs?.length || 0,
      draft: boqs?.filter(b => b.status === BOQStatus.DRAFT).length || 0,
      approved: boqs?.filter(b => b.status === BOQStatus.APPROVED).length || 0,
      totalValue: boqs?.reduce((sum, b) => sum + (b.totalEstimatedValue || 0), 0) || 0,
    },
    rfq: {
      total: rfqs?.length || 0,
      sent: rfqs?.filter(r => r.status === RFQStatus.ISSUED).length || 0,
      responsesReceived: rfqs?.filter(r => r.status === RFQStatus.RESPONSES_RECEIVED).length || 0,
      awarded: rfqs?.filter(r => r.status === RFQStatus.AWARDED).length || 0,
    },
  };

  // Define 7 procurement module cards as per PRD
  const moduleCards = [
    {
      id: 'boq',
      title: 'BOQ Management',
      description: 'Excel import, catalog mapping, and demand management',
      icon: FileText,
      color: 'bg-blue-500',
      href: '/app/procurement/boq',
      targetTab: 'boq',
      permission: 'buyer',
      metrics: [
        { label: 'Total BOQs', value: stats.boq.total, format: 'number' },
        { label: 'Draft', value: stats.boq.draft, format: 'number', status: 'warning' },
        { label: 'Approved', value: stats.boq.approved, format: 'number', status: 'success' },
        { label: 'Total Value', value: stats.boq.totalValue, format: 'currency' }
      ],
      quickActions: [
        { label: 'Import Excel', icon: FileText, onClick: () => navigate('/app/procurement/boq/import') },
        { label: 'Create BOQ', icon: FileText, onClick: () => navigate('/app/procurement/boq/new') }
      ]
    },
    {
      id: 'rfq',
      title: 'RFQ Management',
      description: 'Multi-supplier invitations, Q&A, and deadline tracking',
      icon: Send,
      color: 'bg-green-500',
      href: '/app/procurement/rfq',
      targetTab: 'rfq',
      permission: 'buyer',
      metrics: [
        { label: 'Active RFQs', value: stats.rfq.sent, format: 'number', status: 'info' },
        { label: 'Responses', value: stats.rfq.responsesReceived, format: 'number' },
        { label: 'Awarded', value: stats.rfq.awarded, format: 'number', status: 'success' },
        { label: 'Pending', value: stats.rfq.total - stats.rfq.awarded, format: 'number', status: 'warning' }
      ],
      quickActions: [
        { label: 'New RFQ', icon: Send, onClick: () => navigate('/app/procurement/rfq/new') },
        { label: 'Review Responses', icon: Activity, onClick: () => navigate('/app/procurement/rfq/responses') }
      ]
    },
    {
      id: 'quotes',
      title: 'Quote Evaluation',
      description: 'Compare prices, technical approval, and split awards',
      icon: Quote,
      color: 'bg-purple-500',
      href: '/app/procurement/quotes',
      targetTab: 'quotes',
      permission: 'buyer',
      metrics: [
        { label: 'Received', value: 15, format: 'number' },
        { label: 'Under Review', value: 8, format: 'number', status: 'warning' },
        { label: 'Approved', value: 5, format: 'number', status: 'success' },
        { label: 'Avg Savings', value: 12.5, format: 'percentage', status: 'success' }
      ],
      quickActions: [
        { label: 'Compare Quotes', icon: TrendingUp, onClick: () => navigate('/app/procurement/quotes/compare') },
        { label: 'Award Split', icon: CheckCircle, onClick: () => navigate('/app/procurement/quotes/award') }
      ]
    },
    {
      id: 'purchase-orders',
      title: 'Purchase Orders',
      description: 'PO generation, budget checks, and approval workflows',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      href: '/app/procurement/orders',
      targetTab: 'purchase-orders',
      permission: 'buyer',
      metrics: [
        { label: 'Active POs', value: 24, format: 'number' },
        { label: 'Pending Approval', value: 6, format: 'number', status: 'warning' },
        { label: 'This Month', value: 450000, format: 'currency' },
        { label: 'Budget Used', value: 67, format: 'percentage', status: 'info' }
      ],
      quickActions: [
        { label: 'Create PO', icon: ShoppingCart, onClick: () => navigate('/app/procurement/orders/new') },
        { label: 'Approve Pending', icon: CheckCircle, onClick: () => navigate('/app/procurement/orders/approve') }
      ]
    },
    {
      id: 'stock',
      title: 'Stock Management',
      description: 'ASN, GRN, cable tracking, and inter-project transfers',
      icon: Package,
      color: 'bg-indigo-500',
      href: '/app/procurement/stock',
      targetTab: 'stock',
      permission: 'store-controller',
      metrics: [
        { label: 'Total Items', value: 1250, format: 'number' },
        { label: 'Low Stock', value: 15, format: 'number', status: 'error' },
        { label: 'Cable Drums', value: 45, format: 'number' },
        { label: 'Pending GRN', value: 8, format: 'number', status: 'warning' }
      ],
      quickActions: [
        { label: 'Receive Stock', icon: Package, onClick: () => navigate('/app/procurement/stock/receive') },
        { label: 'Transfer Items', icon: ArrowRight, onClick: () => navigate('/app/procurement/stock/transfer') }
      ]
    },
    {
      id: 'suppliers',
      title: 'Supplier Portal',
      description: 'Invitations, access control, and performance tracking',
      icon: Truck,
      color: 'bg-teal-500',
      href: '/app/procurement/suppliers',
      targetTab: 'suppliers',
      permission: 'buyer',
      metrics: [
        { label: 'Active Suppliers', value: 28, format: 'number' },
        { label: 'OTIF Score', value: 92, format: 'percentage', status: 'success' },
        { label: 'New This Month', value: 3, format: 'number', status: 'info' },
        { label: 'Performance Issues', value: 2, format: 'number', status: 'warning' }
      ],
      quickActions: [
        { label: 'Invite Supplier', icon: Users, onClick: () => navigate('/app/procurement/suppliers/invite') },
        { label: 'Performance Report', icon: TrendingUp, onClick: () => navigate('/app/procurement/suppliers/performance') }
      ]
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'Project reports, savings analysis, and cycle time metrics',
      icon: ClipboardList,
      color: 'bg-pink-500',
      href: '/app/procurement/reports',
      targetTab: 'reports',
      permission: 'viewer',
      metrics: [
        { label: 'Reports Generated', value: 42, format: 'number' },
        { label: 'Cost Savings', value: 125000, format: 'currency', status: 'success' },
        { label: 'Cycle Time', value: 14.5, format: 'number', status: 'info' },
        { label: 'Budget Variance', value: -3.2, format: 'percentage', status: 'success' }
      ],
      quickActions: [
        { label: 'Generate Report', icon: ClipboardList, onClick: () => navigate('/app/procurement/reports/generate') },
        { label: 'Analytics Dashboard', icon: TrendingUp, onClick: () => navigate('/app/procurement/reports/analytics') }
      ]
    }
  ];

  // Filter cards based on permissions and project
  const availableCards = moduleCards.filter(card => {
    if (card.permission && !permissions) return false;
    // Simplified permission check - would integrate with real RBAC
    return true;
  });

  // Conditional rendering based on view mode
  if (viewMode === 'all') {
    return <AllProjectsOverview 
      aggregateMetrics={aggregateMetrics}
      projectSummaries={projectSummaries}
      navigate={navigate}
    />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Procurement Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage inventory, quotes, and purchase orders
        </p>
      </div>

      {/* Project Selection Notice */}
      {!selectedProject && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Select a Project</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Choose a project from the dropdown above to access procurement modules and view project-specific data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {availableCards.map((card) => {
          const Icon = card.icon;
          const isDisabled = !selectedProject;
          
          return (
            <div
              key={card.id}
              className={`
                bg-white rounded-lg border border-gray-200 overflow-hidden
                transition-all duration-200 hover:shadow-lg
                ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}
              `}
              onClick={() => !isDisabled && navigate(`/app/procurement/${card.id}`)}
            >
              {/* Card Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex p-3 rounded-lg ${card.color} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) navigate(`/app/procurement/${card.id}`);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isDisabled}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{card.description}</p>
              </div>

              {/* Metrics Grid */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  {card.metrics.map((metric, index) => (
                    <div key={index} className="text-center">
                      <div className={`text-lg font-bold ${
                        metric.status === 'success' ? 'text-green-600' :
                        metric.status === 'warning' ? 'text-yellow-600' :
                        metric.status === 'error' ? 'text-red-600' :
                        metric.status === 'info' ? 'text-blue-600' :
                        'text-gray-900'
                      }`}>
                        {metric.format === 'currency' && 'R '}
                        {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                        {metric.format === 'percentage' && '%'}
                      </div>
                      <div className="text-xs text-gray-500">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex gap-2">
                  {card.quickActions.slice(0, 2).map((action: QuickAction, index: number) => {
                    const ActionIcon = action.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDisabled) action.onClick();
                        }}
                        disabled={isDisabled}
                        className="flex-1 text-xs"
                      >
                        <ActionIcon className="h-3 w-3 mr-1" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project KPI Summary - Only show when project selected */}
      {selectedProject && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h2>
              <p className="text-sm text-gray-500">{selectedProject.code} - Project KPI Summary</p>
            </div>
            <Button
              onClick={() => navigate('/app/procurement/reports')}
              variant="outline"
              size="sm"
            >
              Full Report
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                R {stats.boq.totalValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total BOQ Value</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">12.5%</div>
              <div className="text-sm text-gray-600">Cost Savings</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">14.5</div>
              <div className="text-sm text-gray-600">Avg Cycle Days</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">92%</div>
              <div className="text-sm text-gray-600">Supplier OTIF</div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts & Notifications - Only show when project selected */}
      {selectedProject && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts & Notifications</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Critical Stock Alert</p>
                <p className="text-sm text-red-700">5 items below minimum stock level - Production may be affected</p>
              </div>
              <Button
                onClick={() => navigate('/app/procurement/stock?filter=low-stock')}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                View Stock
              </Button>
            </div>
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">RFQ Responses Overdue</p>
                <p className="text-sm text-yellow-700">3 RFQs past deadline - Contact suppliers immediately</p>
              </div>
              <Button
                onClick={() => navigate('/app/procurement/rfq?filter=overdue')}
                variant="outline"
                size="sm"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Review RFQs
              </Button>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Savings Achievement</p>
                <p className="text-sm text-green-700">12.5% cost reduction achieved vs budget - R125,000 saved</p>
              </div>
              <Button
                onClick={() => navigate('/app/procurement/reports?view=savings')}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                View Report
              </Button>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Approval Required</p>
                <p className="text-sm text-blue-700">6 Purchase Orders waiting for approval (Total: R45,000)</p>
              </div>
              <Button
                onClick={() => navigate('/app/procurement/orders?filter=pending-approval')}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity - Only show when project selected */}
      {selectedProject && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Button
              onClick={() => navigate('/app/procurement/reports?view=activity')}
              variant="outline"
              size="sm"
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {boqs?.slice(0, 2).map((boq) => (
              <div
                key={boq.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => navigate(`/app/procurement/boq/${boq.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{boq.title}</p>
                    <p className="text-xs text-gray-500">BOQ {boq.version} - Updated 2 hours ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    R {boq.totalEstimatedValue?.toLocaleString() || '0'}
                  </span>
                  <div className="text-xs text-gray-500">Total Value</div>
                </div>
              </div>
            ))}
            {rfqs?.slice(0, 2).map((rfq) => (
              <div
                key={rfq.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => navigate(`/app/procurement/rfq/${rfq.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Send className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rfq.title}</p>
                    <p className="text-xs text-gray-500">RFQ {rfq.rfqNumber} - Sent 1 day ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {rfq.invitedSuppliers?.length || 0} suppliers
                  </span>
                  <div className="text-xs text-gray-500">Invited</div>
                </div>
              </div>
            ))}
            
            {/* Mock additional activities */}
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">PO-2024-045 Created</p>
                  <p className="text-xs text-gray-500">Fiber Optic Cables - Pending approval</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">R 25,000</span>
                <div className="text-xs text-gray-500">Amount</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Package className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Stock Received</p>
                  <p className="text-xs text-gray-500">GRN-2024-123 - 500m Cable Drum</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-green-600 font-medium">Completed</span>
                <div className="text-xs text-gray-500">Status</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Getting Started Guide - Show when no project selected */}
      {!selectedProject && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started with Procurement Portal</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium text-gray-900">Select a Project</p>
                <p className="text-sm text-gray-600">Choose a project from the dropdown above to access procurement modules.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium text-gray-900">Import BOQ</p>
                <p className="text-sm text-gray-600">Upload your Excel BOQ file to start the procurement process with catalog mapping.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium text-gray-900">Create RFQ</p>
                <p className="text-sm text-gray-600">Generate RFQs from approved BOQ items and invite suppliers to quote.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <p className="font-medium text-gray-900">Evaluate & Award</p>
                <p className="text-sm text-gray-600">Compare supplier quotes, perform technical evaluation, and award contracts.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">5</div>
              <div>
                <p className="font-medium text-gray-900">Manage Stock</p>
                <p className="text-sm text-gray-600">Process deliveries, track cable drums, and manage inter-project transfers.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}