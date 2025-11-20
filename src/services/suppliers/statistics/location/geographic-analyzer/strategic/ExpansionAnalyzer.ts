/**
 * Expansion Analyzer
 * Identifies location expansion opportunities
 */

import { LocationDataRetriever } from '../data-retrieval/LocationDataRetriever';
import { RegionalAnalyzer } from '../analysis/RegionalAnalyzer';
import { ConcentrationAnalyzer } from '../analysis/ConcentrationAnalyzer';
import { MAJOR_CITIES, RISK_THRESHOLDS, ANALYSIS_CONFIG } from '../constants/config';
import { log } from '@/lib/logger';

export class ExpansionAnalyzer {
  /**
   * Identify location expansion opportunities
   */
  static async identifyExpansionOpportunities(): Promise<{
    underservedRegions: string[];
    growingMarkets: string[];
    recommendations: string[];
  }> {
    try {
      const [distribution, regionalAnalysis] = await Promise.all([
        LocationDataRetriever.getLocationDistribution(),
        RegionalAnalyzer.analyzeRegionalPerformance()
      ]);

      const underservedRegions = this.findUnderservedRegions(distribution);
      const growingMarkets = this.findGrowingMarkets(regionalAnalysis);
      const recommendations = await this.generateRecommendations(
        underservedRegions,
        growingMarkets
      );

      return {
        underservedRegions,
        growingMarkets,
        recommendations
      };
    } catch (error) {
      log.error('Error identifying expansion opportunities:', { data: error }, 'geographic-analyzer');
      return {
        underservedRegions: [],
        growingMarkets: [],
        recommendations: []
      };
    }
  }

  /**
   * Find underserved regions (low supplier count but major market)
   */
  private static findUnderservedRegions(
    distribution: Array<{ city: string; count: number }>
  ): string[] {
    return MAJOR_CITIES.filter(city => {
      const cityData = distribution.find(d => d.city.toLowerCase() === city.toLowerCase());
      return !cityData || cityData.count < RISK_THRESHOLDS.UNDERSERVED_THRESHOLD;
    });
  }

  /**
   * Find growing markets (regions with good performance metrics)
   */
  private static findGrowingMarkets(
    regionalAnalysis: Array<{
      region: string;
      averageRating: number;
      supplierCount: number;
    }>
  ): string[] {
    return regionalAnalysis
      .filter(region =>
        region.averageRating > ANALYSIS_CONFIG.MIN_GROWING_MARKET_RATING &&
        region.supplierCount < ANALYSIS_CONFIG.MAX_GROWING_MARKET_SUPPLIERS
      )
      .map(region => region.region)
      .slice(0, ANALYSIS_CONFIG.GROWING_MARKETS_LIMIT);
  }

  /**
   * Generate expansion recommendations
   */
  private static async generateRecommendations(
    underservedRegions: string[],
    growingMarkets: string[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (underservedRegions.length > 0) {
      const topCities = underservedRegions
        .slice(0, ANALYSIS_CONFIG.UNDERSERVED_CITIES_LIMIT)
        .join(', ');
      recommendations.push(
        `Consider expanding to ${topCities} for better market coverage`
      );
    }

    if (growingMarkets.length > 0) {
      recommendations.push(
        `Invest in supplier development in ${growingMarkets[0]} - high performance, low saturation`
      );
    }

    const concentrationAnalysis = await ConcentrationAnalyzer.getLocationConcentration();
    if (concentrationAnalysis.concentrationIndex > RISK_THRESHOLDS.MEDIUM_CONCENTRATION) {
      recommendations.push(
        'High location concentration detected - diversify supplier base geographically'
      );
    }

    return recommendations;
  }
}
