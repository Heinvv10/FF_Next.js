/**
 * Risk Analyzer
 * Calculates location-based risk factors
 */

import { ConcentrationAnalyzer } from '../analysis/ConcentrationAnalyzer';
import { LocationDataRetriever } from '../data-retrieval/LocationDataRetriever';
import { RISK_THRESHOLDS } from '../constants/config';
import { log } from '@/lib/logger';

export class RiskAnalyzer {
  /**
   * Calculate location-based risk factors
   */
  static async calculateLocationRisk(): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    mitigation: string[];
    concentrationScore: number;
  }> {
    try {
      const [concentration, summary] = await Promise.all([
        ConcentrationAnalyzer.getLocationConcentration(),
        LocationDataRetriever.getLocationSummary()
      ]);

      const riskFactors: string[] = [];
      const mitigation: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      // Analyze concentration risk
      riskLevel = this.analyzeConcentrationRisk(
        concentration.concentrationIndex,
        riskFactors,
        mitigation,
        riskLevel
      );

      // Analyze location coverage
      riskLevel = this.analyzeLocationCoverage(
        summary.locationCoverage,
        riskFactors,
        mitigation,
        riskLevel
      );

      // Analyze single-location dependency
      const topLocationShare = concentration.topLocations[0]?.percentage || 0;
      riskLevel = this.analyzeSingleLocationDependency(
        topLocationShare,
        riskFactors,
        mitigation,
        riskLevel
      );

      return {
        riskLevel,
        riskFactors,
        mitigation,
        concentrationScore: Math.round(concentration.concentrationIndex * 100)
      };
    } catch (error) {
      log.error('Error calculating location risk:', { data: error }, 'geographic-analyzer');
      return {
        riskLevel: 'low',
        riskFactors: [],
        mitigation: [],
        concentrationScore: 0
      };
    }
  }

  /**
   * Analyze concentration risk
   */
  private static analyzeConcentrationRisk(
    concentrationIndex: number,
    riskFactors: string[],
    mitigation: string[],
    currentRiskLevel: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    if (concentrationIndex > RISK_THRESHOLDS.HIGH_CONCENTRATION) {
      riskFactors.push('High geographic concentration increases supply chain risk');
      mitigation.push('Diversify supplier base across multiple regions');
      return 'high';
    } else if (concentrationIndex > RISK_THRESHOLDS.MEDIUM_CONCENTRATION) {
      riskFactors.push('Moderate geographic concentration may pose supply risks');
      mitigation.push('Consider expanding to additional geographic markets');
      return 'medium';
    }
    return currentRiskLevel;
  }

  /**
   * Analyze location coverage
   */
  private static analyzeLocationCoverage(
    locationCoverage: number,
    riskFactors: string[],
    mitigation: string[],
    currentRiskLevel: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    if (locationCoverage < RISK_THRESHOLDS.MIN_LOCATION_COVERAGE) {
      riskFactors.push(`${100 - locationCoverage}% of suppliers lack location data`);
      mitigation.push('Improve supplier data collection for better risk assessment');
      if (currentRiskLevel === 'low') return 'medium';
    }
    return currentRiskLevel;
  }

  /**
   * Analyze single-location dependency
   */
  private static analyzeSingleLocationDependency(
    topLocationShare: number,
    riskFactors: string[],
    mitigation: string[],
    currentRiskLevel: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    if (topLocationShare > RISK_THRESHOLDS.MAX_SINGLE_LOCATION_SHARE) {
      riskFactors.push(`Over ${topLocationShare}% of suppliers in single location`);
      mitigation.push('Reduce dependency on single geographic location');
      return 'high';
    }
    return currentRiskLevel;
  }
}
