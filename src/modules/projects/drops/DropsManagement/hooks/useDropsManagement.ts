import { useState, useEffect, useCallback } from 'react';
import type { Drop, DropsStats, DropsFiltersState } from '../types/drops.types';

// Simple cache key generator
const getCacheKey = (page: number, filters: DropsFiltersState) => {
  return `drops_${page}_${filters.statusFilter}_${filters.searchTerm}`;
};

// Simple in-memory cache
const dropsCache = new Map<string, { data: Drop[]; timestamp: number; total: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useDropsManagement() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DropsStats>({
    totalDrops: 0,
    completedDrops: 0,
    pendingDrops: 0,
    inProgressDrops: 0,
    failedDrops: 0,
    completionRate: 0,
    averageInstallTime: 0,
    totalCableUsed: 0,
  });
  const [allDropsStats, setAllDropsStats] = useState<DropsStats>({
    totalDrops: 0,
    completedDrops: 0,
    pendingDrops: 0,
    inProgressDrops: 0,
    failedDrops: 0,
    completionRate: 0,
    averageInstallTime: 0,
    totalCableUsed: 0,
  });
  const [filters, setFilters] = useState<DropsFiltersState>({
    searchTerm: '',
    statusFilter: 'all',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 100, // Reduced for better performance
    totalItems: 0,
    totalPages: 0,
  });
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchDropsData();
    fetchAllDropsStats();
  }, []);

  const fetchAllDropsStats = async () => {
    try {
      // Get overall statistics for all drops
      const response = await fetch('/api/sow/drops/stats');
      const result = await response.json();

      if (result.success) {
        setAllDropsStats(result.stats);
      } else {
        // Fallback: use the API total count
        const countResponse = await fetch('/api/sow/drops?limit=1');
        const countResult = await countResponse.json();
        if (countResult.success) {
          setAllDropsStats(prev => ({
            ...prev,
            totalDrops: countResult.total || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching all drops stats:', error);
    }
  };

  const fetchDropsData = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      // Check cache first
      const cacheKey = getCacheKey(page, filters);
      const cached = dropsCache.get(cacheKey);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        // Use cached data
        const transformedDrops = cached.data;

        if (append) {
          setDrops(prev => [...prev, ...transformedDrops]);
        } else {
          setDrops(transformedDrops);
        }

        calculateStats(append ? [...drops, ...transformedDrops] : transformedDrops);

        const totalPages = Math.ceil(cached.total / pagination.pageSize);
        const hasMoreItems = page < totalPages;

        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalItems: cached.total,
          totalPages,
        }));

        setHasMore(hasMoreItems);

        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
        return;
      }

      // Fetch from API if not cached or cache expired
      const offset = (page - 1) * pagination.pageSize;
      const response = await fetch(`/api/sow/drops?limit=${pagination.pageSize}&offset=${offset}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch drops');
      }

      if (result.success && Array.isArray(result.data)) {
        // Transform database records to Drop format
        const transformedDrops: Drop[] = result.data.map((dbDrop: any) => ({
          id: dbDrop.id,
          dropNumber: dbDrop.drop_number,
          poleNumber: dbDrop.pole_number || '',
          customerName: dbDrop.end_point || 'Unknown Customer',
          address: dbDrop.address || dbDrop.end_point || '',
          status: determineStatus(dbDrop),
          installationType: dbDrop.cable_type || 'aerial',
          cableLength: parseFloat(dbDrop.cable_length) || 0,
          scheduledDate: dbDrop.created_date,
          completedDate: dbDrop.updated_at,
          technician: dbDrop.created_by || 'Unassigned',
          latitude: dbDrop.latitude,
          longitude: dbDrop.longitude,
          municipality: dbDrop.municipality,
          zone: dbDrop.zone_no,
          pon: dbDrop.pon_no,
        }));

        // Cache the result
        dropsCache.set(cacheKey, {
          data: transformedDrops,
          timestamp: now,
          total: result.total || 0
        });

        // Append or replace drops based on the operation
        if (append) {
          setDrops(prev => [...prev, ...transformedDrops]);
        } else {
          setDrops(transformedDrops);
        }

        calculateStats(append ? [...drops, ...transformedDrops] : transformedDrops);

        // Update pagination info
        if (result.total !== undefined) {
          const totalPages = Math.ceil(result.total / pagination.pageSize);
          const hasMoreItems = page < totalPages;

          setPagination(prev => ({
            ...prev,
            currentPage: page,
            totalItems: result.total,
            totalPages,
          }));

          setHasMore(hasMoreItems);
        }
      } else {
        // No data available from API
        if (!append) {
          setDrops([]);
          calculateStats([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching drops:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch drops');
      if (!append) {
        setDrops([]);
        calculateStats([]);
      }
      setHasMore(false);
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const determineStatus = (dbDrop: any): Drop['status'] => {
    // Simple logic to determine status based on available data
    if (dbDrop.completed_date) return 'completed';
    if (dbDrop.technician && dbDrop.scheduled_date) return 'in_progress';
    if (dbDrop.scheduled_date) return 'scheduled';
    return 'pending';
  };

  const calculateStats = (dropsData: Drop[]) => {
    const total = dropsData.length;
    const completed = dropsData.filter(d => d.status === 'completed').length;
    const pending = dropsData.filter(d => d.status === 'pending').length;
    const inProgress = dropsData.filter(d => d.status === 'in_progress').length;
    const failed = dropsData.filter(d => d.status === 'failed').length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const totalCable = dropsData.reduce((sum, d) => sum + d.cableLength, 0);
    
    // Calculate average install time from completed drops
    const completedWithTime = dropsData.filter(
      d => d.status === 'completed' && d.scheduledDate && d.completedDate
    );
    
    let avgTime = 0;
    if (completedWithTime.length > 0) {
      // Simplified: assuming same-day installation for now
      avgTime = 4; // Average 4 hours per installation
    }

    setStats({
      totalDrops: total,
      completedDrops: completed,
      pendingDrops: pending,
      inProgressDrops: inProgress,
      failedDrops: failed,
      completionRate,
      averageInstallTime: avgTime,
      totalCableUsed: totalCable,
    });
  };

  const filteredDrops = drops.filter(drop => {
    const matchesSearch = filters.searchTerm === '' || 
      drop.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      drop.address.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      drop.dropNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      drop.poleNumber.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesStatus = filters.statusFilter === 'all' || drop.status === filters.statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const updateFilters = (newFilters: Partial<DropsFiltersState>) => {
    setFilters((prev: DropsFiltersState) => ({ ...prev, ...newFilters }));
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchDropsData(page);
    }
  };

  const nextPage = () => {
    if (pagination.currentPage < pagination.totalPages) {
      goToPage(pagination.currentPage + 1);
    }
  };

  const prevPage = () => {
    if (pagination.currentPage > 1) {
      goToPage(pagination.currentPage - 1);
    }
  };

  // Load more functionality for infinite scroll
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;

    const nextPage = pagination.currentPage + 1;
    await fetchDropsData(nextPage, true);
  }, [hasMore, loadingMore, loading, pagination.currentPage]);

  // Search functionality
  const searchDrops = async (searchTerm: string, statusFilter: string = 'all') => {
    try {
      setLoading(true);
      setError(null);

      // Build search query
      const searchParams = new URLSearchParams({
        limit: pagination.pageSize.toString(),
        offset: '0',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/sow/drops/search?${searchParams}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to search drops');
      }

      if (result.success && Array.isArray(result.data)) {
        // Transform database records to Drop format
        const transformedDrops: Drop[] = result.data.map((dbDrop: any) => ({
          id: dbDrop.id,
          dropNumber: dbDrop.drop_number,
          poleNumber: dbDrop.pole_number || '',
          customerName: dbDrop.end_point || 'Unknown Customer',
          address: dbDrop.address || dbDrop.end_point || '',
          status: determineStatus(dbDrop),
          installationType: dbDrop.cable_type || 'aerial',
          cableLength: parseFloat(dbDrop.cable_length) || 0,
          scheduledDate: dbDrop.created_date,
          completedDate: dbDrop.updated_at,
          technician: dbDrop.created_by || 'Unassigned',
          latitude: dbDrop.latitude,
          longitude: dbDrop.longitude,
          municipality: dbDrop.municipality,
          zone: dbDrop.zone_no,
          pon: dbDrop.pon_no,
        }));

        setDrops(transformedDrops);
        calculateStats(transformedDrops);

        // Update pagination for search results
        if (result.total !== undefined) {
          const totalPages = Math.ceil(result.total / pagination.pageSize);
          setPagination(prev => ({
            ...prev,
            currentPage: 1,
            totalItems: result.total,
            totalPages,
          }));
        }
      }
    } catch (error) {
      console.error('Error searching drops:', error);
      setError(error instanceof Error ? error.message : 'Failed to search drops');
    } finally {
      setLoading(false);
    }
  };

  return {
    drops,
    stats,
    allDropsStats,
    filters,
    filteredDrops,
    updateFilters,
    loading,
    loadingMore,
    error,
    refetch: fetchDropsData,
    pagination,
    hasMore,
    goToPage,
    nextPage,
    prevPage,
    loadMore,
    searchDrops,
  };
}