/**
 * Asset Service Tests
 *
 * TDD: These tests are written FIRST (RED phase).
 * The assetService will be implemented to make them pass (GREEN phase).
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
import {
  assetService,
  type AssetServiceResult,
} from '../services/assetService';

// Test data
const mockCategory = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'EXFO OTDR',
  code: 'OTDR',
  type: 'test_equipment',
  requires_calibration: true,
  calibration_interval_days: 365,
};

const mockAsset = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  asset_number: 'OTDR-2025-00001',
  serial_number: 'EX123456',
  barcode: 'VF-OTDR-001',
  category_id: mockCategory.id,
  name: 'EXFO MaxTester 730C',
  description: 'High-performance OTDR for fiber testing',
  manufacturer: 'EXFO',
  model: 'MaxTester 730C',
  status: 'available',
  condition: 'excellent',
  requires_calibration: true,
  next_calibration_date: '2025-12-31',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test-user',
};

const mockSqlFn = vi.fn();

describe('Asset Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to return our mock SQL function
    (neon as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSqlFn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('should return all assets with default pagination', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(mockAsset.id);
    });

    it('should filter assets by status', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getAll({ status: ['available'] });

      expect(result.success).toBe(true);
      expect(mockSqlFn).toHaveBeenCalled();
    });

    it('should filter assets by category', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getAll({ categoryId: [mockCategory.id] });

      expect(result.success).toBe(true);
    });

    it('should filter assets by search term', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getAll({ searchTerm: 'EXFO' });

      expect(result.success).toBe(true);
    });

    it('should filter assets with calibration due within days', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getAll({ calibrationDueWithinDays: 30 });

      expect(result.success).toBe(true);
    });

    it('should handle pagination', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getAll({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination?.page).toBe(1);
      expect(result.pagination?.limit).toBe(10);
    });

    it('should handle sorting', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getAll({ sortBy: 'name', sortOrder: 'asc' });

      expect(result.success).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await assetService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return an asset by ID', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getById(mockAsset.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockAsset.id);
    });

    it('should return null for non-existent asset', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assetService.getById('non-existent-id');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await assetService.getById(mockAsset.id);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getByAssetNumber', () => {
    it('should return an asset by asset number', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getByAssetNumber(mockAsset.asset_number);

      expect(result.success).toBe(true);
      expect(result.data?.asset_number).toBe(mockAsset.asset_number);
    });

    it('should return null for non-existent asset number', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assetService.getByAssetNumber('NON-EXISTENT');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getByBarcode', () => {
    it('should return an asset by barcode', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getByBarcode(mockAsset.barcode!);

      expect(result.success).toBe(true);
      expect(result.data?.barcode).toBe(mockAsset.barcode);
    });

    it('should return null for non-existent barcode', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assetService.getByBarcode('NON-EXISTENT');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('create', () => {
    const createPayload = {
      categoryId: mockCategory.id,
      name: 'New OTDR',
      serialNumber: 'NEW123',
      manufacturer: 'EXFO',
      model: 'MaxTester 740C',
    };

    it('should create a new asset', async () => {
      // First call generates asset number (get count)
      mockSqlFn.mockResolvedValueOnce([{ count: 0 }]);
      // Second call inserts asset
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, asset_number: 'OTDR-2025-00001' }]);

      const result = await assetService.create(createPayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe(createPayload.name);
    });

    it('should generate unique asset number', async () => {
      mockSqlFn.mockResolvedValueOnce([{ count: 5 }]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, asset_number: 'OTDR-2025-00006' }]);

      const result = await assetService.create(createPayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.asset_number).toMatch(/OTDR-2025-\d{5}/);
    });

    it('should inherit calibration settings from category', async () => {
      mockSqlFn.mockResolvedValueOnce([{ count: 0 }]);
      mockSqlFn.mockResolvedValueOnce([{
        ...mockAsset,
        requires_calibration: true,
        next_calibration_date: '2026-01-15',
      }]);

      const result = await assetService.create(createPayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.requires_calibration).toBe(true);
    });

    it('should handle validation errors', async () => {
      const invalidPayload = { categoryId: 'invalid-uuid', name: '' };

      const result = await assetService.create(invalidPayload as any, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await assetService.create(createPayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('update', () => {
    const updatePayload = {
      name: 'Updated OTDR Name',
      condition: 'good' as const,
    };

    it('should update an existing asset', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, ...updatePayload }]);

      const result = await assetService.update(mockAsset.id, updatePayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(updatePayload.name);
    });

    it('should return not found for non-existent asset', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assetService.update('non-existent', updatePayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await assetService.update(mockAsset.id, updatePayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should update asset status', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'in_maintenance' }]);

      const result = await assetService.updateStatus(
        mockAsset.id,
        'in_maintenance',
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('in_maintenance');
    });

    it('should reject invalid status transitions', async () => {
      // Disposed assets can't be changed to available
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'disposed' }]);

      const result = await assetService.updateStatus(mockAsset.id, 'available', 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('transition');
    });
  });

  describe('delete', () => {
    it('should delete an asset', async () => {
      // First check if asset exists and is not assigned
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'available' }]);
      // Then delete
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assetService.delete(mockAsset.id);

      expect(result.success).toBe(true);
    });

    it('should prevent deletion of assigned assets', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'assigned' }]);

      const result = await assetService.delete(mockAsset.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('assigned');
    });

    it('should return not found for non-existent asset', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assetService.delete('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getCalibrationDue', () => {
    it('should return assets with calibration due within specified days', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getCalibrationDue(30);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should return overdue calibrations when withinDays is 0', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getCalibrationDue(0);

      expect(result.success).toBe(true);
    });
  });

  describe('getMaintenanceDue', () => {
    it('should return assets with maintenance due within specified days', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.getMaintenanceDue(30);

      expect(result.success).toBe(true);
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      mockSqlFn.mockResolvedValueOnce([{
        total: 100,
        available: 50,
        assigned: 30,
        in_maintenance: 10,
        calibration_due: 5,
        calibration_overdue: 2,
      }]);

      const result = await assetService.getDashboardStats();

      expect(result.success).toBe(true);
      expect(result.data?.totalAssets).toBe(100);
      expect(result.data?.availableAssets).toBe(50);
      expect(result.data?.assignedAssets).toBe(30);
      expect(result.data?.calibrationDue).toBe(5);
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await assetService.getDashboardStats();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('search', () => {
    it('should search assets by serial number', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.search('EX123456');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should search assets by name', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await assetService.search('MaxTester');

      expect(result.success).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assetService.search('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getAssignmentHistory', () => {
    it('should return assignment history for an asset', async () => {
      mockSqlFn.mockResolvedValueOnce([
        {
          id: 'assign-1',
          asset_id: mockAsset.id,
          to_type: 'staff',
          to_name: 'John Doe',
          checked_out_at: new Date().toISOString(),
        },
      ]);

      const result = await assetService.getAssignmentHistory(mockAsset.id);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].to_name).toBe('John Doe');
    });
  });
});
