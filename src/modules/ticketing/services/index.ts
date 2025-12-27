/**
 * Ticketing Module - Services Exports
 * 🟢 WORKING: Central export point for all ticketing services (server-side only)
 */

// Ticket CRUD Service (subtask 1.5)
export * from './ticketService';

// DR Lookup Service (subtask 1.6)
export * from './drLookupService';

// QA Readiness Service (subtask 2.2)
export * from './qaReadinessService';

// Verification Service - 12-Step Workflow (subtask 2.3)
export * from './verificationService';

// Risk Acceptance Service (subtask 2.4)
export * from './riskAcceptanceService';

// Attachment Service - Firebase Storage Integration (subtask 2.8)
export * from './attachmentService';

// Escalation Service - Repeat Fault Escalation Management (subtask 3.2)
export * from './escalationService';

// Handover Service - Ownership Transfer & Snapshots (subtask 3.4)
export * from './handoverService';

// Guarantee Service - Guarantee Classification & Billing Determination (subtask 3.5)
export * from './guaranteeService';

// Additional services will be exported as they are implemented:
// - qcontactService (phase 4)
// - whatsappService (phase 5)
// - weeklyReportService (phase 5)
