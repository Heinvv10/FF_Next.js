/**
 * Projects Dashboard Page
 * Route: /projects/dashboard
 *
 * Comprehensive dashboard showing:
 * - Overall project completion rate (all-time)
 * - Today's QA drops performance
 * - Weekly/Monthly trends
 * - Outstanding drops
 * - Resubmission metrics
 * - Common failure points
 * - Feedback stats
 * - Agent performance
 */

import { useRouter } from 'next/router';
import { useProjects } from '@/hooks/useProjects';
import { useWaMonitorSummary } from '@/modules/wa-monitor/hooks/useWaMonitorStats';
import {
  CheckCircle,
  FolderKanban,
  Activity,
  Clock,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Users,
  BarChart3,
  XCircle
} from 'lucide-react';

export default function ProjectsDashboard() {
  const router = useRouter();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: waStats, isLoading: waLoading } = useWaMonitorSummary();

  // Calculate project stats
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalProjects = projects.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects Dashboard</h1>
            <p className="mt-2 text-gray-600">Comprehensive overview of all projects and QA metrics</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>

        {/* 1. OVERALL SYSTEM STATS - Hero Section */}
        {waStats?.overallStats && (
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Drops in System</p>
                <p className="text-4xl font-bold mt-2">{waLoading ? '...' : waStats.overallStats.totalInSystem.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Completed Drops</p>
                <p className="text-4xl font-bold mt-2">{waLoading ? '...' : waStats.overallStats.completedInSystem.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Overall Completion Rate</p>
                <p className="text-4xl font-bold mt-2">{waLoading ? '...' : waStats.overallStats.systemCompletionRate}%</p>
                <div className="mt-3 bg-white/20 rounded-full h-3">
                  <div
                    className="bg-white rounded-full h-3 transition-all duration-500"
                    style={{ width: `${waStats.overallStats.systemCompletionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Row: Today's Performance + Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 2. TODAY'S QA DROPS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's QA Drops</h3>
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{waLoading ? '...' : waStats?.total.toLocaleString() || '0'}</p>
            {waStats && waStats.total > 0 && (
              <>
                <p className="text-sm text-gray-600 mt-2">
                  {waStats.complete} Complete • {waStats.incomplete} Incomplete
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {waStats.completionRate >= 80 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`text-lg font-semibold ${
                    waStats.completionRate >= 80 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {waStats.completionRate}% Complete
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 3. WEEKLY TREND */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{waLoading ? '...' : waStats?.trends?.weekly?.total.toLocaleString() || '0'}</p>
            {waStats?.trends?.weekly && (
              <>
                <p className="text-sm text-gray-600 mt-2">
                  {waStats.trends.weekly.complete} Complete • {waStats.trends.weekly.total - waStats.trends.weekly.complete} Incomplete
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`text-lg font-semibold ${
                    waStats.trends.weekly.completionRate >= 80 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {waStats.trends.weekly.completionRate}% Complete
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 4. MONTHLY TREND */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
              <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{waLoading ? '...' : waStats?.trends?.monthly?.total.toLocaleString() || '0'}</p>
            {waStats?.trends?.monthly && (
              <>
                <p className="text-sm text-gray-600 mt-2">
                  {waStats.trends.monthly.complete} Complete • {waStats.trends.monthly.total - waStats.trends.monthly.complete} Incomplete
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`text-lg font-semibold ${
                    waStats.trends.monthly.completionRate >= 80 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {waStats.trends.monthly.completionRate}% Complete
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Middle Row: Outstanding + Resubmissions + Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 5. OUTSTANDING DROPS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Outstanding Drops</h3>
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            {waStats?.outstanding && (
              <>
                <p className="text-3xl font-bold text-gray-900">{waStats.outstanding.totalIncomplete.toLocaleString()}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Needs Attention (7+ days)</span>
                    <span className="font-semibold text-red-600">{waStats.outstanding.needsAttention}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Recent (&lt; 7 days)</span>
                    <span className="font-semibold text-gray-900">{waStats.outstanding.recent}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 6. RESUBMISSIONS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resubmissions</h3>
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            {waStats?.resubmissions && (
              <>
                <p className="text-3xl font-bold text-gray-900">{waStats.resubmissions.total.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {waStats.resubmissions.rate}% of total drops
                </p>
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 font-medium">First-Time Pass Rate</p>
                  <p className="text-2xl font-bold text-green-600">{waStats.resubmissions.firstTimePassRate}%</p>
                </div>
              </>
            )}
          </div>

          {/* 7. FEEDBACK STATS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Feedback Status</h3>
              <div className="h-10 w-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
            {waStats?.feedbackStats && (
              <>
                <p className="text-3xl font-bold text-gray-900">{waStats.feedbackStats.sent}</p>
                <p className="text-sm text-gray-600 mt-2">Feedback Sent Today</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending Feedback</span>
                    <span className="font-semibold text-orange-600">{waStats.feedbackStats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Send Rate</span>
                    <span className="font-semibold text-green-600">{waStats.feedbackStats.sendRate}%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 8. COMMON FAILURE POINTS */}
        {waStats?.commonFailures && waStats.commonFailures.length > 0 && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Common Failure Points (Today)</h3>
                <p className="text-sm text-gray-600">Top 5 missing steps in incomplete drops</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {waStats.commonFailures.map((failure, index) => (
                <div key={failure.step} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-xs font-medium text-gray-900">{failure.step}</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{failure.count}</p>
                  <p className="text-xs text-gray-600 mt-1">{failure.percentage}% of drops</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. AGENT PERFORMANCE */}
        {waStats?.agentPerformance && waStats.agentPerformance.length > 0 && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Agent Performance (Today)</h3>
                <p className="text-sm text-gray-600">Agents with assigned drops</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {waStats.agentPerformance.slice(0, 5).map((agent, index) => (
                <div key={agent.agent} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-6 w-6 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' : 'bg-emerald-600'
                    } text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                      {index + 1}
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate">{agent.agent}</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{agent.completionRate}%</p>
                  <p className="text-xs text-gray-600 mt-1">{agent.drops} drops processed</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TODAY'S BREAKDOWN BY PROJECT */}
        {waStats?.byProject && waStats.byProject.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's QA Drops by Project</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {waStats.byProject.map((projectStat) => (
                <div key={projectStat.project} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{projectStat.project}</h3>
                    <span className="text-3xl font-bold text-gray-900">{projectStat.total}</span>
                  </div>

                  {/* Today's Stats */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Today: {projectStat.complete} complete</span>
                      <span className={`font-semibold ${
                        projectStat.completionRate >= 80 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {projectStat.completionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          projectStat.completionRate >= 80 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${projectStat.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Overall Stats */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Overall Progress</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-900 font-medium">
                        {projectStat.overallComplete.toLocaleString()} / {projectStat.overallTotal.toLocaleString()}
                      </span>
                      <span className={`font-bold ${
                        projectStat.overallCompletionRate >= 80 ? 'text-green-600' :
                        projectStat.overallCompletionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {projectStat.overallCompletionRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          projectStat.overallCompletionRate >= 80 ? 'bg-green-500' :
                          projectStat.overallCompletionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${projectStat.overallCompletionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left group"
            >
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">View All Projects</div>
                <div className="text-sm text-gray-500">Manage projects</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/wa-monitor')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-all text-left group"
            >
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">WA Monitor</div>
                <div className="text-sm text-gray-500">Review QA submissions</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/projects/new')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-all text-left group"
            >
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
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
