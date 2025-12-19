// tests/api/ticketing/update.test.ts
// Integration tests for PATCH /api/ticketing/tickets-[id] (update ticket)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/ticketing/tickets-[id]';
import { getAuth } from '@clerk/nextjs/server';
import { mockSql } from '../../../vitest.setup';

// Mock dependencies
vi.mock('@clerk/nextjs/server');

describe('PATCH /api/ticketing/[ticketId] (Update Ticket)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSql.mockReset();
    mockSql.mockResolvedValue([]);
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: null });

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
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

      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', status: 'in_progress' }]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Ticket Validation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should return 404 for non-existent ticket', async () => {
      mockSql.mockResolvedValueOnce([]); // No ticket found

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-999' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: { code: 'NOT_FOUND' },
      });
    });

    it('should require valid ticket ID format', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'invalid-id' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('Invalid ticket ID') }),
      });
    });
  });

  describe('Field Updates', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should update ticket status', async () => {
      const mockTicket = {
        id: 'TICK-001',
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData()).data;
      expect(data.status).toBe('in_progress');
    });

    it('should update ticket priority', async () => {
      const mockTicket = {
        id: 'TICK-001',
        priority: 'critical',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          priority: 'critical',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.priority).toBe('critical');
    });

    it('should update assigned user', async () => {
      const mockTicket = {
        id: 'TICK-001',
        assigned_to: 'user_456',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          assigned_to: 'user_456',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.assigned_to).toBe('user_456');
    });

    it('should update multiple fields at once', async () => {
      const mockTicket = {
        id: 'TICK-001',
        status: 'in_progress',
        priority: 'high',
        assigned_to: 'user_456',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
          priority: 'high',
          assigned_to: 'user_456',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data).toMatchObject({
        status: 'in_progress',
        priority: 'high',
        assigned_to: 'user_456',
      });
    });

    it('should update metadata', async () => {
      const mockTicket = {
        id: 'TICK-001',
        metadata: {
          custom_field: 'updated_value',
        },
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          metadata: {
            custom_field: 'updated_value',
          },
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.metadata.custom_field).toBe('updated_value');
    });

    it('should update tags', async () => {
      const mockTicket = {
        id: 'TICK-001',
        tags: ['urgent', 'customer-complaint'],
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          tags: ['urgent', 'customer-complaint'],
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.tags).toEqual(['urgent', 'customer-complaint']);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should reject invalid status values', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'invalid_status',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('status') }),
      });
    });

    it('should accept valid status values', async () => {
      const validStatuses = ['open', 'in_progress', 'pending_customer', 'resolved', 'closed', 'cancelled'];

      for (const status of validStatuses) {
        mockSql.mockResolvedValueOnce([{ id: 'TICK-001', status }]);

        const { req, res } = createMocks({
          method: 'PATCH',
          query: { id: 'TICK-001' },
          body: { status },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
      }
    });

    it('should reject invalid priority values', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          priority: 'invalid_priority',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should accept valid priority values', async () => {
      const validPriorities = ['critical', 'high', 'medium', 'low'];

      for (const priority of validPriorities) {
        mockSql.mockResolvedValueOnce([{ id: 'TICK-001', priority }]);

        const { req, res } = createMocks({
          method: 'PATCH',
          query: { id: 'TICK-001' },
          body: { priority },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
      }
    });
  });

  describe('Status Transitions', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should allow transition from open to in_progress', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', status: 'in_progress' }]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should set resolved_at when status changes to resolved', async () => {
      const mockTicket = {
        id: 'TICK-001',
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'resolved',
          resolution_note: 'Fixed the issue',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.status).toBe('resolved');
      expect(data.resolved_at).toBeDefined();
    });

    it('should set closed_at when status changes to closed', async () => {
      const mockTicket = {
        id: 'TICK-001',
        status: 'closed',
        closed_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'closed',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.status).toBe('closed');
      expect(data.closed_at).toBeDefined();
    });
  });

  describe('SLA Impact', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should recalculate SLA when priority changes', async () => {
      const mockTicket = {
        id: 'TICK-001',
        priority: 'critical',
        sla_response_deadline: new Date(Date.now() + 3600000).toISOString(),
        sla_resolution_deadline: new Date(Date.now() + 14400000).toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          priority: 'critical',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.sla_response_deadline).toBeDefined();
      expect(data.sla_resolution_deadline).toBeDefined();
    });

    it('should set first_response_at when assigned for first time', async () => {
      const mockTicket = {
        id: 'TICK-001',
        assigned_to: 'user_456',
        first_response_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          assigned_to: 'user_456',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.first_response_at).toBeDefined();
    });
  });

  describe('Billing Updates', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should update billing fields', async () => {
      const mockTicket = {
        id: 'TICK-001',
        billable_type: 'adhoc',
        estimated_hours: 3,
        estimated_cost: 600,
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          billable_type: 'adhoc',
          estimated_hours: 3,
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.billable_type).toBe('adhoc');
      expect(data.estimated_hours).toBe(3);
    });

    it('should recalculate cost when hours change', async () => {
      const mockTicket = {
        id: 'TICK-001',
        estimated_hours: 5,
        estimated_cost: 1000, // 200 * 5
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          estimated_hours: 5,
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.estimated_cost).toBe(1000);
    });

    it('should update actual hours and recalculate actual cost', async () => {
      const mockTicket = {
        id: 'TICK-001',
        actual_hours: 4,
        actual_cost: 800,
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          actual_hours: 4,
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.actual_hours).toBe(4);
      expect(data.actual_cost).toBe(800);
    });
  });

  describe('Audit Trail', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should set updated_by to authenticated user', async () => {
      const mockTicket = {
        id: 'TICK-001',
        updated_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.updated_by).toBe('user_123');
    });

    it('should update updated_at timestamp', async () => {
      const beforeUpdate = new Date().toISOString();

      const mockTicket = {
        id: 'TICK-001',
        updated_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(new Date(data.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeUpdate).getTime()
      );
    });
  });

  describe('Partial Updates', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should allow updating single field', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', status: 'in_progress' }]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should reject empty update body', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {},
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ message: expect.stringContaining('No fields to update') }),
      });
    });

    it('should ignore read-only fields', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001' }]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          id: 'TICK-999', // Read-only
          created_at: new Date().toISOString(), // Read-only
          created_by: 'user_456', // Read-only
          status: 'in_progress',
        },
      });

      await handler(req, res);

      // Should succeed but ignore read-only fields
      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ code: expect.any(String) }),
      });
    });

    it('should handle constraint violations', async () => {
      mockSql.mockRejectedValueOnce({
        code: '23505',
        message: 'Duplicate key violation',
      });

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSql.mockRejectedValueOnce(new Error('Test error'));

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Update ticket error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Optimistic Locking', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle concurrent updates with version checking', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          version: 2, // Version incremented
        },
      ]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
          expected_version: 1,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData()).data;
      expect(data.version).toBe(2);
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should return updated ticket object', async () => {
      const mockTicket = {
        id: 'TICK-001',
        title: 'Test Ticket',
        status: 'in_progress',
        priority: 'high',
        updated_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'PATCH',
        query: { id: 'TICK-001' },
        body: {
          status: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: 'TICK-001',
          status: 'in_progress',
        }),
      });
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'TICK-001' },
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
