import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/AppLayout';
import { RefreshCw } from 'lucide-react';

// Dynamic import of the Ticketing Dashboard module with no SSR for performance
const TicketingDashboard = dynamic(
  () => import('../src/modules/ticketing/components/TicketingDashboard').then(mod => ({ default: mod.TicketingDashboard })),
  {
    loading: () => <TicketingSkeleton />,
    ssr: false
  }
);

function TicketingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-3 animate-pulse"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-24 py-4 animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-6 gap-4">
            {['Ticket ID', 'Title', 'Status', 'Priority', 'Source', 'Created'].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 grid grid-cols-6 gap-4">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center py-4">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-500">Loading tickets...</span>
      </div>
    </div>
  );
}

export default function TicketingPage() {
  return (
    <AppLayout>
      <Suspense fallback={<TicketingSkeleton />}>
        <TicketingDashboard />
      </Suspense>
    </AppLayout>
  );
}

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
