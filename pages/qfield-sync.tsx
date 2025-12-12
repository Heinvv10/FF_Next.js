/**
 * QField Sync Page
 * Standalone page for QFieldCloud to FibreFlow synchronization
 */

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { QFieldSyncDashboard } from '@/modules/qfield-sync/components';
import { QFieldSyncErrorBoundary } from '@/modules/qfield-sync/components/ErrorBoundary';

export default function QFieldSyncPage() {
  return (
    <AppLayout>
      <QFieldSyncErrorBoundary>
        <QFieldSyncDashboard />
      </QFieldSyncErrorBoundary>
    </AppLayout>
  );
}

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};