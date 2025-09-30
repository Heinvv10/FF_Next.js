import { FolderOpen, CheckCircle, Clock, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

interface ProjectSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  onHoldProjects: number;
  highPriorityProjects: number;
}

interface ProjectSummaryCardsProps {
  summary?: ProjectSummary;
  projects?: any[];
}

export function ProjectSummaryCards({ summary, projects = [] }: ProjectSummaryCardsProps) {
  // Calculate summary from projects if not provided
  const calculatedSummary = summary || {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active' || p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length,
    completedProjects: projects.filter(p => p.status === 'completed' || p.status === 'COMPLETED').length,
    totalBudget: projects.reduce((sum, p) => sum + (Number(p.budget_allocated) || 0), 0),
    onHoldProjects: projects.filter(p => p.status === 'on-hold' || p.status === 'ON_HOLD').length,
    highPriorityProjects: projects.filter(p => p.priority === 'high' || p.priority === 'HIGH' || p.priority === 'critical' || p.priority === 'CRITICAL').length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Projects</p>
            <p className="text-2xl font-bold text-gray-900">{calculatedSummary.totalProjects}</p>
          </div>
          <FolderOpen className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Projects</p>
            <p className="text-2xl font-bold text-gray-900">{calculatedSummary.activeProjects}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{calculatedSummary.completedProjects}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">On Hold</p>
            <p className="text-2xl font-bold text-gray-900">{calculatedSummary.onHoldProjects}</p>
          </div>
          <Clock className="h-8 w-8 text-yellow-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(calculatedSummary.totalBudget)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-purple-500" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">High Priority</p>
            <p className="text-2xl font-bold text-gray-900">{calculatedSummary.highPriorityProjects}</p>
          </div>
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
      </div>
    </div>
  );
}