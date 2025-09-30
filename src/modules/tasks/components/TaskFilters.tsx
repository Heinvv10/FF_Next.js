'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/components/ui/Select';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';

interface TaskFiltersProps {
  onFiltersChange: (filters: TaskFilters) => void;
  onClearFilters: () => void;
  initialFilters?: Partial<TaskFilters>;
}

export interface TaskFilters {
  search: string;
  technicianId: string;
  status: string;
  priority: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  limit: number;
  offset: number;
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const priorityOptions = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const categoryOptions = [
  { value: 'installation', label: 'Installation' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inspection', label: 'Inspection' }
];

const limitOptions = [
  { value: '12', label: '12 per page' },
  { value: '24', label: '24 per page' },
  { value: '48', label: '48 per page' },
  { value: '96', label: '96 per page' }
];

export function TaskFilters({ onFiltersChange, onClearFilters, initialFilters }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    technicianId: '',
    status: '',
    priority: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    limit: 24,
    offset: 0,
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value =>
    value !== '' && value !== null && value !== undefined && value !== 0
  ).length - 1; // Exclude limit from count

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(filters);
    }, 300); // Debounce for better performance

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof TaskFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
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
    onClearFilters();
    setIsExpanded(false);
  };

  return (
    <div className="space-y-4">
      {/* Search and Main Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4" />
                Status
              </label>
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <AlertTriangle className="h-4 w-4" />
                Priority
              </label>
              <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  {priorityOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4" />
                Category
              </label>
              <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Technician Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                Technician
              </label>
              <Input
                type="text"
                placeholder="Technician ID"
                value={filters.technicianId}
                onChange={(e) => updateFilter('technicianId', e.target.value)}
              />
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                Date From
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                Date To
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Results per page */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Results per page:</span>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => updateFilter('limit', parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {limitOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.status && (
            <Badge variant="outline" className="gap-1">
              Status: {statusOptions.find(s => s.value === filters.status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('status', '')}
              />
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="outline" className="gap-1">
              Priority: {priorityOptions.find(p => p.value === filters.priority)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('priority', '')}
              />
            </Badge>
          )}
          {filters.category && (
            <Badge variant="outline" className="gap-1">
              Category: {categoryOptions.find(c => c.value === filters.category)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('category', '')}
              />
            </Badge>
          )}
          {filters.technicianId && (
            <Badge variant="outline" className="gap-1">
              Technician: {filters.technicianId}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('technicianId', '')}
              />
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="outline" className="gap-1">
              Date Range
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  updateFilter('dateFrom', '');
                  updateFilter('dateTo', '');
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}