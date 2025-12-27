// 🟢 WORKING: Utility functions for FibreFlow Ticketing Module
// This file exports all utility functions for the ticketing module

// Database connection utility (subtask 1.4) ✅
export { db, getConnection, query, queryOne, transaction, healthCheck, closeConnection } from './db';
export type { HealthCheckResult } from './db';

// QA Readiness Validator (subtask 2.1) ✅
export { validateQAReadiness } from './qaReadinessValidator';
export type {
  QAReadinessValidationInput,
  QAReadinessValidationResult,
  PlatformData
} from './qaReadinessValidator';

// Fault Pattern Detector (subtask 3.1) ✅
export { detectFaultPattern, checkMultiplePatterns, getDefaultThresholds } from './faultPatternDetector';
export type {
  FaultPatternDetectorInput,
  FaultPatternThresholdsConfig,
  MultiplePatternCheckInput
} from './faultPatternDetector';

// Utilities to be added in future subtasks:
// - drLookup.ts - DR number lookup helpers
// - guaranteeCalculator.ts (subtask 3.5) - Guarantee calculations
// - excelParser.ts (subtask 5.1) - Excel file parsing
// - slaCalculator.ts (subtask 5.8) - SLA calculations
// - snapshotGenerator.ts (subtask 3.3) - Handover snapshot generation
