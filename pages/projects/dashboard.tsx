/**
 * Projects Dashboard Page
 * Route: /projects/dashboard
 *
 * Overview dashboard showing:
 * - WA Monitor stats (QA drops today)
 * - Project summary metrics
 * - Quick links to project management
 */

import { useRouter } from 'next/router';
import { useProjects } from '@/hooks/useProjects';
import { useWaMonitorSummary } from '@/modules/wa-monitor/hooks/useWaMonitorStats';
import { CheckCircle, FolderKanban, Activity, Clock, Plus } from 'lucide-react';

export default function ProjectsDashboard() {
  const router = useRouter();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: waStats, isLoading: waLoading } = useWaMonitorSummary();

  // Calculate project stats
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalProjects = projects.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects Dashboard</h1>
            <p className="mt-2 text-gray-600">Overview of all projects and QA metrics</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Projects Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {projectsLoading ? '...' : totalProjects}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Projects Card */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {projectsLoading ? '...' : activeProjects}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* WA Monitor - QA Drops Today */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">QA Drops Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {waLoading ? '...' : waStats?.total.toLocaleString() || '0'}
                </p>
                {waStats && waStats.total > 0 && (
                  <>
                    <p className="text-xs text-gray-500 mt-1">
                      {waStats.complete} Complete • {waStats.incomplete} Incomplete
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        waStats.completionRate >= 80 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {waStats.completionRate >= 80 ? '↑' : '↓'} {waStats.completionRate}% Complete
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* WA Monitor Breakdown by Project */}
        {waStats && waStats.byProject && waStats.byProject.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's QA Drops by Project</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waStats.byProject.map((projectStat) => (
                <div key={projectStat.project} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{projectStat.project}</h3>
                    <span className="text-2xl font-bold text-gray-900">{projectStat.total}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{projectStat.complete} complete</span>
                    <span className={`font-medium ${
                      projectStat.completionRate >= 80 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {projectStat.completionRate}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        projectStat.completionRate >= 80 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${projectStat.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <FolderKanban className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">View All Projects</div>
                <div className="text-sm text-gray-500">Manage projects</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/wa-monitor')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">WA Monitor</div>
                <div className="text-sm text-gray-500">Review QA submissions</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/projects/new')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Plus className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Create Project</div>
                <div className="text-sm text-gray-500">Start new project</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
