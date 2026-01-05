/**
 * Project Status Badges Component
 * Displays status, priority, and type badges
 */

import { Project } from '@/types/project.types';
import { statusColors, priorityColors } from './ProjectDetailHelpers';
import { formatStatus, formatPriority, formatProjectType } from './ProjectDetailUtils';

interface ProjectStatusBadgesProps {
  project: Project;
}

export function ProjectStatusBadges({ project }: ProjectStatusBadgesProps) {
  return (
    <div className="flex items-center gap-4">
      <span 
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          statusColors[project.status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {formatStatus(project.status)}
      </span>
      
      <span 
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          priorityColors[project.priority] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {formatPriority(project.priority)}
      </span>
      
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        {formatProjectType(project.projectType)}
      </span>
    </div>
  );
}