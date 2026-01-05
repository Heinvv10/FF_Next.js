/**
 * Project Quick Stats Component
 * Sidebar showing quick project statistics
 */

import { Project } from '@/types/project.types';
import { formatCurrency } from './ProjectDetailUtils';

interface ProjectQuickStatsProps {
  project: Project;
}

export function ProjectQuickStats({ project }: ProjectQuickStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Budget Used</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(project.actualCost || 0)}
          </span>
        </div>
        
        {project.actualCost && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Actual Cost</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(project.actualCost)}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Current Phase</span>
          <span className="text-sm font-medium text-gray-900">
            {project.phase || 'Planning'}
          </span>
        </div>
      </div>
    </div>
  );
}