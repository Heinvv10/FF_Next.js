import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ClientList = dynamic(
  () => import('../../src/modules/clients/components/ClientList').then(mod => mod.ClientList),
  {
    ssr: false,
    loading: () => <ClientsLoadingSkeleton />
  }
);

function ClientsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ClientsPage: NextPage = () => {
  return (
    <Suspense fallback={<ClientsLoadingSkeleton />}>
      <ClientList />
    </Suspense>
  );
};

// Use static generation for better performance
export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 60,
  };
};

export default ClientsPage;