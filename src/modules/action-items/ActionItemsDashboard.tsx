'use client';

import { CheckCircle, Clock, AlertCircle, Calendar, Users, Filter } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

interface ActionItemsStats {
  summary: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
    upcoming: number;
    unassigned: number;
    assigned: number;
  };
  priority: {
    high: number;
    medium: number;
    low: number;
  };
  dueDates: {
    overdue: number;
    thisWeek: number;
    thisMonth: number;
  };
  performance: {
    completionRate: number;
    onTimeCompletionRate: number;
    completedOnTime: number;
    completedLate: number;
  };
  breakdowns: {
    categories: Array<{ category: string; count: number }>;
    projects: Array<{ project_name: string; count: number }>;
    assignees: Array<{ assignee_name: string; count: number }>;
  };
  trends: Array<{
    date: string;
    created_count: number;
    completed_count: number;
  }>;
  generatedAt: string;
}

export function ActionItemsDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<ActionItemsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/action-items/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching action items stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Pending Actions',
      description: 'View all pending action items',
      icon: Clock,
      color: 'bg-yellow-500',
      count: stats?.summary.pending || 0,
      onClick: () => router.push('/action-items/pending'),
    },
    {
      title: 'Completed Actions',
      description: 'Review completed action items',
      icon: CheckCircle,
      color: 'bg-green-500',
      count: stats?.summary.completed || 0,
      onClick: () => router.push('/action-items/completed'),
    },
    {
      title: 'Overdue Actions',
      description: 'Urgent overdue action items',
      icon: AlertCircle,
      color: 'bg-red-500',
      count: stats?.summary.overdue || 0,
      onClick: () => router.push('/action-items/overdue'),
    },
    {
      title: 'By Meeting',
      description: 'Actions grouped by meetings',
      icon: Calendar,
      color: 'bg-blue-500',
      count: undefined, // Will be calculated based on meeting-related items
      onClick: () => router.push('/action-items/by-meeting'),
    },
    {
      title: 'By Assignee',
      description: 'Actions grouped by person',
      icon: Users,
      color: 'bg-purple-500',
      count: stats?.summary.assigned || 0,
      onClick: () => router.push('/action-items/by-assignee'),
    },
    {
      title: 'Filter & Search',
      description: 'Advanced filtering options',
      icon: Filter,
      color: 'bg-indigo-500',
      count: undefined,
      onClick: () => router.push('/action-items/search'),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>
          <p className="text-gray-600 mt-1">Loading action items data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>
          <p className="text-red-600 mt-1">Error loading data: {error}</p>
        </div>
        <button
          onClick={fetchStats}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Action Items</h1>
        <p className="text-gray-600 mt-1">Track and manage action items from meetings</p>
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
          <span>Updated: {stats ? new Date(stats.generatedAt).toLocaleString() : 'Never'}</span>
          <button
            onClick={fetchStats}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.summary.total || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.summary.pending || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats?.summary.overdue || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats?.summary.completed || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
            <p className="text-xl font-bold text-green-600">{stats.performance.completionRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">On-Time Completion</p>
            <p className="text-xl font-bold text-blue-600">{stats.performance.onTimeCompletionRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">High Priority</p>
            <p className="text-xl font-bold text-red-600">{stats.priority.high}</p>
          </div>
        </div>
      )}

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            onClick={card.onClick}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start space-x-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {card.title}
                  {card.count !== undefined && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({card.count})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}