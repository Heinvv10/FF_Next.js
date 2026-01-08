/**
 * Providers for App Router
 * Wraps the app with necessary context providers
 */

'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { initErrorTracking } from '@/lib/errorTracking';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 2,
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  // Initialize error tracking on mount
  useEffect(() => {
    initErrorTracking({
      enabled: process.env.NODE_ENV === 'production',
      sampleRate: 1.0, // Track 100% of errors
    });
  }, []);

  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'shadow-lg',
        },
      }}
    >
      <ErrorBoundary>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </ClerkProvider>
  );
}
