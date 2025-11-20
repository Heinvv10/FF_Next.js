/**
 * Geographic Analyzer Index
 * Main orchestrator combining all analysis modules
 *
 * Architecture:
 * - constants/: Configuration and constants
 * - utils/: Helper utilities
 * - data-retrieval/: Data fetching and transformation
 * - search/: Location-based search functionality
 * - analysis/: Concentration and regional analysis
 * - strategic/: Expansion and risk analysis
 */

import {
  LocationDistribution,
  ProvinceDistribution,
  LocationConcentration,
  LocationSummary,
  SupplierLocation,
  LocationSearchOptions,
  RegionAnalysis
} from '../location-types';
import { Supplier } from '@/types/supplier/base.types';
import { LocationDataRetriever } from './data-retrieval/LocationDataRetriever';
import { LocationSearchService } from './search/LocationSearchService';
import { ConcentrationAnalyzer } from './analysis/ConcentrationAnalyzer';
import { RegionalAnalyzer } from './analysis/RegionalAnalyzer';
import { ExpansionAnalyzer } from './strategic/ExpansionAnalyzer';
import { RiskAnalyzer } from './strategic/RiskAnalyzer';

/**
 * Geographic Analysis Engine
 * Advanced geographic analysis and pattern recognition for supplier locations
 */
export class GeographicAnalyzer {
  // ==================== Data Retrieval ====================

  /**
   * Get comprehensive location distribution analysis
   */
  static async getLocationDistribution(): Promise<LocationDistribution[]> {
    return LocationDataRetriever.getLocationDistribution();
  }

  /**
   * Get province-level distribution analysis
   */
  static async getProvinceDistribution(): Promise<ProvinceDistribution[]> {
    return LocationDataRetriever.getProvinceDistribution();
  }

  /**
   * Get suppliers without location data
   */
  static async getSuppliersWithoutLocation(): Promise<Supplier[]> {
    return LocationDataRetriever.getSuppliersWithoutLocation();
  }

  /**
   * Generate comprehensive location summary
   */
  static async getLocationSummary(): Promise<LocationSummary> {
    return LocationDataRetriever.getLocationSummary();
  }

  // ==================== Search ====================

  /**
   * Find suppliers within radius of a location
   */
  static async getSuppliersNearLocation(
    latitude: number,
    longitude: number,
    options: LocationSearchOptions = {}
  ): Promise<SupplierLocation[]> {
    return LocationSearchService.getSuppliersNearLocation(latitude, longitude, options);
  }

  // ==================== Analysis ====================

  /**
   * Analyze location concentration and diversity
   */
  static async getLocationConcentration(): Promise<LocationConcentration> {
    return ConcentrationAnalyzer.getLocationConcentration();
  }

  /**
   * Analyze regional performance and characteristics
   */
  static async analyzeRegionalPerformance(): Promise<RegionAnalysis[]> {
    return RegionalAnalyzer.analyzeRegionalPerformance();
  }

  // ==================== Strategic ====================

  /**
   * Identify location expansion opportunities
   */
  static async identifyExpansionOpportunities(): Promise<{
    underservedRegions: string[];
    growingMarkets: string[];
    recommendations: string[];
  }> {
    return ExpansionAnalyzer.identifyExpansionOpportunities();
  }

  /**
   * Calculate location-based risk factors
   */
  static async calculateLocationRisk(): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    mitigation: string[];
    concentrationScore: number;
  }> {
    return RiskAnalyzer.calculateLocationRisk();
  }
}

// Export all sub-modules for direct access if needed
export { LocationDataRetriever } from './data-retrieval/LocationDataRetriever';
export { LocationSearchService } from './search/LocationSearchService';
export { ConcentrationAnalyzer } from './analysis/ConcentrationAnalyzer';
export { RegionalAnalyzer } from './analysis/RegionalAnalyzer';
export { ExpansionAnalyzer } from './strategic/ExpansionAnalyzer';
export { RiskAnalyzer } from './strategic/RiskAnalyzer';
