/**
 * Location Data Retriever
 * Handles fetching and transforming supplier location data
 */

import { Supplier } from '@/types/supplier/base.types';
import {
  LocationDistribution,
  ProvinceDistribution,
  LocationSummary
} from '../location-types';
import { LocationMetricsCalculator } from '../location-metrics';
import { log } from '@/lib/logger';

export class LocationDataRetriever {
  /**
   * Get comprehensive location distribution analysis
   */
  static async getLocationDistribution(): Promise<LocationDistribution[]> {
    try {
      const supplierCrudService = await import('../../../supplier.crud');
      const suppliers = await supplierCrudService.SupplierCrudService.getAll();

      return LocationMetricsCalculator.calculateLocationDistribution(suppliers);
    } catch (error) {
      log.error('Error getting location distribution:', { data: error }, 'geographic-analyzer');
      return [];
    }
  }

  /**
   * Get province-level distribution analysis
   */
  static async getProvinceDistribution(): Promise<ProvinceDistribution[]> {
    try {
      const supplierCrudService = await import('../../../supplier.crud');
      const suppliers = await supplierCrudService.SupplierCrudService.getAll();

      return LocationMetricsCalculator.calculateProvinceDistribution(suppliers);
    } catch (error) {
      log.error('Error getting province distribution:', { data: error }, 'geographic-analyzer');
      return [];
    }
  }

  /**
   * Get suppliers without location data
   */
  static async getSuppliersWithoutLocation(): Promise<Supplier[]> {
    try {
      const supplierCrudService = await import('../../../supplier.crud');
      const suppliers = await supplierCrudService.SupplierCrudService.getAll();

      return LocationMetricsCalculator.getSuppliersWithoutLocation(suppliers);
    } catch (error) {
      log.error('Error getting suppliers without location:', { data: error }, 'geographic-analyzer');
      return [];
    }
  }

  /**
   * Generate comprehensive location summary
   */
  static async getLocationSummary(): Promise<LocationSummary> {
    try {
      const supplierCrudService = await import('../../../supplier.crud');
      const suppliers = await supplierCrudService.SupplierCrudService.getAll();
      const distribution = LocationMetricsCalculator.calculateLocationDistribution(suppliers);

      return LocationMetricsCalculator.calculateLocationSummary(suppliers, distribution);
    } catch (error) {
      log.error('Error generating location summary:', { data: error }, 'geographic-analyzer');
      return {
        totalSuppliers: 0,
        suppliersWithLocation: 0,
        suppliersWithoutLocation: 0,
        uniqueCities: 0,
        uniqueProvinces: 0,
        uniqueCountries: 0,
        topCity: 'N/A',
        topProvince: 'N/A',
        topCountry: 'N/A',
        locationCoverage: 0
      };
    }
  }
}
