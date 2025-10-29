import { AppLayout } from '@/components/layout/AppLayout';
import MigrationStatus from '@/pages/MigrationStatus';

export default function MigrationStatusPage() {
  return (
    <AppLayout>
      <MigrationStatus />
    </AppLayout>
  );
}

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
