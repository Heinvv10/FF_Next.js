/**
 * Maintenance Service Tests
 *
 * TDD: These tests are written FIRST (RED phase).
 * The maintenanceService will be implemented to make them pass (GREEN phase).
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
import { maintenanceService } from '../services/maintenanceService';

// Test data
const mockAsset = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  asset_number: 'OTDR-2025-00001',
  name: 'EXFO MaxTester 730C',
  status: 'available',
  requires_calibration: true,
  next_calibration_date: '2025-06-15',
};

const mockMaintenance = {
  id: '223e4567-e89b-12d3-a456-426614174100',
  asset_id: mockAsset.id,
  maintenance_type: 'calibration',
  status: 'scheduled',
  scheduled_date: '2025-02-01',
  due_date: '2025-02-15',
  completed_date: null,
  provider_name: 'EXFO Calibration Lab',
  provider_contact: 'calibration@exfo.com',
  description: 'Annual calibration',
  created_at: new Date().toISOString(),
  created_by: 'test-user',
};

const mockSqlFn = vi.fn();

describe('Maintenance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (neon as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSqlFn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('schedule', () => {
    const schedulePayload = {
      assetId: mockAsset.id,
      maintenanceType: 'calibration' as const,
      scheduledDate: '2025-02-01',
      dueDate: '2025-02-15',
      providerName: 'EXFO Calibration Lab',
      providerContact: 'calibration@exfo.com',
      description: 'Annual calibration',
    };

    it('should schedule maintenance for an asset', async () => {
      // Get asset to verify it exists
      mockSqlFn.mockResolvedValueOnce([mockAsset]);
      // Create maintenance record
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);

      const result = await maintenanceService.schedule(schedulePayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.maintenance_type).toBe('calibration');
      expect(result.data?.status).toBe('scheduled');
    });

    it('should reject scheduling for non-existent asset', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await maintenanceService.schedule(schedulePayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should schedule different maintenance types', async () => {
      const preventivePayload = {
        ...schedulePayload,
        maintenanceType: 'preventive' as const,
      };

      mockSqlFn.mockResolvedValueOnce([mockAsset]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockMaintenance, maintenance_type: 'preventive' }]);

      const result = await maintenanceService.schedule(preventivePayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.maintenance_type).toBe('preventive');
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await maintenanceService.schedule(schedulePayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('complete', () => {
    const completePayload = {
      maintenanceId: mockMaintenance.id,
      completedDate: '2025-02-05',
      workPerformed: 'Full calibration completed per manufacturer specifications',
      findings: 'All measurements within tolerance',
      recommendations: 'Next calibration due in 12 months',
      conditionAfter: 'excellent' as const,
      passFail: 'pass' as const,
      nextCalibrationDate: '2026-02-05',
      laborCost: 1500,
      partsCost: 0,
    };

    it('should complete a scheduled maintenance', async () => {
      // Get maintenance record
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);
      // Update maintenance record
      mockSqlFn.mockResolvedValueOnce([{ ...mockMaintenance, status: 'completed', completed_date: '2025-02-05' }]);
      // Update asset calibration date
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, last_calibration_date: '2025-02-05' }]);

      const result = await maintenanceService.complete(completePayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('completed');
    });

    it('should reject completing non-existent maintenance', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await maintenanceService.complete(completePayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject completing already completed maintenance', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockMaintenance, status: 'completed' }]);

      const result = await maintenanceService.complete(completePayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already completed');
    });

    it('should update asset next calibration date for calibration type', async () => {
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockMaintenance, status: 'completed' }]);
      mockSqlFn.mockResolvedValueOnce([{
        ...mockAsset,
        last_calibration_date: '2025-02-05',
        next_calibration_date: '2026-02-05',
      }]);

      const result = await maintenanceService.complete(completePayload, 'test-user');

      expect(result.success).toBe(true);
    });

    it('should calculate total cost correctly', async () => {
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);
      mockSqlFn.mockResolvedValueOnce([{
        ...mockMaintenance,
        status: 'completed',
        labor_cost: 1500,
        parts_cost: 0,
        total_cost: 1500,
      }]);
      mockSqlFn.mockResolvedValueOnce([mockAsset]);

      const result = await maintenanceService.complete(completePayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.totalCost).toBe(1500);
    });
  });

  describe('cancel', () => {
    it('should cancel a scheduled maintenance', async () => {
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockMaintenance, status: 'cancelled' }]);

      const result = await maintenanceService.cancel(mockMaintenance.id, 'Equipment replaced', 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('cancelled');
    });

    it('should reject cancelling completed maintenance', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockMaintenance, status: 'completed' }]);

      const result = await maintenanceService.cancel(mockMaintenance.id, 'Reason', 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be cancelled');
    });
  });

  describe('getById', () => {
    it('should return a maintenance record by ID', async () => {
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);

      const result = await maintenanceService.getById(mockMaintenance.id);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(mockMaintenance.id);
    });

    it('should return null for non-existent maintenance', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await maintenanceService.getById('non-existent');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getByAsset', () => {
    it('should return all maintenance records for an asset', async () => {
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);

      const result = await maintenanceService.getByAsset(mockAsset.id);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should filter by maintenance type', async () => {
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);

      const result = await maintenanceService.getByAsset(mockAsset.id, { maintenanceType: ['calibration'] });

      expect(result.success).toBe(true);
    });

    it('should filter by status', async () => {
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);

      const result = await maintenanceService.getByAsset(mockAsset.id, { status: ['scheduled'] });

      expect(result.success).toBe(true);
    });
  });

  describe('getUpcoming', () => {
    it('should return upcoming maintenance within specified days', async () => {
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);

      const result = await maintenanceService.getUpcoming(30);

      expect(result.success).toBe(true);
    });

    it('should include asset details in response', async () => {
      mockSqlFn.mockResolvedValueOnce([{
        ...mockMaintenance,
        asset_name: mockAsset.name,
        asset_number: mockAsset.asset_number,
      }]);

      const result = await maintenanceService.getUpcoming(30);

      expect(result.success).toBe(true);
      expect(result.data[0].assetName).toBeDefined();
    });
  });

  describe('getOverdue', () => {
    it('should return overdue maintenance records', async () => {
      const overdueMaintenance = {
        ...mockMaintenance,
        status: 'overdue',
        due_date: '2024-01-01',
      };

      mockSqlFn.mockResolvedValueOnce([overdueMaintenance]);

      const result = await maintenanceService.getOverdue();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('updateOverdueStatus', () => {
    it('should mark overdue maintenance as overdue', async () => {
      // Get scheduled maintenance that is past due
      mockSqlFn.mockResolvedValueOnce([mockMaintenance]);
      // Update status to overdue
      mockSqlFn.mockResolvedValueOnce([{ count: 1 }]);

      const result = await maintenanceService.updateOverdueStatus();

      expect(result.success).toBe(true);
      expect(result.data?.updatedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCalibrationHistory', () => {
    it('should return calibration history for an asset', async () => {
      const calibrationRecord = {
        ...mockMaintenance,
        maintenance_type: 'calibration',
        status: 'completed',
        pass_fail: 'pass',
        calibration_certificate_number: 'CAL-2025-001',
      };

      mockSqlFn.mockResolvedValueOnce([calibrationRecord]);

      const result = await maintenanceService.getCalibrationHistory(mockAsset.id);

      expect(result.success).toBe(true);
      expect(result.data[0].maintenanceType).toBe('calibration');
    });
  });

  describe('getDashboardStats', () => {
    it('should return maintenance dashboard statistics', async () => {
      mockSqlFn.mockResolvedValueOnce([{
        total_scheduled: 10,
        total_in_progress: 3,
        total_completed: 50,
        total_overdue: 2,
        calibrations_due_30_days: 5,
      }]);

      const result = await maintenanceService.getDashboardStats();

      expect(result.success).toBe(true);
      expect(result.data?.totalScheduled).toBe(10);
      expect(result.data?.totalOverdue).toBe(2);
    });
  });
});
