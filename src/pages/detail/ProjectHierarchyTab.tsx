/**
 * Project Hierarchy Tab Component
 * Displays project hierarchy with phases, steps, and tasks
 */

import { TaskStatus } from '@/types/project.types';
import { getPhaseStatusIcon } from './ProjectDetailHelpers';
import { calculatePercentage } from './ProjectDetailUtils';

interface ProjectHierarchyTabProps {
  hierarchy: any;
  isLoading: boolean;
}

export function ProjectHierarchyTab({ hierarchy, isLoading }: ProjectHierarchyTabProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!hierarchy) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No hierarchy data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Hierarchy</h2>
        
        <div className="space-y-6">
          {hierarchy.phases && hierarchy.phases.length > 0 ? (
            hierarchy.phases.map((phase: any) => (
              <div key={phase.id} className="border border-gray-200 rounded-lg">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getPhaseStatusIcon(phase.status)}
                      <div className="ml-3">
                        <h3 className="text-base font-semibold text-gray-900">
                          Phase {phase.order}: {phase.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {phase.status.replace('_', ' ')} • {calculatePercentage(phase.progress)}% complete
                        </p>
                      </div>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${calculatePercentage(phase.progress)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {phase.steps && phase.steps.length > 0 && (
                  <div className="p-4">
                    <div className="space-y-4">
                      {phase.steps.map((step: any) => (
                        <div key={step.id} className="ml-4 border-l-2 border-gray-200 pl-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">
                                {step.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {step.status.replace('_', ' ')} • {step.estimatedHours}h estimated
                              </p>
                            </div>
                            <div className="text-xs text-gray-500">
                              {calculatePercentage(step.progress)}%
                            </div>
                          </div>
                          
                          {step.tasks && step.tasks.length > 0 && (
                            <div className="mt-2 ml-4 space-y-1">
                              {step.tasks.slice(0, 3).map((task: any) => (
                                <div key={task.id} className="flex items-center text-xs">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    task.status === TaskStatus.COMPLETED 
                                      ? 'bg-green-500' 
                                      : task.status === TaskStatus.IN_PROGRESS
                                      ? 'bg-blue-500'
                                      : 'bg-gray-300'
                                  }`}></div>
                                  <span className="text-gray-600 truncate">{task.name}</span>
                                </div>
                              ))}
                              {step.tasks.length > 3 && (
                                <div className="text-xs text-gray-500 ml-4">
                                  +{step.tasks.length - 3} more tasks
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No project phases available</p>
          )}
        </div>
      </div>
    </div>
  );
}