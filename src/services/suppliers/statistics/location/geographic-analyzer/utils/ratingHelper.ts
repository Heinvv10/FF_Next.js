/**
 * Supplier Rating Helper
 * Utilities for extracting supplier ratings
 */

import { Supplier } from '@/types/supplier/base.types';

/**
 * Get supplier rating (handles both number and object formats)
 */
export function getSupplierRating(supplier: Supplier): number {
  if (typeof supplier.rating === 'number') {
    return supplier.rating;
  }
  if (supplier.rating && typeof supplier.rating === 'object') {
    return (supplier.rating as any).average || 0;
  }
  return 0;
}
