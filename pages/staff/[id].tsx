import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/AppLayout';

// Lazy load StaffDetail component to reduce initial bundle size
const StaffDetail = dynamic(
  () => import('../../src/modules/staff/components/StaffDetail').then(mod => ({ default: mod.StaffDetail })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false
  }
);

const StaffDetailPage: NextPage = () => {
  return (
    <AppLayout>
      <StaffDetail />
    </AppLayout>
  );
};

// Prevent static generation to avoid NextRouter mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default StaffDetailPage;