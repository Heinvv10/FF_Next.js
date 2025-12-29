/**
 * Asset Calibration Page
 *
 * Track and manage asset calibration schedules.
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Gauge,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  FileCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAssets, useCalibrationDue } from '@/modules/assets/hooks';

export default function CalibrationPage() {
  const router = useRouter();
  const [daysFilter, setDaysFilter] = useState(30);

  const { data: calibrationData, isLoading } = useCalibrationDue(daysFilter);
  const { data: outForCalibration } = useAssets({
    status: ['out_for_calibration'],
    limit: 100,
  });

  const assets = calibrationData?.assets ?? [];
  const summary = calibrationData?.summary;
  const assetsOutForCalibration = outForCalibration?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calibration</h1>
          <p className="text-gray-600 mt-1">
            Track calibration schedules and certificates
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out for Calibration</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {assetsOutForCalibration.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileCheck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due Soon</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {summary?.dueSoon ?? 0}
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
                {summary?.overdue ?? 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Due ({daysFilter}d)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary?.total ?? 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Gauge className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <label className="text-sm text-gray-600">Show calibration due within:</label>
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

      {/* Out for Calibration */}
      {!isLoading && assetsOutForCalibration.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileCheck className="h-5 w-5 mr-2 text-blue-500" />
              Currently Out for Calibration
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {assetsOutForCalibration.map((asset) => (
              <div
                key={asset.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/inventory/list?id=${asset.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.assetNumber}</p>
                    {asset.calibrationProvider && (
                      <p className="text-xs text-gray-400 mt-1">
                        Provider: {asset.calibrationProvider}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <FileCheck className="h-3 w-3 mr-1" />
                      Out for Calibration
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calibration Due List */}
      {!isLoading && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-yellow-500" />
              Calibration Due (Next {daysFilter} Days)
            </h2>
          </div>
          {assets.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No calibration due in the next {daysFilter} days</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {assets.map((asset) => {
                const isOverdue = asset.nextCalibrationDate && new Date(asset.nextCalibrationDate) < new Date();
                const dueDate = asset.nextCalibrationDate ? new Date(asset.nextCalibrationDate) : null;
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
                        <div className="flex items-center gap-4 mt-1">
                          {asset.currentAssigneeName && (
                            <span className="text-xs text-gray-400">
                              Assigned to: {asset.currentAssigneeName}
                            </span>
                          )}
                          {asset.calibrationProvider && (
                            <span className="text-xs text-gray-400">
                              Provider: {asset.calibrationProvider}
                            </span>
                          )}
                        </div>
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
                        {asset.lastCalibrationDate && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last: {new Date(asset.lastCalibrationDate).toLocaleDateString()}
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

CalibrationPage.getLayout = (page: React.ReactElement) => (
  <AppLayout>{page}</AppLayout>
);
