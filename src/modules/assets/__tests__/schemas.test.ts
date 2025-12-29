/**
 * Asset Validation Schemas Tests
 *
 * TDD: These tests are written FIRST (RED phase).
 * The schemas will be implemented to make them pass (GREEN phase).
 */

import { describe, it, expect } from 'vitest';
// These imports will fail until we implement the schemas
import {
  CreateAssetSchema,
  UpdateAssetSchema,
  CheckoutAssetSchema,
  CheckinAssetSchema,
  ScheduleMaintenanceSchema,
  CompleteMaintenanceSchema,
  AssetFilterSchema,
} from '../utils/schemas';

describe('Asset Validation Schemas', () => {
  describe('CreateAssetSchema', () => {
    it('should validate a valid asset creation payload', () => {
      const validPayload = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'EXFO MaxTester 730C',
        serialNumber: 'EX123456',
        manufacturer: 'EXFO',
        model: 'MaxTester 730C',
      };

      const result = CreateAssetSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should require categoryId and name', () => {
      const invalidPayload = {
        serialNumber: 'EX123456',
      };

      const result = CreateAssetSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain('categoryId');
        expect(issues).toContain('name');
      }
    });

    it('should validate categoryId is a valid UUID', () => {
      const invalidPayload = {
        categoryId: 'not-a-uuid',
        name: 'Test Asset',
      };

      const result = CreateAssetSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should validate name length (min 1, max 255)', () => {
      const tooLong = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'a'.repeat(256),
      };

      const result = CreateAssetSchema.safeParse(tooLong);
      expect(result.success).toBe(false);
    });

    it('should validate purchasePrice is a positive number', () => {
      const negativePrice = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Asset',
        purchasePrice: -100,
      };

      const result = CreateAssetSchema.safeParse(negativePrice);
      expect(result.success).toBe(false);
    });

    it('should validate purchaseDate as a valid date string', () => {
      const validDate = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Asset',
        purchaseDate: '2025-01-15',
      };

      const result = CreateAssetSchema.safeParse(validDate);
      expect(result.success).toBe(true);
    });

    it('should allow optional fields to be undefined', () => {
      const minimalPayload = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Asset',
      };

      const result = CreateAssetSchema.safeParse(minimalPayload);
      expect(result.success).toBe(true);
    });

    it('should validate tags as array of strings', () => {
      const withTags = {
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Asset',
        tags: ['fiber', 'testing'],
      };

      const result = CreateAssetSchema.safeParse(withTags);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateAssetSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Updated Name',
      };

      const result = UpdateAssetSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate status is a valid AssetStatus', () => {
      const validStatus = {
        status: 'available',
      };

      const result = UpdateAssetSchema.safeParse(validStatus);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status values', () => {
      const invalidStatus = {
        status: 'invalid_status',
      };

      const result = UpdateAssetSchema.safeParse(invalidStatus);
      expect(result.success).toBe(false);
    });

    it('should validate condition is a valid AssetCondition', () => {
      const validCondition = {
        condition: 'good',
      };

      const result = UpdateAssetSchema.safeParse(validCondition);
      expect(result.success).toBe(true);
    });
  });

  describe('CheckoutAssetSchema', () => {
    it('should validate a valid checkout payload', () => {
      const validCheckout = {
        assetId: '123e4567-e89b-12d3-a456-426614174000',
        toType: 'staff',
        toId: '123e4567-e89b-12d3-a456-426614174001',
        toName: 'John Doe',
        conditionAtCheckout: 'good',
      };

      const result = CheckoutAssetSchema.safeParse(validCheckout);
      expect(result.success).toBe(true);
    });

    it('should require assetId, toType, toId, toName, and conditionAtCheckout', () => {
      const incomplete = {
        toType: 'staff',
      };

      const result = CheckoutAssetSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('should validate toType is a valid AssignmentTargetType', () => {
      const validTypes = ['staff', 'project', 'vehicle', 'warehouse'];

      validTypes.forEach((type) => {
        const payload = {
          assetId: '123e4567-e89b-12d3-a456-426614174000',
          toType: type,
          toId: '123e4567-e89b-12d3-a456-426614174001',
          toName: 'Test',
          conditionAtCheckout: 'good',
        };
        const result = CheckoutAssetSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });

    it('should validate expectedReturnDate as valid date', () => {
      const withReturnDate = {
        assetId: '123e4567-e89b-12d3-a456-426614174000',
        toType: 'staff',
        toId: '123e4567-e89b-12d3-a456-426614174001',
        toName: 'John Doe',
        conditionAtCheckout: 'good',
        expectedReturnDate: '2025-02-15',
      };

      const result = CheckoutAssetSchema.safeParse(withReturnDate);
      expect(result.success).toBe(true);
    });
  });

  describe('CheckinAssetSchema', () => {
    it('should validate a valid checkin payload', () => {
      const validCheckin = {
        assignmentId: '123e4567-e89b-12d3-a456-426614174000',
        conditionAtCheckin: 'good',
      };

      const result = CheckinAssetSchema.safeParse(validCheckin);
      expect(result.success).toBe(true);
    });

    it('should require assignmentId and conditionAtCheckin', () => {
      const incomplete = {
        checkinNotes: 'Asset returned',
      };

      const result = CheckinAssetSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('should allow optional maintenanceRequired flag', () => {
      const withMaintenance = {
        assignmentId: '123e4567-e89b-12d3-a456-426614174000',
        conditionAtCheckin: 'damaged',
        maintenanceRequired: true,
        checkinNotes: 'Found damage',
      };

      const result = CheckinAssetSchema.safeParse(withMaintenance);
      expect(result.success).toBe(true);
    });
  });

  describe('ScheduleMaintenanceSchema', () => {
    it('should validate a valid maintenance schedule payload', () => {
      const validSchedule = {
        assetId: '123e4567-e89b-12d3-a456-426614174000',
        maintenanceType: 'calibration',
        scheduledDate: '2025-02-01',
      };

      const result = ScheduleMaintenanceSchema.safeParse(validSchedule);
      expect(result.success).toBe(true);
    });

    it('should require assetId, maintenanceType, and scheduledDate', () => {
      const incomplete = {
        providerName: 'EXFO Lab',
      };

      const result = ScheduleMaintenanceSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('should validate maintenanceType is valid', () => {
      const validTypes = ['calibration', 'preventive', 'corrective', 'inspection', 'certification'];

      validTypes.forEach((type) => {
        const payload = {
          assetId: '123e4567-e89b-12d3-a456-426614174000',
          maintenanceType: type,
          scheduledDate: '2025-02-01',
        };
        const result = ScheduleMaintenanceSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('CompleteMaintenanceSchema', () => {
    it('should validate a valid completion payload', () => {
      const validCompletion = {
        maintenanceId: '123e4567-e89b-12d3-a456-426614174000',
        completedDate: '2025-02-05',
        workPerformed: 'Full calibration completed',
        conditionAfter: 'excellent',
      };

      const result = CompleteMaintenanceSchema.safeParse(validCompletion);
      expect(result.success).toBe(true);
    });

    it('should require maintenanceId, completedDate, workPerformed, and conditionAfter', () => {
      const incomplete = {
        findings: 'No issues found',
      };

      const result = CompleteMaintenanceSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('should validate passFail is valid for calibration', () => {
      const validPassFail = ['pass', 'fail', 'conditional'];

      validPassFail.forEach((pf) => {
        const payload = {
          maintenanceId: '123e4567-e89b-12d3-a456-426614174000',
          completedDate: '2025-02-05',
          workPerformed: 'Calibration',
          conditionAfter: 'good',
          passFail: pf,
        };
        const result = CompleteMaintenanceSchema.safeParse(payload);
        expect(result.success).toBe(true);
      });
    });

    it('should validate costs are positive numbers', () => {
      const negativeCost = {
        maintenanceId: '123e4567-e89b-12d3-a456-426614174000',
        completedDate: '2025-02-05',
        workPerformed: 'Calibration',
        conditionAfter: 'good',
        laborCost: -100,
      };

      const result = CompleteMaintenanceSchema.safeParse(negativeCost);
      expect(result.success).toBe(false);
    });
  });

  describe('AssetFilterSchema', () => {
    it('should validate an empty filter', () => {
      const emptyFilter = {};

      const result = AssetFilterSchema.safeParse(emptyFilter);
      expect(result.success).toBe(true);
    });

    it('should validate filter with search term', () => {
      const withSearch = {
        searchTerm: 'EXFO',
      };

      const result = AssetFilterSchema.safeParse(withSearch);
      expect(result.success).toBe(true);
    });

    it('should validate filter with multiple statuses', () => {
      const withStatuses = {
        status: ['available', 'assigned'],
      };

      const result = AssetFilterSchema.safeParse(withStatuses);
      expect(result.success).toBe(true);
    });

    it('should validate pagination parameters', () => {
      const withPagination = {
        page: 1,
        limit: 50,
      };

      const result = AssetFilterSchema.safeParse(withPagination);
      expect(result.success).toBe(true);
    });

    it('should reject invalid pagination values', () => {
      const invalidPagination = {
        page: 0,
        limit: -10,
      };

      const result = AssetFilterSchema.safeParse(invalidPagination);
      expect(result.success).toBe(false);
    });

    it('should validate calibrationDueWithinDays as positive number', () => {
      const withDueDays = {
        calibrationDueWithinDays: 30,
      };

      const result = AssetFilterSchema.safeParse(withDueDays);
      expect(result.success).toBe(true);
    });
  });
});
