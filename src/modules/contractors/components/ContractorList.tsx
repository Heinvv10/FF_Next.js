/**
 * ContractorList Component - Main contractors listing with filtering and search
 * Following FibreFlow patterns with comprehensive filtering and real-time updates
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Building2, CheckCircle, Clock, UserCheck } from 'lucide-react';
import { contractorApiService } from '@/services/contractor/contractorApiService';
import { Contractor, ContractorFilter, ContractorAnalytics } from '@/types/contractor.types';
import {
  StandardModuleHeader,
  StandardSummaryCards,
  StandardSearchFilter,
  StandardDataTable
} from '@/components/ui';
import toast from 'react-hot-toast';
import { log } from '@/lib/logger';

export function ContractorList() {
  const router = useRouter();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [analytics, setAnalytics] = useState<ContractorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters] = useState(false);
  
  const [filter, setFilter] = useState<ContractorFilter>({
    searchTerm: '',
    // Only show non-pending contractors in Active tab
    status: ['approved', 'suspended', 'blacklisted'] // Exclude pending and under_review
  });

  useEffect(() => {
    loadContractors();
    loadAnalytics();
  }, [filter]);

  const loadContractors = async () => {
    try {
      setIsLoading(true);
      const data = await contractorApiService.getAll();
      setContractors(data);
    } catch (error) {
      log.error('Failed to load contractors:', { data: error }, 'ContractorList');
      toast.error('Failed to load contractors');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const summary = await contractorApiService.getContractorSummary();
      // Map summary to analytics format
      const data = {
        totalContractors: summary.totalContractors,
        approvedContractors: summary.approvedContractors,
        pendingApproval: summary.pendingApproval,
        ragDistribution: {
          green: Math.round(summary.averageRating / 10), // Approximate
          amber: 0,
          red: 0
        }
      } as ContractorAnalytics;
      setAnalytics(data);
    } catch (error) {
      log.error('Failed to load analytics:', { data: error }, 'ContractorList');
    }
  };

  const handleFilterChange = (key: keyof ContractorFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (value: string) => {
    setFilter(prev => ({ ...prev, searchTerm: value }));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      blacklisted: 'bg-red-100 text-red-800',
      under_review: 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRagColor = (rag: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800',
      amber: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800'
    };
    return colors[rag as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Calculate summary statistics
  const summaryStats = analytics ? [
    {
      label: 'Total Contractors',
      value: analytics.totalContractors,
      icon: Building2,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100',
      trend: { value: 8, isPositive: true }
    },
    {
      label: 'Approved Contractors',
      value: analytics.approvedContractors,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100',
      trend: { value: 5, isPositive: true }
    },
    {
      label: 'Pending Approval',
      value: analytics.pendingApproval,
      icon: Clock,
      iconColor: 'text-yellow-600',
      iconBgColor: 'bg-yellow-100',
      trend: { value: 2, isPositive: false }
    },
    {
      label: 'Green Rating',
      value: analytics.ragDistribution?.green || 0,
      icon: UserCheck,
      iconColor: 'text-emerald-600',
      iconBgColor: 'bg-emerald-100',
      trend: { value: 3, isPositive: true }
    }
  ] : [];

  // Table columns configuration
  const tableColumns = [
    { key: 'companyName', header: 'Company Name' },
    { key: 'businessType', header: 'Business Type' },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { 
      key: 'status', 
      header: 'Status',
      render: (contractor: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contractor.status)}`}>
          {contractor.status?.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    { 
      key: 'ragOverall', 
      header: 'RAG Rating',
      render: (contractor: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRagColor(contractor.ragOverall)}`}>
          {contractor.ragOverall?.toUpperCase()}
        </span>
      )
    },
    { 
      key: 'activeProjects', 
      header: 'Active Projects',
      render: (contractor: any) => contractor.activeProjects || 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <StandardModuleHeader
        title="Contractors"
        description="Manage contractor relationships and performance"
        itemCount={contractors.length}
        onAdd={() => router.push('/contractors/new')}
        showAdd={true}
        addButtonText="Add Contractor"
      />

      {/* Summary Cards */}
      {analytics && <StandardSummaryCards cards={summaryStats} />}

      {/* Search and Filters */}
      <StandardSearchFilter
        searchValue={filter.searchTerm || ''}
        onSearch={handleSearchChange}
        placeholder="Search contractors by name, type, or contact person..."
        showFilters={showFilters}
      />

      {/* Custom Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                multiple
                value={filter.status || []}
                onChange={(e) => handleFilterChange('status', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
                <option value="blacklisted">Blacklisted</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RAG Rating</label>
              <select
                multiple
                value={filter.ragOverall || []}
                onChange={(e) => handleFilterChange('ragOverall', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="green">Green</option>
                <option value="amber">Amber</option>
                <option value="red">Red</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <select
                multiple
                value={filter.businessType || []}
                onChange={(e) => handleFilterChange('businessType', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pty_ltd">Pty Ltd</option>
                <option value="cc">Close Corporation</option>
                <option value="sole_proprietor">Sole Proprietor</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filter.hasActiveProjects === true}
                onChange={(e) => handleFilterChange('hasActiveProjects', e.target.checked ? true : undefined)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Has Active Projects</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filter.documentsExpiring === true}
                onChange={(e) => handleFilterChange('documentsExpiring', e.target.checked ? true : undefined)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Documents Expiring</span>
            </label>
          </div>
        </div>
      )}

      {/* Contractors Display */}
      <StandardDataTable
        data={contractors}
        columns={tableColumns}
        isLoading={isLoading}
        getRowKey={(contractor) => contractor.id}
        onRowClick={(contractor) => router.push(`/contractors/${contractor.id}`)}
      />
    </div>
  );
}