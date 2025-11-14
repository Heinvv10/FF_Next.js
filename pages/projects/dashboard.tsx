/**
 * Projects Dashboard Page
 * Route: /projects/dashboard
 *
 * Shows project stats and WA Monitor QA drops
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useProjects } from '@/hooks/useProjects';
import { useWaMonitorSummary } from '@/modules/wa-monitor/hooks/useWaMonitorStats';
import {
  CheckCircle,
  FolderKanban,
  Activity,
  Plus,
  AlertTriangle,
} from 'lucide-react';

export default function ProjectsDashboard() {
  const router = useRouter();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: waStats, isLoading: waLoading, error: waError } = useWaMonitorSummary();
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Calculate project stats
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalProjects = projects.length;

  // Filter WA stats by selected project
  const filteredWaStats = selectedProject === 'all'
    ? waStats
    : waStats && waStats.byProject
      ? {
          ...waStats,
          ...waStats.byProject.find(p => p.project === selectedProject)
        }
      : null;

  // Get display stats
  const displayTotal = filteredWaStats?.total || 0;
  const displayComplete = filteredWaStats?.complete || 0;
  const displayIncomplete = filteredWaStats?.incomplete || 0;
  const displayCompletionRate = filteredWaStats?.completionRate || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects Dashboard</h1>
            <p className="mt-2 text-gray-600">Overview of all projects and QA metrics</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>

        {/* Project Filter */}
        <div className="mb-6">
          <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Project
          </label>
          <select
            id="project-filter"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="block w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Projects</option>
            {waStats?.byProject?.map(p => (
              <option key={p.project} value={p.project}>
                {p.project} ({p.total} drops today)
              </option>
            ))}
          </select>
        </div>

        {/* Project Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Projects Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FolderKanban className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Projects Overview</h2>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Projects</span>
                <span className="text-2xl font-bold text-gray-900">
                  {projectsLoading ? '...' : totalProjects}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Projects</span>
                <span className="text-2xl font-bold text-green-600">
                  {projectsLoading ? '...' : activeProjects}
                </span>
              </div>
            </div>
          </div>

          {/* Today's QA Drops */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="ml-3 text-lg font-semibold text-gray-900">
                  Today's QA Drops
                  {selectedProject !== 'all' && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({selectedProject})
                    </span>
                  )}
                </h2>
              </div>
            </div>
            {waError ? (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>Error loading WA Monitor data</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Submitted</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {waLoading ? '...' : displayTotal}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Complete</span>
                  <span className="text-2xl font-bold text-green-600">
                    {waLoading ? '...' : displayComplete}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Incomplete</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {waLoading ? '...' : displayIncomplete}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-lg font-bold text-gray-900">{displayCompletionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        displayCompletionRate >= 80 ? 'bg-green-500' :
                        displayCompletionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${displayCompletionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Projects by WA Monitor Stats */}
        {waStats?.byProject && waStats.byProject.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="ml-3 text-lg font-semibold text-gray-900">Today's Stats by Project</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Complete
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Incomplete
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waStats.byProject.map((project) => (
                    <tr
                      key={project.project}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedProject(project.project)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.project}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{project.total}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">{project.complete}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-orange-600">
                          {project.total - project.complete}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end">
                          <span className={`text-sm font-medium ${
                            project.completionRate >= 80 ? 'text-green-600' :
                            project.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {project.completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Projects List */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="ml-3 text-lg font-semibold text-gray-900">All Projects</h2>
            </div>
            <button
              onClick={() => router.push('/projects')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          {projectsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No projects found. Create your first project to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                    {project.client && (
                      <span className="text-gray-500">{project.client}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
