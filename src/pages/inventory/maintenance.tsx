/**
 * Asset Maintenance Page
 *
 * Track and manage asset maintenance schedules and records.
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAssets, useMaintenanceDue } from '@/modules/assets/hooks';

export default function MaintenancePage() {
  const router = useRouter();
  const [daysFilter, setDaysFilter] = useState(30);

  const { data: maintenanceData, isLoading } = useMaintenanceDue(daysFilter);
  const { data: inMaintenanceAssets } = useAssets({
    status: ['in_maintenance'],
    limit: 100,
  });

  const assets = maintenanceData?.assets ?? [];
  const assetsInMaintenance = inMaintenanceAssets?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-1">
            Track maintenance schedules and service records
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Currently In Maintenance</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {assetsInMaintenance.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Wrench className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance Due (Next {daysFilter} Days)</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {assets.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {assets.filter(a => a.nextMaintenanceDate && new Date(a.nextMaintenanceDate) < new Date()).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <label className="text-sm text-gray-600">Show maintenance due within:</label>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Currently In Maintenance */}
      {!isLoading && assetsInMaintenance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-orange-500" />
              Currently In Maintenance
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {assetsInMaintenance.map((asset) => (
              <div
                key={asset.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/inventory/list?id=${asset.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.assetNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      <Wrench className="h-3 w-3 mr-1" />
                      In Maintenance
                    </span>
                    {asset.currentLocation && (
                      <p className="text-xs text-gray-500 mt-1">{asset.currentLocation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Due List */}
      {!isLoading && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-yellow-500" />
              Maintenance Due (Next {daysFilter} Days)
            </h2>
          </div>
          {assets.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No maintenance due in the next {daysFilter} days</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assets.map((asset) => {
                const isOverdue = asset.nextMaintenanceDate && new Date(asset.nextMaintenanceDate) < new Date();
                const dueDate = asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate) : null;
                const daysUntilDue = dueDate
                  ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <div
                    key={asset.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      isOverdue ? 'bg-red-50' : ''
                    }`}
                    onClick={() => router.push(`/inventory/list?id=${asset.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.assetNumber}</p>
                        {asset.currentAssigneeName && (
                          <p className="text-xs text-gray-400 mt-1">
                            Assigned to: {asset.currentAssigneeName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {isOverdue ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : daysUntilDue !== null && daysUntilDue <= 7 ? (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Calendar className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={`text-sm font-medium ${
                            isOverdue ? 'text-red-600' :
                            daysUntilDue !== null && daysUntilDue <= 7 ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {dueDate ? dueDate.toLocaleDateString() : 'Not scheduled'}
                          </span>
                        </div>
                        {daysUntilDue !== null && (
                          <p className={`text-xs mt-1 ${
                            isOverdue ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {isOverdue
                              ? `${Math.abs(daysUntilDue)} days overdue`
                              : daysUntilDue === 0
                              ? 'Due today'
                              : `Due in ${daysUntilDue} days`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

MaintenancePage.getLayout = (page: React.ReactElement) => (
  <AppLayout>{page}</AppLayout>
);
