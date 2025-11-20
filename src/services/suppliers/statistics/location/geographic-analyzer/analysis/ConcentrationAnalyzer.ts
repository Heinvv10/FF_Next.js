/**
 * Concentration Analyzer
 * Analyzes location concentration and diversity
 */

import { LocationConcentration } from '../location-types';
import { LocationMetricsCalculator } from '../location-metrics';
import { LocationDataRetriever } from '../data-retrieval/LocationDataRetriever';
import { log } from '@/lib/logger';

export class ConcentrationAnalyzer {
  /**
   * Analyze location concentration and diversity
   */
  static async getLocationConcentration(): Promise<LocationConcentration> {
    try {
      const distribution = await LocationDataRetriever.getLocationDistribution();
      const metrics = LocationMetricsCalculator.calculateLocationConcentration(distribution);

      return {
        totalLocations: metrics.totalLocations,
        topLocations: metrics.topLocations,
        concentrationIndex: metrics.concentrationIndex,
        diversityScore: metrics.diversityScore
      };
    } catch (error) {
      log.error('Error analyzing location concentration:', { data: error }, 'geographic-analyzer');
      return {
        totalLocations: 0,
        topLocations: [],
        concentrationIndex: 0,
        diversityScore: 0
      };
    }
  }
}
