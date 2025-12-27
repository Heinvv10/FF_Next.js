// 🟢 WORKING: React hooks for FibreFlow Ticketing Module
// This file exports all custom React hooks for the ticketing module

// ==================== Verification Hooks (Subtask 2.9) ====================

/**
 * Verification hooks for managing 12-step verification checklist state
 *
 * Exports:
 * - useVerificationSteps: Fetch all verification steps for a ticket
 * - useVerificationProgress: Fetch verification progress (completed/total)
 * - useUpdateVerificationStep: Update a specific step
 * - useVerification: Combined hook for steps + progress
 * - verificationKeys: Query keys for React Query
 */
export {
  useVerificationSteps,
  useVerificationProgress,
  useUpdateVerificationStep,
  useVerification,
  verificationKeys,
} from './useVerification';

// ==================== QA Readiness Hooks (Subtask 2.10) ====================

/**
 * QA Readiness hooks for managing pre-QA validation checks
 *
 * Exports:
 * - useQAReadinessStatus: Fetch current QA readiness status
 * - useRunQAReadinessCheck: Run a new QA readiness check
 * - useQAReadiness: Combined hook for status + check
 * - qaReadinessKeys: Query keys for React Query
 */
export {
  useQAReadinessStatus,
  useRunQAReadinessCheck,
  useQAReadiness,
  qaReadinessKeys,
} from './useQAReadiness';

// Hooks to be added in future subtasks:
// - useTickets (phase 2)
// - useTicket (phase 2)
// - useRiskAcceptance (phase 2)
// - useHandover (phase 3)
// - useEscalation (phase 3)
// - useGuarantee (phase 3)
// - useDashboard (phase 5)
