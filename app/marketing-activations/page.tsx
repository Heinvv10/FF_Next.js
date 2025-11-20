'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';

interface MarketingStats {
  total: number;
  valid: number;
  invalid: number;
}

interface MarketingSubmission {
  dropNumber: string;
  submittedAt: string;
  submittedBy: string;
  userName: string;
  isValid: boolean;
  validationMessage: string;
}

interface MarketingData {
  date: string;
  stats: MarketingStats;
  submissions: MarketingSubmission[];
}

export default function MarketingActivationsPage() {
  const [data, setData] = useState<MarketingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketing-activations?date=${selectedDate}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data || !data.submissions) return;

    const headers = ['Drop Number', 'Submitted At', 'Submitted By', 'User Name', 'Valid', 'Message'];
    const rows = data.submissions.map(sub => [
      sub.dropNumber,
      new Date(sub.submittedAt).toLocaleString(),
      sub.submittedBy,
      sub.userName || '-',
      sub.isValid ? 'Yes' : 'No',
      sub.validationMessage
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-activations-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Marketing Activations
          </h1>
          <p className="text-gray-600">
            Track drop number submissions from marketing team
          </p>
        </div>

        {/* Date Selector & Export */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={exportToCSV}
            disabled={!data || data.submissions.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Export to CSV
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading...</div>
          </div>
        )}

        {/* Stats Cards */}
        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Total Submissions
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {data.stats.total}
                </div>
              </div>

              {/* Valid */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Valid Drops
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {data.stats.valid}
                </div>
              </div>

              {/* Invalid */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Invalid Drops
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {data.stats.invalid}
                </div>
              </div>
            </div>

            {/* Submissions Table */}
            {data.submissions.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Submissions ({data.submissions.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Drop Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.submissions.map((sub, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {sub.dropNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sub.userName || sub.submittedBy || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                sub.isValid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {sub.isValid ? '✅ Valid' : '❌ Invalid'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-500">
                  No submissions for {selectedDate}
                </div>
              </div>
            )}
          </>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Auto-refreshing every 30 seconds
        </div>
      </div>
    </AppLayout>
  );
}
