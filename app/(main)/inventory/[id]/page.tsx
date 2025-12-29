/**
 * Asset Detail Page - Server Component
 * Shows detailed information about a single asset
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Package,
  Calendar,
  MapPin,
  User,
  Wrench,
  History,
  FileText
} from 'lucide-react';
import { ASSET_STATUS_CONFIG } from '@/modules/assets/constants/assetStatus';
import { CheckInButton } from './CheckInButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getAsset(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/api/assets/${id}`,
      { cache: 'no-store' }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching asset:', error);
    return null;
  }
}

async function getAssignmentHistory(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/api/assets/${id}/history`,
      { cache: 'no-store' }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}

function getStatusBadge(status: string) {
  const config = ASSET_STATUS_CONFIG[status as keyof typeof ASSET_STATUS_CONFIG];
  if (!config) return null;

  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${colorClasses[config.color] || 'bg-gray-100 text-gray-800'}`}>
      {config.label}
    </span>
  );
}

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [asset, history] = await Promise.all([
    getAsset(id),
    getAssignmentHistory(id),
  ]);

  if (!asset) {
    notFound();
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/inventory/list"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Assets
        </Link>

        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
              <p className="text-gray-600 font-mono">{asset.assetNumber}</p>
              <div className="mt-2">{getStatusBadge(asset.status)}</div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Link
              href={`/inventory/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            {asset.status === 'available' && (
              <Link
                href={`/inventory/checkout?assetId=${id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Check Out
              </Link>
            )}
            {asset.status === 'assigned' && (
              <CheckInButton assetId={id} />
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Manufacturer</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {asset.manufacturer || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Model</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {asset.model || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Serial Number</dt>
                <dd className="text-sm font-medium text-gray-900 font-mono">
                  {asset.serialNumber || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Barcode</dt>
                <dd className="text-sm font-medium text-gray-900 font-mono">
                  {asset.barcode || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Condition</dt>
                <dd className="text-sm font-medium text-gray-900 capitalize">
                  {asset.condition?.replace('_', ' ') || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Purchase Date</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {asset.purchaseDate
                    ? new Date(asset.purchaseDate).toLocaleDateString()
                    : '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Current Assignment */}
          {asset.currentAssigneeName && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                Current Assignment
              </h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Assigned To</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {asset.currentAssigneeName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Type</dt>
                  <dd className="text-sm font-medium text-gray-900 capitalize">
                    {asset.currentAssigneeType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Assigned Since</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {asset.assignedSince
                      ? new Date(asset.assignedSince).toLocaleDateString()
                      : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Location</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {asset.currentLocation || '-'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Assignment History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <History className="h-5 w-5 mr-2 text-gray-500" />
              Assignment History
            </h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No assignment history</p>
            ) : (
              <div className="space-y-4">
                {history.slice(0, 5).map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.assignmentType === 'checkout'
                          ? `Checked out to ${assignment.toName}`
                          : assignment.assignmentType === 'transfer'
                          ? `Transferred to ${assignment.toName}`
                          : `Returned from ${assignment.toName}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(assignment.checkedOutAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calibration */}
          {asset.requiresCalibration && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Wrench className="h-5 w-5 mr-2 text-orange-500" />
                Calibration
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Last Calibration</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {asset.lastCalibrationDate
                      ? new Date(asset.lastCalibrationDate).toLocaleDateString()
                      : 'Never'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Next Calibration</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {asset.nextCalibrationDate
                      ? new Date(asset.nextCalibrationDate).toLocaleDateString()
                      : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Provider</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {asset.calibrationProvider || '-'}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-500" />
              Location
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Current Location</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {asset.currentLocation || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Warehouse</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {asset.warehouseLocation || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Bin Location</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {asset.binLocation || '-'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notes */}
          {asset.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-500" />
                Notes
              </h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {asset.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
