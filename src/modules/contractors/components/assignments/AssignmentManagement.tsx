/**
 * AssignmentManagement Component - Project assignment workflow system
 * Following FibreFlow patterns with comprehensive assignment management
 */

import { useState, useEffect } from 'react';
import { Plus, Briefcase, Calendar, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { contractorClientService } from '@/services/contractor/contractorClientService';
import { ProjectAssignment, ContractorTeam } from '@/types/contractor.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AssignmentForm } from './AssignmentForm';
import { AssignmentDetail } from './AssignmentDetail';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

interface AssignmentManagementProps {
  contractorId: string;
  contractorName: string;
}

export function AssignmentManagement({ contractorId, contractorName }: AssignmentManagementProps) {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [teams, setTeams] = useState<ContractorTeam[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<ProjectAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'assigned' | 'active' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadData();
  }, [contractorId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Note: These would be actual API calls in production
      // For now, we'll simulate the data structure
      const [assignmentsData, teamsData] = await Promise.all([
        // contractorService.assignments.getByContractor(contractorId),
        // contractorService.teams.getTeamsByContractor(contractorId)
        Promise.resolve([]), // Placeholder
        contractorService.teams.getTeamsByContractor(contractorId)
      ]);
      
      setAssignments(assignmentsData);
      setTeams(teamsData);
    } catch (error) {
      log.error('Failed to load assignment data:', { data: error }, 'AssignmentManagement');
      toast.error('Failed to load assignment data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      on_hold: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Clock className="w-4 h-4" />;
      case 'active':
        return <TrendingUp className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (activeFilter === 'all') return true;
    return assignment.status === activeFilter;
  });

  const getAssignmentStats = () => {
    return {
      total: assignments.length,
      assigned: assignments.filter(a => a.status === 'assigned').length,
      active: assignments.filter(a => a.status === 'active').length,
      completed: assignments.filter(a => a.status === 'completed').length,
      totalValue: assignments.reduce((sum, a) => sum + a.contractValue, 0),
      completedValue: assignments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + a.contractValue, 0),
    };
  };

  const stats = getAssignmentStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" label="Loading assignments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Project Assignments</h2>
          <p className="text-gray-600">Manage project assignments for {contractorName}</p>
        </div>
        <button
          onClick={() => setShowAssignmentForm(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                R {stats.totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {['all', 'assigned', 'active', 'completed', 'cancelled'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as typeof activeFilter)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeFilter === filter
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
            {filter !== 'all' && (
              <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1 rounded">
                {assignments.filter(a => a.status === filter).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Assignments ({filteredAssignments.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredAssignments.length === 0 ? (
              <div className="p-6 text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No assignments found</p>
                <button
                  onClick={() => setShowAssignmentForm(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first assignment
                </button>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedAssignment?.id === assignment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Project {assignment.projectId}</h4>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                      {getStatusIcon(assignment.status)}
                      <span className="ml-1">{assignment.status.toUpperCase()}</span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{assignment.scope}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(assignment.startDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center text-gray-500">
                        <DollarSign className="w-4 h-4 mr-1" />
                        R {assignment.contractValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Progress</div>
                      <div className="text-sm font-medium text-gray-900">{assignment.progressPercentage}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${assignment.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assignment Detail */}
        <div className="bg-white rounded-lg border border-gray-200">
          {selectedAssignment ? (
            <AssignmentDetail 
              assignment={selectedAssignment}
              teams={teams}
              onUpdate={loadData}
            />
          ) : (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignment Selected</h3>
              <p className="text-gray-600">Select an assignment from the list to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <AssignmentForm
          teams={teams}
          onSubmit={async (_data) => {
            // Handle assignment creation

            setShowAssignmentForm(false);
            loadData();
          }}
          onCancel={() => setShowAssignmentForm(false)}
        />
      )}
    </div>
  );
}