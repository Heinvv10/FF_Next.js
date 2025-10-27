/**
 * Contractor Detail Page - View individual contractor details
 * Dynamic route for /contractors/:id
 */

import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { AppLayout } from '../../../src/components/layout/AppLayout';

// Lazy load ContractorDetail component to reduce initial bundle size
const ContractorDetail = dynamic(
  () => import('../../../src/modules/contractors/components/ContractorDetail').then(mod => ({ default: mod.ContractorDetail })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false
  }
);

const ContractorDetailPage: NextPage = () => {
  return (
    <AppLayout>
      <ContractorDetail />
    </AppLayout>
  );
};

// Prevent static generation to avoid NextRouter mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default ContractorDetailPage;
