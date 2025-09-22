/**
 * Contractor CRUD Operations - Index
 * Centralizes all contractor CRUD exports
 */

// Core service
export { ContractorCrudCore, contractorCrudCore } from './contractorCrudCore';

// Firebase operations
export {
  getAllContractorsFromFirebase,
  getContractorByIdFromFirebase,
  createContractorInFirebase,
  updateContractorInFirebase,
  deleteContractorFromFirebase
} from './firebaseOperations';

// Neon operations - DO NOT EXPORT (server-side only)
// These are only used in API routes, not in client components

// Subscription handlers
export {
  subscribeToContractors,
  subscribeToContractor
} from './subscriptionHandlers';

// Search and filters
export {
  buildQueryConstraints,
  applySearchFilter,
  applyTagFilter,
  applyClientSideFilters,
  sortContractors,
  filterByPerformance,
  filterByProjectStats
} from './searchFilters';

// Default export for backward compatibility
export { contractorCrudCore as default } from './contractorCrudCore';