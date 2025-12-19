// src/modules/ticketing/components/TicketingDashboard.tsx
// Main ticketing dashboard with statistics and ticket lists
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import type { Ticket, TicketSource } from '../types';

interface DashboardStats {
  assigned_to_me: {
    total: number;
    by_priority: Record<string, number>;
    overdue: number;
  };
  created_by_me: {
    total: number;
    open: number;
    resolved: number;
  };
  watching: {
    total: number;
    recent_updates: number;
  };
}

interface AggregatedView {
  tickets: Ticket[];
  total: number;
  by_source: Record<TicketSource, number>;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  sla_metrics: {
    at_risk: number;
    breached: number;
    on_track: number;
  };
}

export function TicketingDashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [aggregatedView, setAggregatedView] = useState<AggregatedView | null>(null);
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'all-tickets' | 'team'>('my-tickets');
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    source: '',
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch my dashboard stats
      const statsRes = await fetch(`/api/ticketing/tickets-stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setDashboardStats(statsData.data);
      }

      // Fetch aggregated view
      const viewRes = await fetch(`/api/ticketing/tickets?per_page=10`);
      const viewData = await viewRes.json();
      if (viewData.success) {
        setAggregatedView({
          tickets: viewData.data.data || [],
          total: viewData.data.total || 0,
          by_source: {},
          by_status: {},
          by_priority: {},
          sla_metrics: { at_risk: 0, breached: 0, on_track: 0 },
        });
      }
    } catch {
      // Error loading dashboard data - show fallback UI
    } finally {
      setLoading(false);
    }
  }

  async function handleFilterChange(key: string, value: string) {
    setFilter((prev) => ({ ...prev, [key]: value }));

    // Reload tickets with filter
    const params = new URLSearchParams();
    if (value) params.append(key, value);

    const res = await fetch(`/api/ticketing/tickets?${params.toString()}`);
    const data = await res.json();
    setAggregatedView(data.data);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!dashboardStats || !aggregatedView) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ticketing Dashboard</h1>
        <button
          onClick={() => (window.location.href = '/ticketing/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Create Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assigned to Me */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned to Me</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Open</span>
              <span className="text-2xl font-bold text-blue-600">
                {dashboardStats.assigned_to_me.total}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-600">Critical</span>
                <span className="font-semibold">{dashboardStats.assigned_to_me.by_priority.critical || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-orange-600">High</span>
                <span className="font-semibold">{dashboardStats.assigned_to_me.by_priority.high || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-yellow-600">Medium</span>
                <span className="font-semibold">{dashboardStats.assigned_to_me.by_priority.medium || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600">Low</span>
                <span className="font-semibold">{dashboardStats.assigned_to_me.by_priority.low || 0}</span>
              </div>
            </div>
            {dashboardStats.assigned_to_me.overdue > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-semibold text-red-800">
                  ⚠️ {dashboardStats.assigned_to_me.overdue} Overdue Ticket{dashboardStats.assigned_to_me.overdue > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Created by Me */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Created by Me</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                {dashboardStats.created_by_me.total}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-600">Open</span>
                <span className="font-semibold">{dashboardStats.created_by_me.open}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600">Resolved</span>
                <span className="font-semibold">{dashboardStats.created_by_me.resolved}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Tracked</span>
              <span className="text-2xl font-bold text-gray-900">
                {aggregatedView.sla_metrics.at_risk + aggregatedView.sla_metrics.breached + aggregatedView.sla_metrics.on_track}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600">On Track</span>
                <span className="font-semibold">{aggregatedView.sla_metrics.on_track}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-orange-600">At Risk</span>
                <span className="font-semibold">{aggregatedView.sla_metrics.at_risk}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-600">Breached</span>
                <span className="font-semibold">{aggregatedView.sla_metrics.breached}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-tickets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Tickets
          </button>
          <button
            onClick={() => setActiveTab('all-tickets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all-tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Tickets
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Team View
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_customer">Awaiting Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <select
              value={filter.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              <option value="qcontact">QContact</option>
              <option value="whatsapp_inbound">WhatsApp Inbound</option>
              <option value="email">Email</option>
              <option value="construction">Construction</option>
              <option value="internal">Internal</option>
              <option value="whatsapp_outbound">WhatsApp Outbound</option>
              <option value="adhoc">Ad-hoc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {aggregatedView.tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No tickets found
                </td>
              </tr>
            ) : (
              aggregatedView.tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => (window.location.href = `/ticketing/${ticket.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {ticket.ticket_uid}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{ticket.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.source.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
