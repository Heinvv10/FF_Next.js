import { Suspense } from 'react';
import { useParams, useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { Loading } from '../../components';
import { log } from '@/lib/logger';
import {
  BOQDashboard,
  BOQCreate,
  BOQEdit,
  BOQView,
  BOQList,
  BOQUpload,
  BOQMappingReview,
  BOQViewer,
  BOQHistory,
} from '../../lazyImports';

// Route wrapper components that extract parameters and provide props
function BOQDashboardRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = useOutletContext<{ selectedProject?: { id: string } }>();
  
  const projectId = context?.selectedProject?.id || 'default';
  const searchTerm = searchParams.get('search') || '';
  
  const handleEdit = (boqId: string) => {
    navigate(`/procurement/boq/${boqId}/edit`);
  };
  
  const handleCreate = () => {
    navigate('/procurement/boq/create');
  };
  
  return (
    <BOQDashboard
      projectId={projectId}
      searchTerm={searchTerm}
      onEdit={handleEdit}
      onCreate={handleCreate}
    />
  );
}

function BOQCreateRoute() {
  const navigate = useNavigate();
  const context = useOutletContext<{ selectedProject?: { id: string } }>();
  
  const projectId = context?.selectedProject?.id || 'default';
  
  const handleSave = async (_boqData: any) => {
    // TODO: Implement save logic
    log.warn('BOQ save not implemented yet', undefined, 'boqRoutes');
  };
  
  const handleCancel = () => {
    navigate('/procurement/boq');
  };
  
  return (
    <BOQCreate
      projectId={projectId}
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={false}
    />
  );
}

function BOQEditRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const context = useOutletContext<{ selectedProject?: { id: string } }>();
  
  const boqId = id || '';
  const projectId = context?.selectedProject?.id || 'default';
  
  const handleSave = async (_boqData: any) => {
    // TODO: Implement save logic
    log.warn('BOQ save not implemented yet', undefined, 'boqRoutes');
  };
  
  const handleCancel = () => {
    navigate('/procurement/boq');
  };
  
  return (
    <BOQEdit
      boqId={boqId}
      projectId={projectId}
      onSave={handleSave}
      onCancel={handleCancel}
      isLoading={false}
    />
  );
}

// Export component functions for use in route configuration
export { BOQDashboardRoute, BOQCreateRoute, BOQEditRoute };