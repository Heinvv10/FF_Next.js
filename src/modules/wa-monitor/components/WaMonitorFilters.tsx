/**
 * WA Monitor Filters Component
 * Search and filter controls for QA review drops
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  InputAdornment,
} from '@mui/material';
import { Search, X } from 'lucide-react';
import type { DropStatus } from '../types/wa-monitor.types';

interface WaMonitorFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export interface FilterState {
  status: DropStatus | 'all';
  searchTerm: string;
  resubmitted?: 'all' | 'resubmitted' | 'not_resubmitted';
}

export function WaMonitorFilters({ onFilterChange, totalCount, filteredCount }: WaMonitorFiltersProps) {
  const [status, setStatus] = useState<DropStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [resubmitted, setResubmitted] = useState<'all' | 'resubmitted' | 'not_resubmitted'>('all');

  const handleStatusChange = (newStatus: DropStatus | 'all') => {
    setStatus(newStatus);
    onFilterChange({ status: newStatus, searchTerm, resubmitted });
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    onFilterChange({ status, searchTerm: newSearchTerm, resubmitted });
  };

  const handleResubmittedChange = (newResubmitted: 'all' | 'resubmitted' | 'not_resubmitted') => {
    setResubmitted(newResubmitted);
    onFilterChange({ status, searchTerm, resubmitted: newResubmitted });
  };

  const handleClearFilters = () => {
    setStatus('all');
    setSearchTerm('');
    setResubmitted('all');
    onFilterChange({ status: 'all', searchTerm: '', resubmitted: 'all' });
  };

  const hasActiveFilters = status !== 'all' || searchTerm !== '' || resubmitted !== 'all';

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          {/* Search by Drop Number */}
          <TextField
            size="small"
            placeholder="Search drop number..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
          />

          {/* Filter by Status */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => handleStatusChange(e.target.value as DropStatus | 'all')}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="incomplete">🔴 Incomplete</MenuItem>
              <MenuItem value="complete">🟢 Complete</MenuItem>
            </Select>
          </FormControl>

          {/* Filter by Resubmitted */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Resubmission</InputLabel>
            <Select
              value={resubmitted}
              label="Resubmission"
              onChange={(e) => handleResubmittedChange(e.target.value as 'all' | 'resubmitted' | 'not_resubmitted')}
            >
              <MenuItem value="all">All Drops</MenuItem>
              <MenuItem value="resubmitted">🔄 Resubmitted Only</MenuItem>
              <MenuItem value="not_resubmitted">New Drops Only</MenuItem>
            </Select>
          </FormControl>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<X size={16} />}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}

          {/* Results Count */}
          <Box flex={1} display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
            <Chip
              label={`Showing ${filteredCount} of ${totalCount} drops`}
              size="small"
              color={filteredCount === totalCount ? 'default' : 'primary'}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
