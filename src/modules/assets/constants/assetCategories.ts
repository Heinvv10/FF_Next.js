/**
 * Asset Category Constants
 *
 * Defines the types/categories of assets that can be managed.
 */

export const AssetCategoryType = {
  TEST_EQUIPMENT: 'test_equipment',
  SPLICE_EQUIPMENT: 'splice_equipment',
  COMPUTING_DEVICE: 'computing_device',
  TOOLS: 'tools',
  VEHICLE: 'vehicle',
  SAFETY_EQUIPMENT: 'safety_equipment',
  OTHER: 'other',
} as const;

export type AssetCategoryTypeValue = (typeof AssetCategoryType)[keyof typeof AssetCategoryType];

export const ASSET_CATEGORY_CONFIG: Record<
  AssetCategoryTypeValue,
  {
    label: string;
    description: string;
    icon: string;
    requiresCalibration: boolean;
    defaultCalibrationDays: number | null;
    defaultDepreciationYears: number;
  }
> = {
  [AssetCategoryType.TEST_EQUIPMENT]: {
    label: 'Test Equipment',
    description: 'EXFO testers, OTDRs, power meters, light sources, VFLs',
    icon: 'gauge',
    requiresCalibration: true,
    defaultCalibrationDays: 365,
    defaultDepreciationYears: 5,
  },
  [AssetCategoryType.SPLICE_EQUIPMENT]: {
    label: 'Splice Equipment',
    description: 'Fusion splicers, cleavers, fiber holders, electrodes',
    icon: 'link',
    requiresCalibration: true,
    defaultCalibrationDays: 365,
    defaultDepreciationYears: 7,
  },
  [AssetCategoryType.COMPUTING_DEVICE]: {
    label: 'Computing Device',
    description: 'Laptops, tablets, phones, GPS units',
    icon: 'laptop',
    requiresCalibration: false,
    defaultCalibrationDays: null,
    defaultDepreciationYears: 3,
  },
  [AssetCategoryType.TOOLS]: {
    label: 'Tools & Hand Tools',
    description: 'Ladders, drills, cable cutters, strippers, tool kits',
    icon: 'wrench',
    requiresCalibration: false,
    defaultCalibrationDays: null,
    defaultDepreciationYears: 5,
  },
  [AssetCategoryType.VEHICLE]: {
    label: 'Vehicle',
    description: 'Company vehicles, vans, trucks',
    icon: 'truck',
    requiresCalibration: false,
    defaultCalibrationDays: null,
    defaultDepreciationYears: 5,
  },
  [AssetCategoryType.SAFETY_EQUIPMENT]: {
    label: 'Safety Equipment',
    description: 'PPE, safety harnesses, hard hats',
    icon: 'hard-hat',
    requiresCalibration: true,
    defaultCalibrationDays: 365,
    defaultDepreciationYears: 3,
  },
  [AssetCategoryType.OTHER]: {
    label: 'Other',
    description: 'Miscellaneous equipment',
    icon: 'package',
    requiresCalibration: false,
    defaultCalibrationDays: null,
    defaultDepreciationYears: 5,
  },
};

/**
 * Get configuration for a category type
 */
export function getCategoryConfig(type: AssetCategoryTypeValue) {
  return ASSET_CATEGORY_CONFIG[type] ?? ASSET_CATEGORY_CONFIG[AssetCategoryType.OTHER];
}

/**
 * Get all category types as options for select dropdowns
 */
export function getCategoryOptions() {
  return Object.entries(ASSET_CATEGORY_CONFIG).map(([value, config]) => ({
    value: value as AssetCategoryTypeValue,
    label: config.label,
    description: config.description,
  }));
}
