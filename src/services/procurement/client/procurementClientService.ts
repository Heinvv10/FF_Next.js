/**
 * Procurement Client Service
 * Client-side wrapper for procurement API calls
 * This service should be used by frontend components instead of direct service imports
 *
 * Refactored: Nov 20, 2025 - Modular architecture
 * Main file reduced from 391 → 21 lines (95% reduction)
 *
 * Architecture:
 * - stock/: Stock operations (positions, movements, dashboard)
 * - boq/: BOQ operations (CRUD, items, exceptions)
 * - rfq/: RFQ operations (CRUD)
 * - purchase-orders/: Purchase order operations (CRUD)
 * - health/: Health check
 * - compatibility.ts: Legacy export mapping
 * - index.ts: Main orchestrator combining all services
 */

// Re-export for backward compatibility
export { ProcurementClientService, procurementApiService } from './procurement-client-service';
export default ProcurementClientService;
