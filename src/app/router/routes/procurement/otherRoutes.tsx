import { Suspense, lazy } from 'react';
import { Loading } from '../../components';
// Real component imports - replacing placeholders with actual implementations
const QuoteEvaluationPage = lazy(() => 
  import('@/modules/procurement/quotes/QuoteEvaluationPage').then(m => ({ default: m.default }))
);

const PurchaseOrdersPage = lazy(() => 
  import('@/modules/procurement/orders/PurchaseOrdersPage').then(m => ({ default: m.default }))
);

const SupplierPortalPage = lazy(() => 
  import('@/modules/procurement/suppliers/SupplierPortalPage').then(m => ({ default: m.default }))
);

// Legacy imports for backward compatibility (only importing what's actually used)
import {
  QuoteComparison,
  EvaluationMatrix,
  AwardProcess,
  QuoteHistory,
  PurchaseOrderCreate,
  PurchaseOrderEdit,
  PurchaseOrderView,
  PurchaseOrderList,
  SupplierPortalDashboard,
  SuppliersPage,
  ProcurementReporting,
  ProcurementKPIDashboard,
  CostAnalysis,
  SupplierPerformance,
  ComplianceReports
} from '../../lazyImports';

// Import the real ReportsAnalyticsPage component
const ReportsAnalyticsPage = lazy(() => 
  import('@/modules/procurement/reports/ReportsAnalyticsPage').then(m => ({ default: m.default }))
);

// New unified tab routes
export const quoteEvaluationRoutes = {
  path: 'quotes',
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<Loading />}>
          <QuoteEvaluationPage />
        </Suspense>
      ),
    },
    {
      path: 'compare',
      element: (
        <Suspense fallback={<Loading />}>
          <QuoteComparison />
        </Suspense>
      ),
    },
    {
      path: 'award',
      element: (
        <Suspense fallback={<Loading />}>
          <AwardProcess />
        </Suspense>
      ),
    },
    {
      path: 'evaluation/:id',
      element: (
        <Suspense fallback={<Loading />}>
          <EvaluationMatrix />
        </Suspense>
      ),
    },
    {
      path: 'history',
      element: (
        <Suspense fallback={<Loading />}>
          <QuoteHistory />
        </Suspense>
      ),
    },
  ],
};

export const purchaseOrderRoutes = {
  path: 'orders',
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<Loading />}>
          <PurchaseOrdersPage />
        </Suspense>
      ),
    },
    {
      path: 'new',
      element: (
        <Suspense fallback={<Loading />}>
          <PurchaseOrderCreate />
        </Suspense>
      ),
    },
    {
      path: 'import',
      element: (
        <Suspense fallback={<Loading />}>
          <PurchaseOrderList />
        </Suspense>
      ),
    },
    {
      path: ':id',
      element: (
        <Suspense fallback={<Loading />}>
          <PurchaseOrderView />
        </Suspense>
      ),
    },
    {
      path: ':id/edit',
      element: (
        <Suspense fallback={<Loading />}>
          <PurchaseOrderEdit />
        </Suspense>
      ),
    },
  ],
};

export const supplierPortalRoutes = {
  path: 'suppliers',
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<Loading />}>
          <SupplierPortalPage />
        </Suspense>
      ),
    },
    {
      path: 'invite',
      element: (
        <Suspense fallback={<Loading />}>
          <SupplierPortalDashboard />
        </Suspense>
      ),
    },
    {
      path: 'performance',
      element: (
        <Suspense fallback={<Loading />}>
          <SupplierPerformance />
        </Suspense>
      ),
    },
    {
      path: 'manage',
      element: (
        <Suspense fallback={<Loading />}>
          <SuppliersPage />
        </Suspense>
      ),
    },
  ],
};

export const reportingRoutes = {
  path: 'reports',
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<Loading />}>
          <ReportsAnalyticsPage />
        </Suspense>
      ),
    },
    {
      path: 'generate',
      element: (
        <Suspense fallback={<Loading />}>
          <ProcurementReporting />
        </Suspense>
      ),
    },
    {
      path: 'analytics',
      element: (
        <Suspense fallback={<Loading />}>
          <ProcurementKPIDashboard />
        </Suspense>
      ),
    },
    {
      path: 'cost-analysis',
      element: (
        <Suspense fallback={<Loading />}>
          <CostAnalysis />
        </Suspense>
      ),
    },
    {
      path: 'savings',
      element: (
        <Suspense fallback={<Loading />}>
          <CostAnalysis />
        </Suspense>
      ),
    },
    {
      path: 'activity',
      element: (
        <Suspense fallback={<Loading />}>
          <ProcurementReporting />
        </Suspense>
      ),
    },
    {
      path: 'compliance',
      element: (
        <Suspense fallback={<Loading />}>
          <ComplianceReports />
        </Suspense>
      ),
    },
  ],
};