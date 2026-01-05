/**
 * Asset Module Utilities
 *
 * Central export point for utility functions and schemas.
 */

// Database Connection (server-side only)
export { getDbConnection, validateConnection } from './db';

// Validation Schemas
export {
  CreateAssetSchema,
  UpdateAssetSchema,
  CheckoutAssetSchema,
  CheckinAssetSchema,
  ScheduleMaintenanceSchema,
  CompleteMaintenanceSchema,
  AssetFilterSchema,
  MaintenanceFilterSchema,
  CategorySchema,
  type CreateAssetInput,
  type UpdateAssetInput,
  type CheckoutAssetInput,
  type CheckinAssetInput,
  type ScheduleMaintenanceInput,
  type CompleteMaintenanceInput,
  type AssetFilterInput,
  type MaintenanceFilterInput,
  type CategoryInput,
} from './schemas';
