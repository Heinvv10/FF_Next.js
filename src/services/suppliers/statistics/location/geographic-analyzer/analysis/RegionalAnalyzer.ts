/**
 * Regional Analyzer
 * Analyzes regional performance and characteristics
 */

import { Supplier } from '@/types/supplier/base.types';
import { RegionAnalysis } from '../location-types';
import { getSupplierRating } from '../utils/ratingHelper';
import { ANALYSIS_CONFIG } from '../constants/config';
import { log } from '@/lib/logger';

export class RegionalAnalyzer {
  /**
   * Analyze regional performance and characteristics
   */
  static async analyzeRegionalPerformance(): Promise<RegionAnalysis[]> {
    try {
      const supplierCrudService = await import('../../../supplier.crud');
      const suppliers = await supplierCrudService.SupplierCrudService.getAll();

      const regionMap = this.groupSuppliersByRegion(suppliers);
      const totalSuppliers = suppliers.length;

      return this.generateRegionAnalyses(regionMap, totalSuppliers);
    } catch (error) {
      log.error('Error analyzing regional performance:', { data: error }, 'geographic-analyzer');
      return [];
    }
  }

  /**
   * Group suppliers by region
   */
  private static groupSuppliersByRegion(suppliers: Supplier[]): Map<string, {
    suppliers: Supplier[];
    ratings: number[];
    categories: Map<string, number>;
  }> {
    const regionMap = new Map();

    suppliers.forEach(supplier => {
      const address = supplier.addresses?.physical;
      if (address && address.state) {
        const region = `${address.state}, ${address.country || ''}`;

        if (!regionMap.has(region)) {
          regionMap.set(region, {
            suppliers: [],
            ratings: [],
            categories: new Map()
          });
        }

        const regionData = regionMap.get(region)!;
        regionData.suppliers.push(supplier);

        // Collect ratings
        const rating = getSupplierRating(supplier);
        if (rating > 0) {
          regionData.ratings.push(rating);
        }

        // Collect categories
        if (supplier.category) {
          const currentCount = regionData.categories.get(supplier.category) || 0;
          regionData.categories.set(supplier.category, currentCount + 1);
        }
      }
    });

    return regionMap;
  }

  /**
   * Generate region analyses from grouped data
   */
  private static generateRegionAnalyses(
    regionMap: Map<string, {
      suppliers: Supplier[];
      ratings: number[];
      categories: Map<string, number>;
    }>,
    totalSuppliers: number
  ): RegionAnalysis[] {
    const analyses: RegionAnalysis[] = [];

    regionMap.forEach((data, region) => {
      const averageRating = data.ratings.length > 0
        ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length
        : 0;

      const topCategories = Array.from(data.categories.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, ANALYSIS_CONFIG.TOP_CATEGORIES_LIMIT);

      const marketShare = (data.suppliers.length / totalSuppliers) * 100;

      analyses.push({
        region,
        supplierCount: data.suppliers.length,
        averageRating: Math.round(averageRating * 100) / 100,
        topCategories,
        marketShare: Math.round(marketShare * 100) / 100
      });
    });

    return analyses.sort((a, b) => b.supplierCount - a.supplierCount);
  }
}
