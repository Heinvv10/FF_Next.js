/**
 * Version Checker Component
 * Checks for new deployments and prompts user to refresh
 */

'use client';

import { useEffect, useState } from 'react';

export function VersionChecker() {
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    // Get initial version from meta tag
    const metaVersion = document.querySelector('meta[name="build-version"]')?.getAttribute('content');
    setCurrentVersion(metaVersion);

    // Check for new version every 5 minutes
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/version', { cache: 'no-store' });
        const data = await response.json();

        if (data.version && currentVersion && data.version !== currentVersion) {
          setShowRefreshBanner(true);
          clearInterval(interval); // Stop checking once update detected
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.log('Version check failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentVersion]);

  if (!showRefreshBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">
            A new version of FibreFlow is available!
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
}
