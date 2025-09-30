import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, Clock as PendingIcon, AlertTriangle, Target } from 'lucide-react';
import { TaskFilters, TaskFilters as TaskFiltersType } from '@/modules/tasks/components/TaskFilters';
import { TaskAnalytics } from '@/modules/tasks/components/TaskAnalytics';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  technicianName?: string;
  scheduledDate: string;
  location?: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  estimatedDuration?: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    highPriorityTasks: number;
  } | null>(null);
  const [filters, setFilters] = useState<TaskFiltersType>({
    search: '',
    technicianId: '',
    status: '',
    priority: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    limit: 24,
    offset: 0
  });
  const [activeTab, setActiveTab] = useState<'tasks' | 'analytics'>('tasks');

  useEffect(() => {
    fetchTasks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTasks();
    }, 300); // Debounce to match TaskFilters

    return () => clearTimeout(timeoutId);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTasks = async (customFilters?: TaskFiltersType) => {
    try {
      setLoading(true);
      const currentFilters = customFilters || filters;

      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 0) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/field/tasks?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.data || []);

      // Set statistics from API response
      if (data.meta?.stats) {
        setStats(data.meta.stats);
      } else {
        // Fallback: calculate stats from tasks if not provided by API
        const calculatedStats = {
          totalTasks: data.data?.length || 0,
          pendingTasks: data.data?.filter((t: Task) => t.status === 'pending').length || 0,
          inProgressTasks: data.data?.filter((t: Task) => t.status === 'in_progress').length || 0,
          completedTasks: data.data?.filter((t: Task) => t.status === 'completed').length || 0,
          highPriorityTasks: data.data?.filter((t: Task) => t.priority === 'high' || t.priority === 'urgent').length || 0,
        };
        setStats(calculatedStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      technicianId: '',
      status: '',
      priority: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      limit: 24,
      offset: 0
    };
    setFilters(clearedFilters);
    fetchTasks(clearedFilters);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="mt-4 text-red-600">{error}</p>
            <Button onClick={fetchTasks} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Field Tasks</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => fetchTasks()} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Task Management
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics & Insights
              <Badge variant="secondary" className="text-xs">
                {tasks.length}
              </Badge>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' ? (
          <>
            {/* Task Filters */}
            <TaskFilters
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              initialFilters={filters}
            />

        {/* Statistics Dashboard */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{stats.pendingTasks}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <PendingIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold">{stats.inProgressTasks}</p>
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
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold">{stats.highPriorityTasks}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completion Rate Card */}
          <Card className="md:col-span-2 lg:col-span-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-lg font-bold">
                      {stats.totalTasks > 0
                        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{stats.completedTasks} completed</span>
                    <span>{stats.totalTasks} total</span>
                  </div>
                </div>
                <div className="bg-green-100 p-3 rounded-full ml-6">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          </>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                <Badge className={getStatusColor(task.status)} variant="secondary">
                  {task.status.replace('_', ' ')}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {task.technicianName && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{task.technicianName}</span>
                    </div>
                  )}
                  
                  {task.scheduledDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(task.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {task.estimatedDuration && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{task.estimatedDuration} hours</span>
                    </div>
                  )}
                  
                  {task.location?.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{task.location.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tasks found</p>
          </div>
        )}
          </>
        ) : (
          /* Analytics Tab */
          <TaskAnalytics
            tasks={tasks}
            onExportReport={() => {
              // TODO: Implement export functionality
              alert('Export functionality would be implemented here');
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Use ISR for better performance and to avoid client-side database access
export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 60, // Revalidate every 60 seconds
  };
};