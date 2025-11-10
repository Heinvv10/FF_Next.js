/**
 * WA Monitor Dashboard Component
 * Main dashboard for WhatsApp QA drop monitoring
 * Features: Auto-refresh, summary cards, data grid, export
 */

'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { Alert, Button, Card, CardContent, Grid, Typography, Box, CircularProgress, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { RefreshCw, Download, AlertCircle, Calendar } from 'lucide-react';
import { fetchAllDrops, sendFeedbackToWhatsApp, fetchDailyDropsPerProject } from '../services/waMonitorApiService';
import { downloadCSV } from '../utils/waMonitorHelpers';
import { QaReviewCard } from './QaReviewCard';
import { WaMonitorFilters, type FilterState } from './WaMonitorFilters';
import type { QaReviewDrop, WaMonitorSummary, DailyDropsPerProject } from '../types/wa-monitor.types';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
const ITEMS_PER_PAGE = 20; // Show 20 drops per page

export function WaMonitorDashboard() {
  const [drops, setDrops] = useState<QaReviewDrop[]>([]);
  const [summary, setSummary] = useState<WaMonitorSummary | null>(null);
  const [dailyDrops, setDailyDrops] = useState<{ drops: DailyDropsPerProject[]; total: number; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterState>({ status: 'all', searchTerm: '', resubmitted: 'all', project: undefined });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data function
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Fetch both regular drops and daily drops in parallel
      const [
        { drops: fetchedDrops, summary: fetchedSummary },
        dailyDropsData
      ] = await Promise.all([
        fetchAllDrops(),
        fetchDailyDropsPerProject()
      ]);

      setDrops(fetchedDrops);
      setSummary(fetchedSummary || null);
      setDailyDrops(dailyDropsData);
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

  // Handle send feedback - sends to WhatsApp and updates database
  const handleSendFeedback = async (dropId: string, dropNumber: string, message: string, project?: string) => {
    try {
      // Send feedback to WhatsApp group (defaults to Velo Test for testing)
      const result = await sendFeedbackToWhatsApp(dropId, dropNumber, message, project);

      if (!result.success) {
        throw new Error(result.message || 'Failed to send feedback');
      }

      console.log('✅ Feedback sent:', result.message);

      // Refresh data to show updated feedback_sent timestamp
      await fetchData(false);
    } catch (error) {
      console.error('Error sending feedback:', error);
      throw error;
    }
  };

  // Get unique projects from drops
  const availableProjects = useMemo(() => {
    const projects = drops
      .map((drop) => drop.project)
      .filter((project): project is string => project !== null && project !== undefined && project !== '');
    return Array.from(new Set(projects)).sort();
  }, [drops]);

  // Filter drops based on current filters
  const filteredDrops = useMemo(() => {
    return drops.filter((drop) => {
      // Filter by status
      if (filters.status !== 'all' && drop.status !== filters.status) {
        return false;
      }

      // Filter by resubmitted
      if (filters.resubmitted && filters.resubmitted !== 'all') {
        if (filters.resubmitted === 'resubmitted' && !drop.resubmitted) {
          return false;
        }
        if (filters.resubmitted === 'not_resubmitted' && drop.resubmitted) {
          return false;
        }
      }

      // Filter by project
      if (filters.project && filters.project !== 'all') {
        if (drop.project !== filters.project) {
          return false;
        }
      }

      // Filter by search term (drop number)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return drop.dropNumber.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }, [drops, filters]);

  // Paginate filtered drops
  const paginatedDrops = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredDrops.slice(startIndex, endIndex);
  }, [filteredDrops, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredDrops.length / ITEMS_PER_PAGE);

  // Handle filter change
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
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

      {/* Daily Drops Per Project */}
      {dailyDrops && dailyDrops.drops.length > 0 && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Calendar size={20} />
                <Typography variant="h6" component="h2">
                  Today's Submissions ({dailyDrops.date})
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Auto-syncs to SharePoint daily at 8pm SAST
              </Typography>
            </Box>

            {/* Informational Note about Data Accuracy */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Accurate Daily Counts:</strong> Shows submissions by actual WhatsApp message date, not database processing time.
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Note: Historical batch processing (e.g., old messages processed today) are excluded from today's count.
                Only drops submitted via WhatsApp <strong>today</strong> are shown. Previous issue where 27 historical drops
                inflated the count has been resolved (Nov 6, 2025).
              </Typography>
            </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Project</strong></TableCell>
                    <TableCell align="right"><strong>Drops Submitted</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dailyDrops.drops.map((item) => (
                    <TableRow key={item.project}>
                      <TableCell>{item.project}</TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          {item.count}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        <strong>{dailyDrops.total}</strong>
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {drops.length > 0 && (
        <WaMonitorFilters
          onFilterChange={handleFilterChange}
          totalCount={drops.length}
          filteredCount={filteredDrops.length}
          availableProjects={availableProjects}
        />
      )}

      {/* Pagination Info */}
      {filteredDrops.length > 0 && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredDrops.length)} of {filteredDrops.length} drops
        </Typography>
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
        <>
          <Box>
            {paginatedDrops.map((drop) => (
              <QaReviewCard
                key={drop.id}
                drop={drop}
                onUpdate={handleDropUpdate}
                onSendFeedback={handleSendFeedback}
              />
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
    </div>
  );
}
