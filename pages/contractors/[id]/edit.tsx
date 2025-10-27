/**
 * Contractor Edit Page - Edit existing contractor
 * Dynamic route for /contractors/:id/edit
 */

import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { AppLayout } from '../../../src/components/layout/AppLayout';

// Lazy load ContractorEdit component with SSR disabled to avoid router errors
const ContractorEdit = dynamic(
  () => import('../../../src/modules/contractors/components/ContractorEdit').then(mod => ({ default: mod.ContractorEdit })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false
  }
);

const ContractorEditPage: NextPage = () => {
  return (
    <AppLayout>
      <ContractorEdit />
    </AppLayout>
  );
};

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default ContractorEditPage;
