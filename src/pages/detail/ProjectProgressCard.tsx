/**
 * Project Progress Card Component
 */

import { Project } from '@/types/project.types';

interface ProjectProgressCardProps {
  project: Project;
}

export function ProjectProgressCard({ project }: ProjectProgressCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(project.actualProgress || 0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${project.actualProgress || 0}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-semibold text-gray-900">{0}</div>
            <div className="text-sm text-gray-500">Tasks Completed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-semibold text-gray-900">{0}</div>
            <div className="text-sm text-gray-500">Tasks Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}