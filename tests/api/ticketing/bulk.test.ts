// tests/api/ticketing/bulk.test.ts
// Integration tests for POST /api/ticketing/bulk (bulk operations)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/ticketing/tickets-bulk';
import { getAuth } from '@clerk/nextjs/server';
import { mockSql } from '../../../vitest.setup';

// Mock dependencies
vi.mock('@clerk/nextjs/server');

describe('POST /api/ticketing/bulk (Bulk Operations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSql.mockReset();
    mockSql.mockResolvedValue([]);
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: null });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: { code: 'UNAUTHORIZED' },
      });
    });

    it('should accept authenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001' },
        { id: 'TICK-002' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should require action parameter', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticket_ids: ['TICK-001'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('action') }),
      });
    });

    it('should require ticket_ids parameter', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('ticket_ids') }),
      });
    });

    it('should reject empty ticket_ids array', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: [],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should limit maximum number of tickets', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: Array.from({ length: 101 }, (_, i) => `TICK-${i}`),
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('Maximum 100 tickets') }),
      });
    });
  });

  describe('Bulk Status Update', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should update status for multiple tickets', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', status: 'closed' },
        { id: 'TICK-002', status: 'closed' },
        { id: 'TICK-003', status: 'closed' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002', 'TICK-003'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.summary.success).toBe(3);
    });

    it('should validate status value', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001'],
          data: { status: 'invalid_status' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should set closed_at when status is closed', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          status: 'closed',
          closed_at: new Date().toISOString(),
        },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Bulk Assignment', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should assign multiple tickets to user', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', assigned_to: 'user_456' },
        { id: 'TICK-002', assigned_to: 'user_456' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'assign',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { assigned_to: 'user_456' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.summary.success).toBe(2);
    });

    it('should unassign tickets when assigned_to is null', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', assigned_to: null },
        { id: 'TICK-002', assigned_to: null },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'assign',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { assigned_to: null },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Bulk Priority Update', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should update priority for multiple tickets', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', priority: 'critical' },
        { id: 'TICK-002', priority: 'critical' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_priority',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { priority: 'critical' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.summary.success).toBe(2);
    });

    it('should recalculate SLA for priority changes', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          priority: 'critical',
          sla_response_deadline: new Date(Date.now() + 3600000).toISOString(),
        },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_priority',
          ticket_ids: ['TICK-001'],
          data: { priority: 'critical' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Bulk Tags Update', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should add tags to multiple tickets', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', tags: ['urgent', 'customer'] },
        { id: 'TICK-002', tags: ['urgent', 'customer'] },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'add_tags',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { tags: ['urgent', 'customer'] },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should remove tags from multiple tickets', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', tags: [] },
        { id: 'TICK-002', tags: [] },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'remove_tags',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { tags: ['urgent'] },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Bulk Delete', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should soft delete multiple tickets', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', deleted: true },
        { id: 'TICK-002', deleted: true },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'delete',
          ticket_ids: ['TICK-001', 'TICK-002'],
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.summary.success).toBe(2);
    });

    it('should require admin role for hard delete', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'delete',
          ticket_ids: ['TICK-001'],
          data: { force: true },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('Admin access required') }),
      });
    });
  });

  describe('Partial Success Handling', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should report partial success when some updates fail', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', status: 'closed' },
        // TICK-002 failed to update
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(207); // Multi-Status
      const data = JSON.parse(res._getData());
      expect(data.data.summary.success).toBe(1);
      expect(data.data.failed_count).toBe(1);
      expect(data.data.failed_ids).toContain('TICK-002');
    });

    it('should provide detailed error information for failures', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', status: 'closed' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-999'], // TICK-999 doesn't exist
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.errors).toBeDefined();
      expect(data.data.errors).toHaveLength(1);
    });
  });

  describe('Transaction Handling', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should rollback on failure when use_transaction is true', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database error'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { status: 'closed' },
          use_transaction: true,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.data?.updated_count || 0).toBe(0);
    });

    it('should complete partial updates when use_transaction is false', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001' }]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { status: 'closed' },
          use_transaction: false,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(207);
    });
  });

  describe('Action Validation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should reject invalid action types', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'invalid_action',
          ticket_ids: ['TICK-001'],
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('Invalid action') }),
      });
    });

    it('should list supported actions', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'invalid_action',
          ticket_ids: ['TICK-001'],
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.supported_actions).toEqual([
        'update_status',
        'assign',
        'update_priority',
        'add_tags',
        'remove_tags',
        'delete',
      ]);
    });
  });

  describe('Audit Trail', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should log bulk action in history', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', status: 'closed' },
        { id: 'TICK-002', status: 'closed' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      // Verify history log entry created
    });

    it('should include user_id in audit trail', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001' }]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(mockSql).toHaveBeenCalled();
      // Verify user_123 is in history
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle large batches efficiently', async () => {
      const largeTicketList = Array.from({ length: 100 }, (_, i) => ({
        id: `TICK-${i.toString().padStart(3, '0')}`,
        status: 'closed',
      }));

      mockSql.mockResolvedValueOnce(largeTicketList);

      const startTime = Date.now();

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: largeTicketList.map((t) => t.id),
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      const endTime = Date.now();

      expect(res._getStatusCode()).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should batch database operations', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001' },
        { id: 'TICK-002' },
        { id: 'TICK-003' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002', 'TICK-003'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      // Should use single UPDATE with WHERE id IN (...)
      expect(mockSql).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ code: expect.any(String) }),
      });
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSql.mockRejectedValueOnce(new Error('Test error'));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Bulk operation error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should return detailed success response', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', status: 'closed' },
        { id: 'TICK-002', status: 'closed' },
      ]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          action: 'update_status',
          ticket_ids: ['TICK-001', 'TICK-002'],
          data: { status: 'closed' },
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          action: 'update_status',
          total_requested: 2,
          updated_count: 2,
          failed_count: 0,
        }),
      });
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED' },
      });
    });
  });
});
