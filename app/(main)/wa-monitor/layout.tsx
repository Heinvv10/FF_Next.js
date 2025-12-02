/**
 * WA Monitor Layout - Full Width (No Sidebar)
 * Custom layout for WA Monitor page that removes the sidebar
 */

'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const Header = dynamic(() => import('@/components/layout/Header').then(mod => ({ default: mod.Header })), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer').then(mod => ({ default: mod.Footer })), { ssr: false });

interface WaMonitorLayoutProps {
  children: ReactNode;
}

export default function WaMonitorLayout({ children }: WaMonitorLayoutProps) {
  const pathname = usePathname();
  const { currentUser, loading } = useAuth();

  // Show loading spinner while user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ff-background-primary)]">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-[var(--ff-text-secondary)]">Loading application...</p>
        </div>
      </div>
    );
  }

  const pageMeta = {
    title: 'WhatsApp Monitor',
    breadcrumbs: ['Home', 'QA', 'WhatsApp Monitor'],
  };

  return (
    <div className="flex h-screen bg-[var(--ff-background-secondary)] overflow-hidden">
      {/* Main Content - Full Width (No Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          title={pageMeta.title}
          breadcrumbs={pageMeta.breadcrumbs}
          onMenuClick={() => {}} // No-op since there's no sidebar
          user={currentUser}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[var(--ff-background-primary)]">
          <div className="min-h-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
