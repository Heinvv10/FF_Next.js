/**
 * Fiber Cable Data Viewer Component
 * Displays actual fiber cable data from QFieldCloud and FibreFlow
 */

import React, { useState, useEffect } from 'react';
import { Cable, MapPin, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface FiberCable {
  cable_id: string;
  cable_type: string;
  fiber_count: number;
  start_location: string;
  end_location: string;
  length: number;
  status: string;
  installation_date?: string;
  installed_by?: string;
  source: 'qfield' | 'fibreflow';
}

interface FiberCableDataViewerProps {
  projectId?: string;
}

export function FiberCableDataViewer({ projectId }: FiberCableDataViewerProps) {
  const [qfieldData, setQfieldData] = useState<FiberCable[]>([]);
  const [fibreflowData, setFibreflowData] = useState<FiberCable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'qfield' | 'fibreflow' | 'comparison'>('comparison');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch QFieldCloud data
      const qfieldResponse = await fetch('/api/qfield-sync-fiber-cables?source=qfield');
      if (qfieldResponse.ok) {
        const qfieldResult = await qfieldResponse.json();
        setQfieldData(qfieldResult.data || qfieldResult || []);
      }

      // Fetch FibreFlow data
      const fibreflowResponse = await fetch('/api/qfield-sync-fiber-cables?source=fibreflow');
      if (fibreflowResponse.ok) {
        const fibreflowResult = await fibreflowResponse.json();
        setFibreflowData(fibreflowResult.data || fibreflowResult || []);
      }
    } catch (error) {
      console.error('Failed to fetch fiber cable data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Activity className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading fiber cable data...</p>
      </div>
    );
  }

  const renderDataTable = (data: FiberCable[], title: string, sourceColor: string) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className={`px-6 py-4 border-b border-gray-200 ${sourceColor}`}>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Cable className="h-5 w-5" />
          {title}
        </h3>
        <p className="text-sm text-white/90 mt-1">
          {data.length} cable{data.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {data.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No fiber cable data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cable ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fibers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Length (m)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Installed By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 10).map((cable, index) => (
                <tr key={`${cable.cable_id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cable.cable_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cable.cable_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cable.fiber_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{cable.start_location}</span>
                      <span>→</span>
                      <span>{cable.end_location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cable.length ? cable.length.toFixed(1) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cable.status)}`}>
                      {getStatusIcon(cable.status)}
                      {cable.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {cable.installed_by || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600 text-center">
              Showing 10 of {data.length} cables
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderComparison = () => {
    // Find cables that exist in both systems
    const qfieldIds = new Set(qfieldData.map(c => c.cable_id));
    const fibreflowIds = new Set(fibreflowData.map(c => c.cable_id));

    const inBoth = [...qfieldIds].filter(id => fibreflowIds.has(id));
    const onlyInQField = [...qfieldIds].filter(id => !fibreflowIds.has(id));
    const onlyInFibreFlow = [...fibreflowIds].filter(id => !qfieldIds.has(id));

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{qfieldData.length}</div>
            <div className="text-sm text-gray-600">QFieldCloud Cables</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{fibreflowData.length}</div>
            <div className="text-sm text-gray-600">FibreFlow Cables</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{inBoth.length}</div>
            <div className="text-sm text-gray-600">Synchronized</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-amber-600">
              {onlyInQField.length + onlyInFibreFlow.length}
            </div>
            <div className="text-sm text-gray-600">Need Sync</div>
          </div>
        </div>

        {/* Sync Status */}
        {(onlyInQField.length > 0 || onlyInFibreFlow.length > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">Synchronization Needed</h4>
                <ul className="mt-2 text-sm text-amber-800 space-y-1">
                  {onlyInQField.length > 0 && (
                    <li>• {onlyInQField.length} cables in QFieldCloud not in FibreFlow</li>
                  )}
                  {onlyInFibreFlow.length > 0 && (
                    <li>• {onlyInFibreFlow.length} cables in FibreFlow not in QFieldCloud</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>{renderDataTable(qfieldData, 'QFieldCloud Data', 'bg-green-600')}</div>
          <div>{renderDataTable(fibreflowData, 'FibreFlow Data', 'bg-blue-600')}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Fiber Cable Data</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('comparison')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedView === 'comparison'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Comparison View
            </button>
            <button
              onClick={() => setSelectedView('qfield')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedView === 'qfield'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              QFieldCloud Only
            </button>
            <button
              onClick={() => setSelectedView('fibreflow')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedView === 'fibreflow'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              FibreFlow Only
            </button>
          </div>
        </div>
      </div>

      {/* Data Display */}
      {selectedView === 'comparison' && renderComparison()}
      {selectedView === 'qfield' && renderDataTable(qfieldData, 'QFieldCloud Data', 'bg-green-600')}
      {selectedView === 'fibreflow' && renderDataTable(fibreflowData, 'FibreFlow Data', 'bg-blue-600')}
    </div>
  );
}