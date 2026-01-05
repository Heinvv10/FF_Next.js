/**
 * Asset Query Hooks
 *
 * React Query hooks for fetching asset data.
 */

import { useQuery } from '@tanstack/react-query';
import { assetApiService } from '../services/assetApiService';
import { assetKeys, categoryKeys } from './queryKeys';
import type { AssetFilterInput } from '../utils/schemas';

// Assets
export function useAssets(filter?: AssetFilterInput) {
  return useQuery({
    queryKey: assetKeys.list(filter),
    queryFn: () => assetApiService.getAll(filter),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAsset(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => assetApiService.getById(id),
    enabled: options?.enabled !== false && !!id,
  });
}

export function useAssetSearch(term: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: assetKeys.search(term),
    queryFn: () => assetApiService.search(term),
    enabled: options?.enabled !== false && term.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useAssetByBarcode(code: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: assetKeys.barcode(code),
    queryFn: () => assetApiService.getByBarcode(code),
    enabled: options?.enabled !== false && !!code,
    retry: false,
  });
}

export function useAssetHistory(assetId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: assetKeys.history(assetId),
    queryFn: () => assetApiService.getAssignmentHistory(assetId),
    enabled: options?.enabled !== false && !!assetId,
  });
}

// Dashboard
export function useAssetDashboard() {
  return useQuery({
    queryKey: assetKeys.dashboard(),
    queryFn: () => assetApiService.getDashboardSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCalibrationDue(days = 30) {
  return useQuery({
    queryKey: assetKeys.calibrationDue(days),
    queryFn: () => assetApiService.getCalibrationDue(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMaintenanceDue(days = 30) {
  return useQuery({
    queryKey: assetKeys.maintenanceDue(days),
    queryFn: () => assetApiService.getMaintenanceDue(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Categories
export function useCategories(filter?: { isActive?: boolean; type?: string }) {
  return useQuery({
    queryKey: categoryKeys.list(filter),
    queryFn: () => assetApiService.getCategories(filter),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCategory(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => assetApiService.getCategoryById(id),
    enabled: options?.enabled !== false && !!id,
  });
}

export function useCategoryTypes() {
  return useQuery({
    queryKey: categoryKeys.types(),
    queryFn: () => assetApiService.getCategoryTypes(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
