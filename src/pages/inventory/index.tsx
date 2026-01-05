/**
 * Asset Inventory Dashboard
 *
 * Overview of asset status, alerts, and quick actions.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAssetDashboard, useCalibrationDue, useMaintenanceDue } from '@/modules/assets/hooks';

export default function InventoryDashboard() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: dashboard, isLoading, refetch } = useAssetDashboard();
  const { data: calibrationData } = useCalibrationDue(7);
  const { data: maintenanceData } = useMaintenanceDue(7);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const stats = dashboard?.stats;
  const alerts = dashboard?.alerts;

  const statCards = [
    {
      label: 'Total Assets',
      value: stats?.totalAssets ?? 0,
      icon: Package,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: () => router.push('/inventory/list'),
    },
    {
      label: 'Available',
      value: stats?.availableAssets ?? 0,
      icon: CheckCircle,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      onClick: () => router.push('/inventory/list?status=available'),
    },
    {
      label: 'Assigned',
      value: stats?.assignedAssets ?? 0,
      icon: TrendingUp,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      onClick: () => router.push('/inventory/list?status=assigned'),
    },
    {
      label: 'In Maintenance',
      value: stats?.inMaintenanceAssets ?? 0,
      icon: Wrench,
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      onClick: () => router.push('/inventory/maintenance'),
    },
  ];

  const alertCards = [
    {
      label: 'Calibration Due',
      value: alerts?.calibrationDue ?? 0,
      overdue: stats?.calibrationOverdue ?? 0,
      icon: Clock,
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      onClick: () => router.push('/inventory/calibration'),
    },
    {
      label: 'Maintenance Due',
      value: alerts?.maintenanceDue ?? 0,
      icon: Wrench,
      iconBgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      onClick: () => router.push('/inventory/maintenance'),
    },
    {
      label: 'Overdue Returns',
      value: alerts?.overdueReturns ?? 0,
      icon: AlertTriangle,
      iconBgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      onClick: () => router.push('/inventory/checkout'),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Asset Inventory</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage your equipment and tools
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Stats Grid */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <button
                  key={index}
                  onClick={card.onClick}
                  className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {card.value.toLocaleString()}
                      </p>
                    </div>
                    <div className={`h-12 w-12 ${card.iconBgColor} rounded-full flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${card.iconColor}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Alerts Section */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                Alerts & Actions Required
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {alertCards.map((card, index) => {
                  const Icon = card.icon;
                  const hasIssues = card.value > 0;
                  return (
                    <button
                      key={index}
                      onClick={card.onClick}
                      className={`p-4 rounded-lg border ${
                        hasIssues ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                      } hover:shadow-md transition-shadow text-left`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{card.label}</p>
                          <p className={`text-xl font-bold mt-1 ${hasIssues ? 'text-red-600' : 'text-gray-900'}`}>
                            {card.value}
                          </p>
                          {'overdue' in card && card.overdue > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              {card.overdue} overdue
                            </p>
                          )}
                        </div>
                        <div className={`h-10 w-10 ${card.iconBgColor} rounded-full flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/inventory/list')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">View All Assets</h3>
              <p className="text-sm text-gray-600 mt-1">Browse and manage inventory</p>
            </button>

            <button
              onClick={() => router.push('/inventory/checkout')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <Package className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Check Out / In</h3>
              <p className="text-sm text-gray-600 mt-1">Manage asset assignments</p>
            </button>

            <button
              onClick={() => router.push('/inventory/calibration')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <Clock className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Calibration</h3>
              <p className="text-sm text-gray-600 mt-1">Track calibration schedules</p>
            </button>

            <button
              onClick={() => router.push('/inventory/categories')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
            >
              <Package className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Categories</h3>
              <p className="text-sm text-gray-600 mt-1">Manage asset categories</p>
            </button>
          </div>

          {/* Calibration Due List */}
          {calibrationData && calibrationData.assets.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Calibration Due (Next 7 Days)
                </h2>
                <button
                  onClick={() => router.push('/inventory/calibration')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {calibrationData.assets.slice(0, 5).map((asset) => (
                  <div
                    key={asset.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/inventory/list?id=${asset.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        <p className="text-sm text-gray-600">{asset.assetNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          asset.nextCalibrationDate && new Date(asset.nextCalibrationDate) < new Date()
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}>
                          {asset.nextCalibrationDate
                            ? new Date(asset.nextCalibrationDate).toLocaleDateString()
                            : 'Not set'}
                        </p>
                        <p className="text-xs text-gray-500">Due Date</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

InventoryDashboard.getLayout = (page: React.ReactElement) => (
  <AppLayout>{page}</AppLayout>
);
