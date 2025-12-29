/**
 * Asset Dashboard Page - Server Component
 * Shows asset statistics and overview
 */

import { Suspense } from 'react';
import Link from 'next/link';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Calendar,
  ArrowRight,
  Plus
} from 'lucide-react';

async function getDashboardStats() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005'}/api/assets/dashboard`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const content = (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('border-', 'bg-')}`}>
          <Icon className={`h-6 w-6 ${color.replace('border-', 'text-')}`} />
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          View details <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      )}
    </div>
  );

  return content;
}

export default async function AssetDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Dashboard</h1>
          <p className="text-gray-600">Overview of company assets</p>
        </div>
        <Link
          href="/inventory/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Asset
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Assets"
          value={stats?.assets?.totalAssets || 0}
          icon={Package}
          color="border-blue-500"
          href="/inventory/list"
        />
        <StatCard
          title="Available"
          value={stats?.assets?.availableAssets || 0}
          icon={CheckCircle}
          color="border-green-500"
          href="/inventory/list?status=available"
        />
        <StatCard
          title="Assigned"
          value={stats?.assets?.assignedAssets || 0}
          icon={Package}
          color="border-yellow-500"
          href="/inventory/list?status=assigned"
        />
        <StatCard
          title="In Maintenance"
          value={stats?.assets?.inMaintenanceAssets || 0}
          icon={Wrench}
          color="border-orange-500"
          href="/inventory/maintenance"
        />
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Calibration Alerts
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-red-800">Overdue</span>
              <span className="font-bold text-red-600">
                {stats?.assets?.calibrationOverdue || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-800">Due within 30 days</span>
              <span className="font-bold text-yellow-600">
                {stats?.assets?.calibrationDue || 0}
              </span>
            </div>
          </div>
          <Link
            href="/inventory/calibration"
            className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            View calibration schedule <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
            Maintenance Overview
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-800">Scheduled</span>
              <span className="font-bold text-blue-600">
                {stats?.maintenance?.totalScheduled || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-orange-800">Overdue</span>
              <span className="font-bold text-orange-600">
                {stats?.maintenance?.totalOverdue || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-800">Completed</span>
              <span className="font-bold text-green-600">
                {stats?.maintenance?.totalCompleted || 0}
              </span>
            </div>
          </div>
          <Link
            href="/inventory/maintenance"
            className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            View maintenance schedule <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/inventory/checkout"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <Package className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <span className="text-sm font-medium">Check Out Asset</span>
          </Link>
          <Link
            href="/inventory/checkout?mode=checkin"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <span className="text-sm font-medium">Check In Asset</span>
          </Link>
          <Link
            href="/inventory/maintenance"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <Wrench className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <span className="text-sm font-medium">Schedule Maintenance</span>
          </Link>
          <Link
            href="/inventory/new"
            className="p-4 border rounded-lg hover:bg-gray-50 text-center"
          >
            <Plus className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <span className="text-sm font-medium">Register New Asset</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
