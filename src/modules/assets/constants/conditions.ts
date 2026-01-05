/**
 * Asset Condition Constants
 *
 * Defines the physical condition states of assets.
 */

export const AssetCondition = {
  NEW: 'new',
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  DAMAGED: 'damaged',
  NON_FUNCTIONAL: 'non_functional',
} as const;

export type AssetConditionType = (typeof AssetCondition)[keyof typeof AssetCondition];

export const ASSET_CONDITION_CONFIG: Record<
  AssetConditionType,
  { label: string; color: string; description: string; sortOrder: number }
> = {
  [AssetCondition.NEW]: {
    label: 'New',
    color: 'green',
    description: 'Brand new, never used',
    sortOrder: 1,
  },
  [AssetCondition.EXCELLENT]: {
    label: 'Excellent',
    color: 'green',
    description: 'Like new, minimal wear',
    sortOrder: 2,
  },
  [AssetCondition.GOOD]: {
    label: 'Good',
    color: 'blue',
    description: 'Normal wear, fully functional',
    sortOrder: 3,
  },
  [AssetCondition.FAIR]: {
    label: 'Fair',
    color: 'yellow',
    description: 'Noticeable wear, still functional',
    sortOrder: 4,
  },
  [AssetCondition.POOR]: {
    label: 'Poor',
    color: 'orange',
    description: 'Significant wear, limited functionality',
    sortOrder: 5,
  },
  [AssetCondition.DAMAGED]: {
    label: 'Damaged',
    color: 'red',
    description: 'Physical damage, needs repair',
    sortOrder: 6,
  },
  [AssetCondition.NON_FUNCTIONAL]: {
    label: 'Non-Functional',
    color: 'red',
    description: 'Does not work, needs repair or disposal',
    sortOrder: 7,
  },
};

/**
 * Get configuration for a condition
 */
export function getConditionConfig(condition: AssetConditionType) {
  return ASSET_CONDITION_CONFIG[condition] ?? ASSET_CONDITION_CONFIG[AssetCondition.GOOD];
}

/**
 * Get all conditions as options for select dropdowns
 */
export function getConditionOptions() {
  return Object.entries(ASSET_CONDITION_CONFIG)
    .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
    .map(([value, config]) => ({
      value: value as AssetConditionType,
      label: config.label,
      color: config.color,
    }));
}

/**
 * Check if condition indicates asset needs attention
 */
export function needsAttention(condition: AssetConditionType): boolean {
  return (
    condition === AssetCondition.POOR ||
    condition === AssetCondition.DAMAGED ||
    condition === AssetCondition.NON_FUNCTIONAL
  );
}
