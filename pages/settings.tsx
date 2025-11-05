import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/AppLayout';
import { Settings2 } from 'lucide-react';

// Dynamic import of the Settings module with no SSR
const SettingsModule = dynamic(
  () => import('../src/pages/Settings').then(mod => ({ default: mod.Settings })),
  {
    loading: () => <SettingsSkeleton />,
    ssr: false
  }
);

function SettingsSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header Skeleton */}
      <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>

      {/* Tab Navigation Skeleton */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2 py-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        {/* Card 1 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Settings2 className="w-5 h-5 text-gray-400 mr-2" />
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsModule />
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
