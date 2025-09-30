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

// Use client-side rendering to avoid SSR/ISR issues
// This allows the page to work properly with dynamic content and tabs
export async function getServerSideProps() {
  return {
    props: {}, // Empty props for client-side rendering
  };
}
