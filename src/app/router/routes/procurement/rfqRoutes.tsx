import { Suspense } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { Loading } from '../../components';
import {
  RFQDashboard,
  RFQCreate,
  RFQEdit,
  RFQView,
  RFQList,
  RFQBuilder,
  RFQDistribution,
  RFQTracking,
  RFQArchive,
} from '../../lazyImports';

// Route wrapper component that extracts parameters and provides props
function RFQDashboardRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = useOutletContext<{ selectedProject?: { id: string } }>();
  
  const projectId = context?.selectedProject?.id || 'default';
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = (searchParams.get('status') as 'all' | 'draft' | 'sent' | 'responded' | 'closed') || 'all';
  
  const handleCreateRFQ = () => {
    navigate('/procurement/rfq/create');
  };
  
  return (
    <RFQDashboard
      projectId={projectId}
      searchTerm={searchTerm}
      statusFilter={statusFilter}
      onCreateRFQ={handleCreateRFQ}
    />
  );
}

export const rfqRoutes = {
  path: 'rfq',
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<Loading />}>
          <RFQDashboardRoute />
        </Suspense>
      ),
    },
    {
      path: 'list',
      element: (
        <Suspense fallback={<Loading />}>
          <RFQList />
        </Suspense>
      ),
    },
    {
      path: 'create',
      element: (
        <Suspense fallback={<Loading />}>
          <RFQCreate />
        </Suspense>
      ),
    },
    {
      path: ':id/edit',
      element: (
        <Suspense fallback={<Loading />}>
          <RFQEdit />
        </Suspense>
      ),
    },
    {
      path: ':id/view',
      element: (
        <Suspense fallback={<Loading />}>
          <RFQView />
        </Suspense>
      ),
    },
    {
      path: 'builder',
      element: (
        <Suspense fallback={<Loading />}>
          <RFQBuilder />
        </Suspense>
      ),
    },
    {
      path: 'distribution',
      element: (
        <Suspense fallback={<Loading />}>
          <RFQDistribution />
        </Suspense>
      ),
    },
    {
      path: 'tracking',
      element: (
        <Suspense fallback={<Loading />}>
          <RFQTracking />
        </Suspense>
      ),
    },
    {
      path: 'archive',
      element: (
        <Suspense fallback={<Loading />}>
          <RFQArchive />
        </Suspense>
      ),
    },
  ],
};