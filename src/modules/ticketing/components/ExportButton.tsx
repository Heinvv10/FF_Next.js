// src/modules/ticketing/components/ExportButton.tsx
// Export ticket data to CSV, Excel, or PDF formats
'use client';

import React, { useState } from 'react';

type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ExportButtonProps {
  ticketIds?: string[];
  filters?: Record<string, any>;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export function ExportButton({
  ticketIds,
  filters,
  label = 'Export',
  size = 'md',
  variant = 'primary',
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentExport, setCurrentExport] = useState<ExportFormat | null>(null);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50',
  };

  async function handleExport(format: ExportFormat) {
    try {
      setLoading(true);
      setCurrentExport(format);
      setShowMenu(false);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('format', format);

      if (ticketIds && ticketIds.length > 0) {
        params.append('ticket_ids', ticketIds.join(','));
      }

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      // Call export API
      const res = await fetch(`/api/ticketing/export?${params.toString()}`, {
        method: 'GET',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Export failed');
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `tickets_export_${new Date().getTime()}.${format}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      const count = ticketIds?.length || 'all';
      alert(`Successfully exported ${count} ticket(s) as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export tickets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setCurrentExport(null);
    }
  }

  return (
    <div className="relative inline-block">
      {/* Main Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className={`rounded-lg font-medium transition flex items-center space-x-2 ${sizeClasses[size]} ${variantClasses[variant]} ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <span>Exporting {currentExport?.toUpperCase()}...</span>
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{label}</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Export Format Menu */}
      {showMenu && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <p className="text-xs font-semibold text-gray-500 px-2 py-1 mb-1">
              Select Format
            </p>

            {/* CSV Export */}
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
            >
              <span className="text-lg">📄</span>
              <div>
                <p className="font-medium text-gray-900">CSV</p>
                <p className="text-xs text-gray-500">Comma-separated values</p>
              </div>
            </button>

            {/* Excel Export */}
            <button
              onClick={() => handleExport('excel')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
            >
              <span className="text-lg">📊</span>
              <div>
                <p className="font-medium text-gray-900">Excel</p>
                <p className="text-xs text-gray-500">Microsoft Excel format</p>
              </div>
            </button>

            {/* PDF Export */}
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center space-x-2"
            >
              <span className="text-lg">📑</span>
              <div>
                <p className="font-medium text-gray-900">PDF</p>
                <p className="text-xs text-gray-500">Portable document format</p>
              </div>
            </button>
          </div>

          {/* Export Info */}
          <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600">
              {ticketIds && ticketIds.length > 0
                ? `Exporting ${ticketIds.length} selected ticket(s)`
                : 'Exporting all filtered tickets'}
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
