/**
 * Category Service Tests
 *
 * TDD: These tests are written FIRST (RED phase).
 * The categoryService will be implemented to make them pass (GREEN phase).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { neon } from '@neondatabase/serverless';

// Mock the database module before importing the service
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => {
    const sqlFunction = vi.fn();
    return sqlFunction;
  }),
}));

// Import after mocking
import { categoryService } from '../services/categoryService';

// Test data
const mockCategory = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'EXFO OTDR',
  code: 'OTDR',
  type: 'test_equipment',
  description: 'Optical Time Domain Reflectometer for fiber testing',
  requires_calibration: true,
  calibration_interval_days: 365,
  depreciation_years: 5,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSqlFn = vi.fn();

describe('Category Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (neon as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSqlFn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('should return all categories', async () => {
      mockSqlFn.mockResolvedValueOnce([mockCategory]);

      const result = await categoryService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].code).toBe('OTDR');
    });

    it('should filter by active status', async () => {
      mockSqlFn.mockResolvedValueOnce([mockCategory]);

      const result = await categoryService.getAll({ isActive: true });

      expect(result.success).toBe(true);
    });

    it('should filter by type', async () => {
      mockSqlFn.mockResolvedValueOnce([mockCategory]);

      const result = await categoryService.getAll({ type: 'test_equipment' });

      expect(result.success).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await categoryService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return a category by ID', async () => {
      mockSqlFn.mockResolvedValueOnce([mockCategory]);

      const result = await categoryService.getById(mockCategory.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockCategory.id);
    });

    it('should return null for non-existent category', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await categoryService.getById('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getByCode', () => {
    it('should return a category by code', async () => {
      mockSqlFn.mockResolvedValueOnce([mockCategory]);

      const result = await categoryService.getByCode('OTDR');

      expect(result.success).toBe(true);
      expect(result.data?.code).toBe('OTDR');
    });

    it('should return null for non-existent code', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await categoryService.getByCode('NONEXISTENT');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('create', () => {
    const createPayload = {
      name: 'Fusion Splicer',
      code: 'FSPL',
      type: 'splice_equipment',
      description: 'Fusion splicer for fiber joining',
      requiresCalibration: true,
      calibrationIntervalDays: 365,
      depreciationYears: 7,
    };

    it('should create a new category', async () => {
      mockSqlFn.mockResolvedValueOnce([]);  // Check for existing code
      mockSqlFn.mockResolvedValueOnce([{ ...mockCategory, ...createPayload }]);

      const result = await categoryService.create(createPayload);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(createPayload.name);
    });

    it('should reject duplicate code', async () => {
      mockSqlFn.mockResolvedValueOnce([mockCategory]);  // Code already exists

      const result = await categoryService.create({ ...createPayload, code: 'OTDR' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('exists');
    });

    it('should validate code format (uppercase alphanumeric)', async () => {
      const invalidPayload = { ...createPayload, code: 'invalid-code' };

      const result = await categoryService.create(invalidPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockResolvedValueOnce([]);  // Check passes
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await categoryService.create(createPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('update', () => {
    const updatePayload = {
      description: 'Updated description',
      calibrationIntervalDays: 180,
    };

    it('should update an existing category', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockCategory, ...updatePayload }]);

      const result = await categoryService.update(mockCategory.id, updatePayload);

      expect(result.success).toBe(true);
      expect(result.data?.description).toBe(updatePayload.description);
    });

    it('should return not found for non-existent category', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await categoryService.update('non-existent', updatePayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should prevent changing code if assets exist', async () => {
      // First call checks for existing assets
      mockSqlFn.mockResolvedValueOnce([{ count: 5 }]);

      const result = await categoryService.update(mockCategory.id, { code: 'NEWCODE' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('assets');
    });
  });

  describe('delete', () => {
    it('should delete a category with no assets', async () => {
      // Check for assets
      mockSqlFn.mockResolvedValueOnce([{ count: 0 }]);
      // Delete category
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await categoryService.delete(mockCategory.id);

      expect(result.success).toBe(true);
    });

    it('should prevent deletion of category with assets', async () => {
      mockSqlFn.mockResolvedValueOnce([{ count: 10 }]);

      const result = await categoryService.delete(mockCategory.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('assets');
    });
  });

  describe('setActive', () => {
    it('should deactivate a category', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockCategory, is_active: false }]);

      const result = await categoryService.setActive(mockCategory.id, false);

      expect(result.success).toBe(true);
      expect(result.data?.is_active).toBe(false);
    });

    it('should activate a category', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockCategory, is_active: true }]);

      const result = await categoryService.setActive(mockCategory.id, true);

      expect(result.success).toBe(true);
      expect(result.data?.is_active).toBe(true);
    });
  });

  describe('getAssetCount', () => {
    it('should return the count of assets in a category', async () => {
      mockSqlFn.mockResolvedValueOnce([{ count: 15 }]);

      const result = await categoryService.getAssetCount(mockCategory.id);

      expect(result.success).toBe(true);
      expect(result.data).toBe(15);
    });
  });

  describe('getTypes', () => {
    it('should return all unique category types', async () => {
      mockSqlFn.mockResolvedValueOnce([
        { type: 'test_equipment' },
        { type: 'splice_equipment' },
        { type: 'computing_device' },
        { type: 'tools' },
      ]);

      const result = await categoryService.getTypes();

      expect(result.success).toBe(true);
      expect(result.data).toContain('test_equipment');
      expect(result.data).toContain('splice_equipment');
    });
  });
});
