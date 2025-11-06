/**
 * WA Monitor Dashboard Component
 * Main dashboard for WhatsApp QA drop monitoring
 * Features: Auto-refresh, summary cards, data grid, export
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Alert, Button, Card, CardContent, Grid, Typography, Box, CircularProgress } from '@mui/material';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';
import { fetchAllDrops } from '../services/waMonitorApiService';
import { downloadCSV } from '../utils/waMonitorHelpers';
import { QaReviewCard } from './QaReviewCard';
import { WaMonitorFilters, type FilterState } from './WaMonitorFilters';
import type { QaReviewDrop, WaMonitorSummary } from '../types/wa-monitor.types';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export function WaMonitorDashboard() {
  const [drops, setDrops] = useState<QaReviewDrop[]>([]);
  const [summary, setSummary] = useState<WaMonitorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterState>({ status: 'all', searchTerm: '' });

  // Fetch data function
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const { drops: fetchedDrops, summary: fetchedSummary } = await fetchAllDrops();
      setDrops(fetchedDrops);
      setSummary(fetchedSummary || null);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching drops:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch drops');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false); // Don't show loading spinner for auto-refresh
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchData();
  };

  // Export handler
  const handleExport = () => {
    downloadCSV(drops);
  };

  // Handle drop update
  const handleDropUpdate = async (dropId: string, updates: Partial<QaReviewDrop>) => {
    try {
      // Call API to update drop
      const response = await fetch(`/api/wa-monitor-drops/${dropId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update drop');

      // Refresh data
      await fetchData(false);
    } catch (error) {
      console.error('Error updating drop:', error);
      throw error;
    }
  };

  // Handle send feedback
  const handleSendFeedback = async (dropId: string, dropNumber: string, message: string) => {
    try {
      // Call API to send feedback
      const response = await fetch('/api/wa-monitor-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropId, dropNumber, message }),
      });

      if (!response.ok) throw new Error('Failed to send feedback');

      // Refresh data
      await fetchData(false);
    } catch (error) {
      console.error('Error sending feedback:', error);
      throw error;
    }
  };

  // Filter drops based on current filters
  const filteredDrops = useMemo(() => {
    return drops.filter((drop) => {
      // Filter by status
      if (filters.status !== 'all' && drop.status !== filters.status) {
        return false;
      }

      // Filter by search term (drop number)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return drop.dropNumber.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }, [drops, filters]);

  // Handle filter change
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WA Monitor Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Live monitoring of WhatsApp QA review drops
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download size={18} />}
            onClick={handleExport}
            disabled={drops.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Last refresh time */}
      {lastRefresh && (
        <Typography variant="caption" color="textSecondary">
          Last updated: {lastRefresh.toLocaleTimeString()} (Auto-refresh every 30s)
        </Typography>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" icon={<AlertCircle size={20} />}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Drops
                </Typography>
                <Typography variant="h4" component="div">
                  {summary.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Incomplete
                </Typography>
                <Typography variant="h4" component="div" color="error">
                  {summary.incomplete}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Complete
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {summary.complete}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Feedback
                </Typography>
                <Typography variant="h4" component="div">
                  {summary.totalFeedback}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      {drops.length > 0 && (
        <WaMonitorFilters
          onFilterChange={handleFilterChange}
          totalCount={drops.length}
          filteredCount={filteredDrops.length}
        />
      )}

      {/* QA Review Cards */}
      {loading && drops.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      ) : drops.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="textSecondary" textAlign="center">
              No drops to review
            </Typography>
          </CardContent>
        </Card>
      ) : filteredDrops.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="textSecondary" textAlign="center">
              No drops match your filters. Try adjusting your search or filter criteria.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {filteredDrops.map((drop) => (
            <QaReviewCard
              key={drop.id}
              drop={drop}
              onUpdate={handleDropUpdate}
              onSendFeedback={handleSendFeedback}
            />
          ))}
        </Box>
      )}
    </div>
  );
}
