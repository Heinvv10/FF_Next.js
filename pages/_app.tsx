import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { reportWebVitals } from '@/lib/performance';
import { initErrorTracking } from '@/lib/errorTracking';
import { VersionChecker } from '@/components/VersionChecker';

// Export for Next.js Web Vitals
export { reportWebVitals };

function MyApp({ Component, pageProps }: AppProps) {
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
    <ErrorBoundary>
      <VersionChecker />
      <AuthProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <Component {...pageProps} />
          </QueryClientProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;