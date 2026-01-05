/**
 * Asset Status Constants
 *
 * Defines all possible states an asset can be in throughout its lifecycle.
 */

export const AssetStatus = {
  AVAILABLE: 'available',
  ASSIGNED: 'assigned',
  IN_MAINTENANCE: 'in_maintenance',
  OUT_FOR_CALIBRATION: 'out_for_calibration',
  RETIRED: 'retired',
  DISPOSED: 'disposed',
  LOST: 'lost',
  DAMAGED: 'damaged',
} as const;

export type AssetStatusType = (typeof AssetStatus)[keyof typeof AssetStatus];

export const ASSET_STATUS_CONFIG: Record<
  AssetStatusType,
  { label: string; color: string; description: string }
> = {
  [AssetStatus.AVAILABLE]: {
    label: 'Available',
    color: 'green',
    description: 'Ready for assignment',
  },
  [AssetStatus.ASSIGNED]: {
    label: 'Assigned',
    color: 'blue',
    description: 'Currently assigned to staff, project, or vehicle',
  },
  [AssetStatus.IN_MAINTENANCE]: {
    label: 'In Maintenance',
    color: 'yellow',
    description: 'Under maintenance or repair',
  },
  [AssetStatus.OUT_FOR_CALIBRATION]: {
    label: 'Out for Calibration',
    color: 'orange',
    description: 'Sent to calibration lab',
  },
  [AssetStatus.RETIRED]: {
    label: 'Retired',
    color: 'gray',
    description: 'End of service life, no longer in use',
  },
  [AssetStatus.DISPOSED]: {
    label: 'Disposed',
    color: 'gray',
    description: 'Physically disposed or sold',
  },
  [AssetStatus.LOST]: {
    label: 'Lost',
    color: 'red',
    description: 'Reported lost or missing',
  },
  [AssetStatus.DAMAGED]: {
    label: 'Damaged',
    color: 'red',
    description: 'Damaged, awaiting repair or disposal decision',
  },
};

/**
 * Get display configuration for an asset status
 */
export function getStatusConfig(status: AssetStatusType) {
  return ASSET_STATUS_CONFIG[status] ?? ASSET_STATUS_CONFIG[AssetStatus.AVAILABLE];
}

/**
 * Check if asset is usable (can be assigned)
 */
export function isAssetUsable(status: AssetStatusType): boolean {
  return status === AssetStatus.AVAILABLE;
}

/**
 * Check if asset is active (not retired/disposed)
 */
export function isAssetActive(status: AssetStatusType): boolean {
  return (
    status !== AssetStatus.RETIRED &&
    status !== AssetStatus.DISPOSED &&
    status !== AssetStatus.LOST
  );
}

/**
 * Valid status transitions
 * Defines which status changes are allowed
 */
const VALID_TRANSITIONS: Record<AssetStatusType, AssetStatusType[]> = {
  [AssetStatus.AVAILABLE]: [
    AssetStatus.ASSIGNED,
    AssetStatus.IN_MAINTENANCE,
    AssetStatus.OUT_FOR_CALIBRATION,
    AssetStatus.RETIRED,
    AssetStatus.LOST,
  ],
  [AssetStatus.ASSIGNED]: [
    AssetStatus.AVAILABLE,
    AssetStatus.IN_MAINTENANCE,
    AssetStatus.OUT_FOR_CALIBRATION,
    AssetStatus.LOST,
    AssetStatus.DAMAGED,
  ],
  [AssetStatus.IN_MAINTENANCE]: [
    AssetStatus.AVAILABLE,
    AssetStatus.RETIRED,
    AssetStatus.DISPOSED,
  ],
  [AssetStatus.OUT_FOR_CALIBRATION]: [
    AssetStatus.AVAILABLE,
    AssetStatus.IN_MAINTENANCE,
  ],
  [AssetStatus.RETIRED]: [AssetStatus.DISPOSED],
  [AssetStatus.DISPOSED]: [],
  [AssetStatus.LOST]: [AssetStatus.AVAILABLE, AssetStatus.DISPOSED],
  [AssetStatus.DAMAGED]: [
    AssetStatus.IN_MAINTENANCE,
    AssetStatus.RETIRED,
    AssetStatus.DISPOSED,
  ],
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  fromStatus: AssetStatusType,
  toStatus: AssetStatusType
): boolean {
  if (fromStatus === toStatus) return true;
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}
