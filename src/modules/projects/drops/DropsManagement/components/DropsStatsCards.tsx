import { Home, CheckCircle, Clock, Cable } from 'lucide-react';
import type { DropsStats } from '../types/drops.types';

interface DropsStatsCardsProps {
  stats: DropsStats;
  allDropsStats: DropsStats;
}

export function DropsStatsCards({ stats, allDropsStats }: DropsStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-600">Total Drops</span>
          <Home className="h-4 w-4 text-neutral-400" />
        </div>
        <p className="text-2xl font-semibold text-neutral-900">{allDropsStats.totalDrops}</p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-600">Completed</span>
          <CheckCircle className="h-4 w-4 text-success-600" />
        </div>
        <p className="text-2xl font-semibold text-success-600">{allDropsStats.completedDrops}</p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-600">In Progress</span>
          <Clock className="h-4 w-4 text-info-600" />
        </div>
        <p className="text-2xl font-semibold text-info-600">{allDropsStats.inProgressDrops}</p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-600">Pending</span>
          <Clock className="h-4 w-4 text-warning-600" />
        </div>
        <p className="text-2xl font-semibold text-warning-600">{allDropsStats.pendingDrops}</p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-600">Cable Used</span>
          <Cable className="h-4 w-4 text-primary-600" />
        </div>
        <p className="text-2xl font-semibold text-neutral-900">{allDropsStats.totalCableUsed}m</p>
      </div>
    </div>
  );
}