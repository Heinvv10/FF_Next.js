'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Target,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  technicianName?: string;
  scheduledDate: string;
  estimatedDuration?: number;
  location?: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  completedAt?: string;
  createdAt: string;
}

interface TaskAnalyticsProps {
  tasks: Task[];
  onExportReport?: () => void;
}

interface AnalyticsData {
  completionRate: number;
  averageCompletionTime: number;
  technicianPerformance: Array<{
    technicianId: string;
    technicianName: string;
    completedTasks: number;
    averageTime: number;
    efficiency: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    color: string;
  }>;
  statusTrends: Array<{
    date: string;
    completed: number;
    pending: number;
    inProgress: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    total: number;
    completed: number;
    successRate: number;
  }>;
  locationInsights: Array<{
    area: string;
    taskCount: number;
    completionRate: number;
  }>;
}

const COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  completed: '#22c55e',
  pending: '#eab308',
  inProgress: '#3b82f6',
  cancelled: '#6b7280'
};

export function TaskAnalytics({ tasks, onExportReport }: TaskAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    calculateAnalytics();
  }, [tasks, timeRange]);

  const calculateAnalytics = () => {
    if (!tasks.length) {
      setAnalytics(null);
      setLoading(false);
      return;
    }

    const now = new Date();
    const timeRangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000);

    const filteredTasks = tasks.filter(task =>
      new Date(task.createdAt) >= cutoffDate
    );

    // Completion Rate
    const completedTasks = filteredTasks.filter(task => task.status === 'completed');
    const completionRate = filteredTasks.length > 0
      ? (completedTasks.length / filteredTasks.length) * 100
      : 0;

    // Average completion time (in hours)
    const completionTimes = completedTasks
      .filter(task => task.completedAt)
      .map(task => {
        const start = new Date(task.createdAt);
        const end = new Date(task.completedAt!);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      });
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      : 0;

    // Technician Performance
    const technicianMap = new Map();
    filteredTasks.forEach(task => {
      if (task.technicianName) {
        if (!technicianMap.has(task.technicianName)) {
          technicianMap.set(task.technicianName, {
            technicianId: task.assignedTo || '',
            technicianName: task.technicianName,
            completedTasks: 0,
            totalTime: 0,
            taskCount: 0
          });
        }
        const tech = technicianMap.get(task.technicianName);
        tech.taskCount++;
        if (task.status === 'completed' && task.completedAt) {
          tech.completedTasks++;
          const duration = (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
          tech.totalTime += duration;
        }
      }
    });

    const technicianPerformance = Array.from(technicianMap.values())
      .filter(tech => tech.completedTasks > 0)
      .map(tech => ({
        technicianId: tech.technicianId,
        technicianName: tech.technicianName,
        completedTasks: tech.completedTasks,
        averageTime: tech.totalTime / tech.completedTasks,
        efficiency: (tech.completedTasks / tech.taskCount) * 100
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    // Priority Distribution
    const priorityCount = filteredTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityDistribution = [
      { priority: 'urgent', count: priorityCount.urgent || 0, color: COLORS.urgent },
      { priority: 'high', count: priorityCount.high || 0, color: COLORS.high },
      { priority: 'medium', count: priorityCount.medium || 0, color: COLORS.medium },
      { priority: 'low', count: priorityCount.low || 0, color: COLORS.low }
    ].filter(item => item.count > 0);

    // Status Trends (last 30 days)
    const statusTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      });

      statusTrends.push({
        date: dateStr,
        completed: dayTasks.filter(t => t.status === 'completed').length,
        pending: dayTasks.filter(t => t.status === 'pending').length,
        inProgress: dayTasks.filter(t => t.status === 'in_progress').length
      });
    }

    // Category Performance
    const categoryMap = new Map();
    filteredTasks.forEach(task => {
      const category = task.estimatedDuration ? (task.estimatedDuration > 4 ? 'Complex' : 'Simple') : 'Unknown';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, completed: 0 });
      }
      const cat = categoryMap.get(category);
      cat.total++;
      if (task.status === 'completed') {
        cat.completed++;
      }
    });

    const categoryPerformance = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      completed: data.completed,
      successRate: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }));

    // Location Insights
    const locationMap = new Map();
    filteredTasks.forEach(task => {
      if (task.location?.address) {
        const area = task.location.address.split(',')[0].trim();
        if (!locationMap.has(area)) {
          locationMap.set(area, { taskCount: 0, completed: 0 });
        }
        const loc = locationMap.get(area);
        loc.taskCount++;
        if (task.status === 'completed') {
          loc.completed++;
        }
      }
    });

    const locationInsights = Array.from(locationMap.entries())
      .map(([area, data]) => ({
        area,
        taskCount: data.taskCount,
        completionRate: data.taskCount > 0 ? (data.completed / data.taskCount) * 100 : 0
      }))
      .sort((a, b) => b.taskCount - a.taskCount)
      .slice(0, 10);

    setAnalytics({
      completionRate,
      averageCompletionTime,
      technicianPerformance,
      priorityDistribution,
      statusTrends,
      categoryPerformance,
      locationInsights
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Calculating analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600">No data available for analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Task Analytics & Performance</h2>
        <div className="flex items-center gap-4">
          <div className="flex rounded-md shadow-sm">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium border ${
                  timeRange === range
                    ? 'bg-blue-50 border-blue-500 text-blue-700 z-10'
                    : 'bg-white border-gray-300 text-gray-500 hover:text-gray-700'
                } ${
                  range === '7d' ? 'rounded-l-md' : range === '90d' ? 'rounded-r-md' : ''
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          {onExportReport && (
            <Button onClick={onExportReport} variant="outline">
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
                {analytics.completionRate > 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Completion Time</p>
                <p className="text-2xl font-bold">{analytics.averageCompletionTime.toFixed(1)}h</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Technicians</p>
                <p className="text-2xl font-bold">{analytics.technicianPerformance.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks Analyzed</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Status Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.statusTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  stroke={COLORS.completed}
                  fill={COLORS.completed}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="inProgress"
                  stackId="2"
                  stroke={COLORS.inProgress}
                  fill={COLORS.inProgress}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="3"
                  stroke={COLORS.pending}
                  fill={COLORS.pending}
                  fillOpacity={0.6}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.priorityDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ priority, count }) => `${priority}: ${count}`}
                >
                  {analytics.priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Technician Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Technician Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.technicianPerformance.slice(0, 5).map((tech, index) => (
                <div key={tech.technicianId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{tech.technicianName}</p>
                      <p className="text-sm text-gray-600">{tech.completedTasks} tasks completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={tech.efficiency > 80 ? 'default' : tech.efficiency > 60 ? 'secondary' : 'destructive'}>
                      {tech.efficiency.toFixed(1)}% efficiency
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      {tech.averageTime.toFixed(1)}h avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Task Complexity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill={COLORS.pending} name="Total Tasks" />
                <Bar dataKey="completed" fill={COLORS.completed} name="Completed" />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geographic Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {analytics.locationInsights.map((location, index) => (
              <div key={location.area} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{location.area}</span>
                  <Badge variant="outline">
                    {location.taskCount} tasks
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${location.completionRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {location.completionRate.toFixed(1)}% completion rate
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}