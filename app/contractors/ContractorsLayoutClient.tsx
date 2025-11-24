/**
 * Contractors Layout Client Component - App Router Compatible
 * Wraps contractor pages with sidebar navigation
 */

'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import dynamic from 'next/dynamic';

// Dynamically import layout components
const Sidebar = dynamic(() => import('@/components/layout/SidebarAppRouter').then(mod => ({ default: mod.SidebarAppRouter })), { ssr: false });
const Header = dynamic(() => import('@/components/layout/Header').then(mod => ({ default: mod.Header })), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer').then(mod => ({ default: mod.Footer })), { ssr: false });

interface PageMeta {
  title: string;
  breadcrumbs?: string[];
}

interface ContractorsLayoutClientProps {
  children: ReactNode;
}

export function ContractorsLayoutClient({ children }: ContractorsLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load sidebar state from localStorage (only on client)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fibreflow-sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const pathname = usePathname();
  const { currentUser, loading } = useAuth();

  // Save sidebar state to localStorage (only on client)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fibreflow-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Get page metadata based on current route
  const getPageMeta = (): PageMeta => {
    if (!pathname) {
      return {
        title: 'Contractors',
        breadcrumbs: ['Home', 'Contractors'],
      };
    }

    // Contractor detail pages
    if (pathname.includes('/contractors/') && pathname.includes('/onboarding')) {
      return {
        title: 'Contractor Onboarding',
        breadcrumbs: ['Home', 'Contractors', 'Onboarding'],
      };
    }

    if (pathname.includes('/contractors/') && pathname.includes('/edit')) {
      return {
        title: 'Edit Contractor',
        breadcrumbs: ['Home', 'Contractors', 'Edit'],
      };
    }

    if (pathname.includes('/contractors/new')) {
      return {
        title: 'New Contractor',
        breadcrumbs: ['Home', 'Contractors', 'New'],
      };
    }

    if (pathname.includes('/contractors/rag-dashboard')) {
      return {
        title: 'RAG Dashboard',
        breadcrumbs: ['Home', 'Contractors', 'RAG Dashboard'],
      };
    }

    // Check if it's a contractor detail page (e.g., /contractors/[id])
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 2 && segments[0] === 'contractors') {
      return {
        title: 'Contractor Details',
        breadcrumbs: ['Home', 'Contractors', 'Details'],
      };
    }

    // Default contractors list
    return {
      title: 'Contractors',
      breadcrumbs: ['Home', 'Contractors'],
    };
  };

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

  const pageMeta = getPageMeta();

  return (
    <div className="flex h-screen bg-[var(--ff-background-secondary)] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-[var(--ff-surface-overlay)] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`
        flex-1 flex flex-col min-w-0 transition-all duration-300
        ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}>
        {/* Header */}
        <Header
          title={pageMeta.title}
          breadcrumbs={pageMeta.breadcrumbs || ['Home', 'Contractors']}
          actions={undefined}
          onMenuClick={() => setSidebarOpen(true)}
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
