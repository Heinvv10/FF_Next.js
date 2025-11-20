/**
 * Geographic Analysis Engine
 * Advanced geographic analysis and pattern recognition for supplier locations
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 387 → 19 lines (95% reduction)
 *
 * Architecture:
 * - constants/: Configuration and constants (major cities, thresholds)
 * - utils/: Helper utilities (rating extraction)
 * - data-retrieval/: Data fetching and transformation
 * - search/: Location-based search functionality
 * - analysis/: Concentration and regional analysis
 * - strategic/: Expansion and risk analysis
 * - index.ts: Main orchestrator combining all modules
 */

// Re-export for backward compatibility
export { GeographicAnalyzer } from './geographic-analyzer';
