import { AppLayout } from '@/components/layout/AppLayout';
import WorkflowPortalPage from '@/modules/workflow/WorkflowPortalPage';

export default function WorkflowPortal() {
  return (
    <AppLayout>
      <WorkflowPortalPage />
    </AppLayout>
  );
}

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
