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

// Additional services will be exported as they are implemented:
// - verificationService (subtask 2.3)
// - riskAcceptanceService (subtask 2.4)
// - handoverService (subtask 3.4)
// - escalationService (subtask 3.2)
// - guaranteeService (subtask 3.5)
// - qcontactService (phase 4)
// - whatsappService (phase 5)
// - weeklyReportService (phase 5)
