/**
 * Contractors Page - Main contractors management interface
 * Uses the refactored ContractorsDashboard component
 */

import { AppLayout } from '../src/components/layout/AppLayout';
import { ContractorsDashboard } from '../src/modules/contractors/ContractorsDashboard';

export default function Contractors() {
  return (
    <AppLayout>
      <ContractorsDashboard />
    </AppLayout>
  );
}

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};