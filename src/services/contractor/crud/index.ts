/**
 * Contractor CRUD Operations - Index
 * Centralizes all contractor CRUD exports
 *
 * Note: Firebase operations, subscriptionHandlers, and searchFilters have been removed.
 * The codebase now uses Neon PostgreSQL exclusively for the database.
 * Firebase Storage is still used for file uploads only.
 */

// Core service
export { ContractorCrudCore, contractorCrudCore } from './contractorCrudCore';

// Default export for backward compatibility
export { contractorCrudCore as default } from './contractorCrudCore';