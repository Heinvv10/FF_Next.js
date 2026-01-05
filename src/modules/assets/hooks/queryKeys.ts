/**
 * Asset Query Keys
 *
 * Factory pattern for consistent cache key management.
 */

import type { AssetFilterInput } from '../utils/schemas';

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filter?: AssetFilterInput) => [...assetKeys.lists(), filter] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  search: (term: string) => [...assetKeys.all, 'search', term] as const,
  barcode: (code: string) => [...assetKeys.all, 'barcode', code] as const,
  history: (id: string) => [...assetKeys.all, 'history', id] as const,
  dashboard: () => [...assetKeys.all, 'dashboard'] as const,
  calibrationDue: (days?: number) => [...assetKeys.all, 'calibration-due', days] as const,
  maintenanceDue: (days?: number) => [...assetKeys.all, 'maintenance-due', days] as const,
};

export const categoryKeys = {
  all: ['asset-categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filter?: { isActive?: boolean; type?: string }) => [...categoryKeys.lists(), filter] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  types: () => [...categoryKeys.all, 'types'] as const,
};
