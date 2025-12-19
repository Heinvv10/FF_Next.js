// pages/api/ticketing/__tests__/delete.test.ts
// Integration tests for DELETE /api/ticketing/[ticketId] (delete ticket)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../[ticketId]';
import { getAuth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('@neondatabase/serverless');

describe('DELETE /api/ticketing/[ticketId] (Delete Ticket)', () => {
  let mockSql: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSql = vi.fn();
    (neon as any).mockReturnValue(mockSql);
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: null });

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Authentication required'),
      });
    });

    it('should accept authenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce([{ id: 'TICK-001' }]); // Ticket exists
      mockSql.mockResolvedValueOnce([]); // Delete successful

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should allow ticket creator to delete', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should allow admin to delete any ticket', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_456', // Different user
      };

      (getAuth as any).mockReturnValueOnce({
        userId: 'user_123',
        sessionClaims: { metadata: { role: 'admin' } },
      });

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should prevent non-creator from deleting ticket', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_456', // Different user
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('not authorized'),
      });
    });
  });

  describe('Ticket Validation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should return 404 for non-existent ticket', async () => {
      mockSql.mockResolvedValueOnce([]); // No ticket found

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-999' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('not found'),
      });
    });

    it('should require valid ticket ID format', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'invalid-id' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid ticket ID'),
      });
    });
  });

  describe('Soft Delete', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should soft delete ticket by default', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]); // Ticket exists
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: 'user_123',
        },
      ]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.message).toContain('soft deleted');
    });

    it('should set deleted_at timestamp', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          deleted_at: new Date().toISOString(),
        },
      ]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.deleted_at).toBeDefined();
    });

    it('should set deleted_by to authenticated user', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          deleted_by: 'user_123',
        },
      ]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.deleted_by).toBe('user_123');
    });
  });

  describe('Hard Delete', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({
        userId: 'user_123',
        sessionClaims: { metadata: { role: 'admin' } },
      });
    });

    it('should allow hard delete with force parameter (admin only)', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([]); // DELETE returns empty for hard delete

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001', force: 'true' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.message).toContain('permanently deleted');
    });

    it('should prevent hard delete for non-admin users', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: 'user_123' });

      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001', force: 'true' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Admin access required'),
      });
    });
  });

  describe('Cascading Deletes', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should delete associated comments', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]); // Ticket exists
      mockSql.mockResolvedValueOnce([]); // Delete comments
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', deleted: true }]); // Delete ticket

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should delete associated attachments', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([]); // Delete attachments
      mockSql.mockResolvedValueOnce([]); // Delete comments
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', deleted: true }]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should delete associated history entries', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([]); // Delete history
      mockSql.mockResolvedValueOnce([]); // Delete attachments
      mockSql.mockResolvedValueOnce([]); // Delete comments
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', deleted: true }]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Status Restrictions', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should prevent deletion of closed tickets', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
        status: 'closed',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Cannot delete closed ticket'),
      });
    });

    it('should allow deletion of open tickets', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
        status: 'open',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', deleted: true }]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should allow admin to delete closed tickets with override', async () => {
      (getAuth as any).mockReturnValueOnce({
        userId: 'user_123',
        sessionClaims: { metadata: { role: 'admin' } },
      });

      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_456',
        status: 'closed',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', deleted: true }]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001', override: 'true' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Billing Validation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should prevent deletion of tickets with approved billing', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
        is_billable: true,
        billing_status: 'approved',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Cannot delete ticket with approved billing'),
      });
    });

    it('should allow deletion of tickets with pending billing', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
        is_billable: true,
        billing_status: 'pending',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', deleted: true }]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

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
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSql.mockRejectedValueOnce(new Error('Test error'));

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Delete ticket error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle foreign key constraint violations', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockRejectedValueOnce({
        code: '23503',
        message: 'Foreign key constraint violation',
      });

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001', force: 'true' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should return success message for soft delete', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001', deleted: true }]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toMatchObject({
        success: true,
        message: expect.stringContaining('soft deleted'),
        data: expect.objectContaining({
          id: 'TICK-001',
        }),
      });
    });

    it('should return success message for hard delete', async () => {
      (getAuth as any).mockReturnValueOnce({
        userId: 'user_123',
        sessionClaims: { metadata: { role: 'admin' } },
      });

      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001', force: 'true' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data).toMatchObject({
        success: true,
        message: expect.stringContaining('permanently deleted'),
      });
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { ticketId: 'TICK-001' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Method Not Allowed'),
      });
    });
  });

  describe('Restore Functionality', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should allow restoring soft-deleted tickets', async () => {
      const mockTicket = {
        id: 'TICK-001',
        created_by: 'user_123',
        deleted: true,
        deleted_at: new Date().toISOString(),
      };

      mockSql.mockResolvedValueOnce([mockTicket]);
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          deleted: false,
          deleted_at: null,
          deleted_by: null,
        },
      ]);

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001', restore: 'true' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.message).toContain('restored');
    });

    it('should prevent restoring permanently deleted tickets', async () => {
      mockSql.mockResolvedValueOnce([]); // No ticket found

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { ticketId: 'TICK-001', restore: 'true' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('not found'),
      });
    });
  });
});
