'use client';

import { useRouter } from 'next/router';
import { Plus, Upload, Download } from 'lucide-react';

interface ClientListHeaderProps {
  onImport: () => void;
  onExport: () => void;
  clientCount: number;
}

export function ClientListHeader({ onImport, onExport, clientCount }: ClientListHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Client Management</h1>
        <p className="text-gray-600 mt-1">Manage your client relationships and information</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onImport}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import
        </button>
        <button
          onClick={onExport}
          disabled={clientCount === 0}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
        <button
          onClick={() => router.push('/clients/new')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </button>
      </div>
    </div>
  );
}