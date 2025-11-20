/**
 * Location Search Service
 * Handles location-based supplier searches
 */

import { SupplierLocation, LocationSearchOptions } from '../location-types';
import { LocationMetricsCalculator } from '../location-metrics';
import { SEARCH_DEFAULTS } from '../constants/config';
import { log } from '@/lib/logger';

export class LocationSearchService {
  /**
   * Find suppliers within radius of a location
   */
  static async getSuppliersNearLocation(
    latitude: number,
    longitude: number,
    options: LocationSearchOptions = {}
  ): Promise<SupplierLocation[]> {
    try {
      const supplierCrudService = await import('../../../supplier.crud');
      const suppliers = await supplierCrudService.SupplierCrudService.getAll();

      const {
        radius = SEARCH_DEFAULTS.RADIUS,
        unit = SEARCH_DEFAULTS.UNIT,
        sortBy = SEARCH_DEFAULTS.SORT_BY,
        limit
      } = options;

      const radiusInKm = unit === 'miles'
        ? radius * SEARCH_DEFAULTS.MILES_TO_KM
        : radius;

      let nearbySuppliers = LocationMetricsCalculator.findSuppliersNearLocation(
        suppliers,
        latitude,
        longitude,
        radiusInKm
      );

      // Apply sorting
      nearbySuppliers = this.applySorting(nearbySuppliers, sortBy);

      // Apply limit
      if (limit && limit > 0) {
        nearbySuppliers = nearbySuppliers.slice(0, limit);
      }

      return nearbySuppliers;
    } catch (error) {
      log.error('Error finding suppliers near location:', { data: error }, 'geographic-analyzer');
      return [];
    }
  }

  /**
   * Apply sorting to supplier results
   */
  private static applySorting(
    suppliers: SupplierLocation[],
    sortBy: 'name' | 'distance' | 'supplierCount'
  ): SupplierLocation[] {
    switch (sortBy) {
      case 'name':
        return [...suppliers].sort((a, b) => a.supplierName.localeCompare(b.supplierName));
      case 'supplierCount':
        // This would require additional grouping logic
        return suppliers;
      case 'distance':
      default:
        // Already sorted by distance in findSuppliersNearLocation
        return suppliers;
    }
  }
}
