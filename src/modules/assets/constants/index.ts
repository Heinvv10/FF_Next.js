/**
 * Asset Module Constants
 *
 * Central export point for all constants.
 */

// Status
export {
  AssetStatus,
  type AssetStatusType,
  ASSET_STATUS_CONFIG,
  getStatusConfig,
  isAssetUsable,
  isAssetActive,
} from './assetStatus';

// Categories
export {
  AssetCategoryType,
  type AssetCategoryTypeValue,
  ASSET_CATEGORY_CONFIG,
  getCategoryConfig,
  getCategoryOptions,
} from './assetCategories';

// Conditions
export {
  AssetCondition,
  type AssetConditionType,
  ASSET_CONDITION_CONFIG,
  getConditionConfig,
  getConditionOptions,
  needsAttention,
} from './conditions';

// Maintenance
export {
  MaintenanceType,
  type MaintenanceTypeValue,
  MaintenanceStatus,
  type MaintenanceStatusValue,
  MAINTENANCE_TYPE_CONFIG,
  MAINTENANCE_STATUS_CONFIG,
  AssignmentTargetType,
  type AssignmentTargetTypeValue,
  ASSIGNMENT_TARGET_CONFIG,
} from './maintenanceTypes';

// Email Templates
export {
  EmailTemplateType,
  type EmailTemplateTypeValue,
  type EmailTemplateData,
  EMAIL_TEMPLATES,
  renderEmailSubject,
  renderEmailBody,
} from './emailTemplates';
