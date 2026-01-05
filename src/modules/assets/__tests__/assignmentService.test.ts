/**
 * Assignment Service Tests
 *
 * TDD: These tests are written FIRST (RED phase).
 * The assignmentService will be implemented to make them pass (GREEN phase).
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
import { assignmentService } from '../services/assignmentService';

// Test data
const mockAsset = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  asset_number: 'OTDR-2025-00001',
  name: 'EXFO MaxTester 730C',
  status: 'available',
  condition: 'excellent',
  current_assignee_type: null,
  current_assignee_id: null,
  current_assignee_name: null,
};

const mockAssignment = {
  id: '223e4567-e89b-12d3-a456-426614174100',
  asset_id: mockAsset.id,
  assignment_type: 'checkout',
  to_type: 'staff',
  to_id: '323e4567-e89b-12d3-a456-426614174200',
  to_name: 'John Doe',
  to_location: 'Lawley Site Office',
  project_id: null,
  project_name: null,
  checked_out_at: new Date().toISOString(),
  expected_return_date: '2025-02-15',
  checked_in_at: null,
  condition_at_checkout: 'excellent',
  condition_at_checkin: null,
  is_active: true,
  created_at: new Date().toISOString(),
  created_by: 'test-user',
};

const mockSqlFn = vi.fn();

describe('Assignment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (neon as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockSqlFn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkout', () => {
    const checkoutPayload = {
      assetId: mockAsset.id,
      toType: 'staff' as const,
      toId: '323e4567-e89b-12d3-a456-426614174200',
      toName: 'John Doe',
      toLocation: 'Lawley Site Office',
      conditionAtCheckout: 'excellent' as const,
      expectedReturnDate: '2025-02-15',
      purpose: 'Fiber testing at Lawley',
    };

    it('should checkout an available asset', async () => {
      // First get asset to check availability
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'available' }]);
      // Create assignment record
      mockSqlFn.mockResolvedValueOnce([mockAssignment]);
      // Update asset status
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'assigned' }]);

      const result = await assignmentService.checkout(checkoutPayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.to_name).toBe('John Doe');
    });

    it('should reject checkout of unavailable asset', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'assigned' }]);

      const result = await assignmentService.checkout(checkoutPayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });

    it('should reject checkout of non-existent asset', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assignmentService.checkout(checkoutPayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should checkout to a project', async () => {
      const projectCheckout = {
        ...checkoutPayload,
        toType: 'project' as const,
        projectId: '423e4567-e89b-12d3-a456-426614174300',
        projectName: 'Lawley FTTH Rollout',
      };

      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'available' }]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockAssignment, to_type: 'project' }]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'assigned' }]);

      const result = await assignmentService.checkout(projectCheckout, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.to_type).toBe('project');
    });

    it('should checkout to a vehicle', async () => {
      const vehicleCheckout = {
        ...checkoutPayload,
        toType: 'vehicle' as const,
        toName: 'Vehicle VF-001',
      };

      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'available' }]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockAssignment, to_type: 'vehicle' }]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'assigned' }]);

      const result = await assignmentService.checkout(vehicleCheckout, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.to_type).toBe('vehicle');
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await assignmentService.checkout(checkoutPayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('checkin', () => {
    const checkinPayload = {
      assignmentId: mockAssignment.id,
      conditionAtCheckin: 'good' as const,
      checkinNotes: 'Asset returned in good condition',
      newLocation: 'Main Warehouse',
    };

    it('should checkin an assigned asset', async () => {
      // Get active assignment
      mockSqlFn.mockResolvedValueOnce([mockAssignment]);
      // Update assignment (close it)
      mockSqlFn.mockResolvedValueOnce([{ ...mockAssignment, is_active: false, checked_in_at: new Date().toISOString() }]);
      // Update asset status
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'available' }]);

      const result = await assignmentService.checkin(checkinPayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.is_active).toBe(false);
    });

    it('should reject checkin of already checked-in assignment', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockAssignment, is_active: false }]);

      const result = await assignmentService.checkin(checkinPayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already');
    });

    it('should reject checkin of non-existent assignment', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assignmentService.checkin(checkinPayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should flag for maintenance if condition degraded significantly', async () => {
      const damagedCheckin = {
        ...checkinPayload,
        conditionAtCheckin: 'damaged' as const,
        maintenanceRequired: true,
      };

      mockSqlFn.mockResolvedValueOnce([mockAssignment]);
      mockSqlFn.mockResolvedValueOnce([{ ...mockAssignment, is_active: false, condition_at_checkin: 'damaged' }]);
      // Asset goes to maintenance status
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, status: 'in_maintenance', condition: 'damaged' }]);

      const result = await assignmentService.checkin(damagedCheckin, 'test-user');

      expect(result.success).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockSqlFn.mockRejectedValueOnce(new Error('Database error'));

      const result = await assignmentService.checkin(checkinPayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('transfer', () => {
    const transferPayload = {
      assetId: mockAsset.id,
      fromAssignmentId: mockAssignment.id,
      toType: 'staff' as const,
      toId: '523e4567-e89b-12d3-a456-426614174400',
      toName: 'Jane Smith',
      toLocation: 'Mohadin Site Office',
      conditionAtTransfer: 'good' as const,
    };

    it('should transfer an asset between assignees', async () => {
      // Get current assignment
      mockSqlFn.mockResolvedValueOnce([mockAssignment]);
      // Close current assignment
      mockSqlFn.mockResolvedValueOnce([{ ...mockAssignment, is_active: false }]);
      // Create new assignment
      mockSqlFn.mockResolvedValueOnce([{
        ...mockAssignment,
        id: 'new-assignment-id',
        to_name: 'Jane Smith',
        assignment_type: 'transfer',
      }]);
      // Update asset
      mockSqlFn.mockResolvedValueOnce([{ ...mockAsset, current_assignee_name: 'Jane Smith' }]);

      const result = await assignmentService.transfer(transferPayload, 'test-user');

      expect(result.success).toBe(true);
      expect(result.data?.to_name).toBe('Jane Smith');
    });

    it('should reject transfer of non-assigned asset', async () => {
      mockSqlFn.mockResolvedValueOnce([{ ...mockAssignment, is_active: false }]);

      const result = await assignmentService.transfer(transferPayload, 'test-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });
  });

  describe('getActiveAssignment', () => {
    it('should return the active assignment for an asset', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAssignment]);

      const result = await assignmentService.getActiveAssignment(mockAsset.id);

      expect(result.success).toBe(true);
      expect(result.data?.is_active).toBe(true);
    });

    it('should return null if no active assignment', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assignmentService.getActiveAssignment(mockAsset.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getHistory', () => {
    it('should return all assignments for an asset', async () => {
      mockSqlFn.mockResolvedValueOnce([
        mockAssignment,
        { ...mockAssignment, id: 'old-assignment', is_active: false },
      ]);

      const result = await assignmentService.getHistory(mockAsset.id);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should return assignments sorted by date (newest first)', async () => {
      const oldAssignment = {
        ...mockAssignment,
        id: 'old-assignment',
        checked_out_at: '2024-01-01T00:00:00Z',
      };
      const newAssignment = {
        ...mockAssignment,
        checked_out_at: '2025-01-15T00:00:00Z',
      };

      mockSqlFn.mockResolvedValueOnce([newAssignment, oldAssignment]);

      const result = await assignmentService.getHistory(mockAsset.id);

      expect(result.success).toBe(true);
      expect(result.data[0].checked_out_at > result.data[1].checked_out_at).toBe(true);
    });
  });

  describe('getByAssignee', () => {
    it('should return all active assignments for a staff member', async () => {
      mockSqlFn.mockResolvedValueOnce([mockAssignment]);

      const result = await assignmentService.getByAssignee('staff', '323e4567-e89b-12d3-a456-426614174200');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should return all active assignments for a project', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assignmentService.getByAssignee('project', '423e4567-e89b-12d3-a456-426614174300');

      expect(result.success).toBe(true);
    });

    it('should return all active assignments for a vehicle', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assignmentService.getByAssignee('vehicle', '523e4567-e89b-12d3-a456-426614174400');

      expect(result.success).toBe(true);
    });
  });

  describe('getOverdueReturns', () => {
    it('should return assignments with overdue return dates', async () => {
      const overdueAssignment = {
        ...mockAssignment,
        expected_return_date: '2024-01-01', // Past date
      };

      mockSqlFn.mockResolvedValueOnce([overdueAssignment]);

      const result = await assignmentService.getOverdueReturns();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should return empty array if no overdue returns', async () => {
      mockSqlFn.mockResolvedValueOnce([]);

      const result = await assignmentService.getOverdueReturns();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });
});
