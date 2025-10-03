/**
 * PerformanceTable - Detailed contractor performance data table
 */

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-react';
import { ContractorPerformance } from './PerformanceTypes';

interface PerformanceTableProps {
  contractors: ContractorPerformance[];
  onSort: (sortBy: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function PerformanceTable({ contractors, onSort, sortBy, sortOrder }: PerformanceTableProps) {
  const getScoreDisplay = (score: number | null) => {
    if (score === null || score === 0) return '-';
    return `${score.toFixed(1)}%`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null || score === 0) return 'text-gray-400';
    if (score >= 90) return 'text-green-600 font-medium';
    if (score >= 75) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-medium';
  };

  const getRagColor = (rag: string) => {
    switch (rag) {
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'amber':
        return 'bg-yellow-100 text-yellow-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionRate = (contractor: ContractorPerformance) => {
    if (contractor.totalProjects === 0) return '-';
    return `${((contractor.completedProjects / contractor.totalProjects) * 100).toFixed(1)}%`;
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ?
      <ArrowUp className="w-4 h-4 text-blue-600" /> :
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const columns = [
    { key: 'companyName', label: 'Contractor', sortable: true },
    { key: 'performanceScore', label: 'Performance', sortable: true },
    { key: 'qualityScore', label: 'Quality', sortable: true },
    { key: 'safetyScore', label: 'Safety', sortable: true },
    { key: 'timelinessScore', label: 'Timeliness', sortable: true },
    { key: 'ragStatus', label: 'Risk Status', sortable: false },
    { key: 'projects', label: 'Projects', sortable: true },
    { key: 'completionRate', label: 'Completion Rate', sortable: true },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && onSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contractors.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <MoreHorizontal className="w-8 h-8 text-gray-300 mb-2" />
                    <span>No contractor performance data available</span>
                  </div>
                </td>
              </tr>
            ) : (
              contractors.map((contractor) => (
                <tr key={contractor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {contractor.companyName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getScoreColor(contractor.performanceScore)}>
                      {getScoreDisplay(contractor.performanceScore)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getScoreColor(contractor.qualityScore)}>
                      {getScoreDisplay(contractor.qualityScore)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getScoreColor(contractor.safetyScore)}>
                      {getScoreDisplay(contractor.safetyScore)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getScoreColor(contractor.timelinessScore)}>
                      {getScoreDisplay(contractor.timelinessScore)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRagColor(contractor.ragOverall)}`}>
                      {contractor.ragOverall.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>{contractor.totalProjects}</span>
                      <span className="text-gray-400">({contractor.activeProjects} active)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {getCompletionRate(contractor)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {contractors.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{contractors.length}</span> contractors
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}