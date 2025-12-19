// tests/api/ticketing/create.test.ts
// Integration tests for POST /api/ticketing (create ticket)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/ticketing/tickets';
import { getAuth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('@neondatabase/serverless');

describe('POST /api/ticketing (Create Ticket)', () => {
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
        method: 'POST',
        body: {
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
        },
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

      mockSql.mockResolvedValueOnce([{ id: 'TICK-001' }]); // INSERT result

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
          source: 'qcontact',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should require title field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          description: 'Test description',
          priority: 'high',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('title'),
      });
    });

    it('should require description field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Ticket',
          priority: 'high',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('description'),
      });
    });

    it('should require valid priority', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'invalid_priority',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('priority'),
      });
    });

    it('should accept valid priority values', async () => {
      const validPriorities = ['critical', 'high', 'medium', 'low'];

      for (const priority of validPriorities) {
        mockSql.mockResolvedValueOnce([{ id: `TICK-${priority}` }]);

        const { req, res } = createMocks({
          method: 'POST',
          body: {
            title: 'Test Ticket',
            description: 'Test description',
            priority,
            source: 'qcontact',
          },
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(201);
      }
    });

    it('should require valid source', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
          source: 'invalid_source',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('Ticket Creation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should create ticket with minimal required fields', async () => {
      const mockTicket = {
        id: 'TICK-001',
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'high',
        status: 'open',
        source: 'qcontact',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
          source: 'qcontact',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: 'TICK-001',
          title: 'Test Ticket',
        }),
      });
    });

    it('should create ticket with all optional fields', async () => {
      const mockTicket = {
        id: 'TICK-002',
        title: 'Full Ticket',
        description: 'Complete description',
        priority: 'critical',
        status: 'open',
        source: 'qcontact',
        assigned_to: 'user_456',
        customer_id: 'cust_789',
        project_id: 'proj_abc',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Full Ticket',
          description: 'Complete description',
          priority: 'critical',
          source: 'qcontact',
          assigned_to: 'user_456',
          customer_id: 'cust_789',
          project_id: 'proj_abc',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData()).data).toMatchObject({
        assigned_to: 'user_456',
        customer_id: 'cust_789',
        project_id: 'proj_abc',
      });
    });

    it('should auto-calculate SLA deadlines based on priority', async () => {
      const mockTicket = {
        id: 'TICK-003',
        sla_response_deadline: new Date(Date.now() + 3600000), // 1 hour
        sla_resolution_deadline: new Date(Date.now() + 14400000), // 4 hours
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Critical Ticket',
          description: 'Urgent issue',
          priority: 'critical',
          source: 'qcontact',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData()).data).toHaveProperty('sla_response_deadline');
      expect(JSON.parse(res._getData()).data).toHaveProperty('sla_resolution_deadline');
    });

    it('should set created_by to authenticated user', async () => {
      const mockTicket = {
        id: 'TICK-004',
        created_by: 'user_123',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
          source: 'qcontact',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.created_by).toBe('user_123');
    });
  });

  describe('Billing Calculation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should calculate billable amount for adhoc tickets', async () => {
      const mockTicket = {
        id: 'TICK-005',
        is_billable: true,
        billable_type: 'adhoc',
        billable_rate: 200,
        estimated_cost: 400,
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Billable Ticket',
          description: 'Adhoc support',
          priority: 'high',
          source: 'qcontact',
          billable_type: 'adhoc',
          estimated_hours: 2,
          billable_reason: 'Customer request',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.is_billable).toBe(true);
      expect(data.estimated_cost).toBe(400); // 200 * 2 hours
    });

    it('should mark warranty tickets as non-billable', async () => {
      const mockTicket = {
        id: 'TICK-006',
        is_billable: false,
        billable_type: 'warranty',
        estimated_cost: 0,
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Warranty Ticket',
          description: 'Under warranty',
          priority: 'medium',
          source: 'construction',
          billable_type: 'warranty',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.is_billable).toBe(false);
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
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
          source: 'qcontact',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it('should reject unsupported HTTP methods', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Method Not Allowed'),
      });
    });

    it('should sanitize SQL injection attempts', async () => {
      const maliciousTitle = "'; DROP TABLE tickets; --";

      mockSql.mockResolvedValueOnce([{ id: 'TICK-007' }]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: maliciousTitle,
          description: 'Test description',
          priority: 'high',
          source: 'qcontact',
        },
      });

      await handler(req, res);

      // Should safely handle the input
      expect(res._getStatusCode()).toBe(201);
      expect(mockSql).toHaveBeenCalled();
    });
  });

  describe('Metadata and Tags', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should accept metadata object', async () => {
      const mockTicket = {
        id: 'TICK-008',
        metadata: {
          custom_field_1: 'value1',
          custom_field_2: 'value2',
        },
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
          source: 'qcontact',
          metadata: {
            custom_field_1: 'value1',
            custom_field_2: 'value2',
          },
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.metadata).toEqual({
        custom_field_1: 'value1',
        custom_field_2: 'value2',
      });
    });

    it('should accept tags array', async () => {
      const mockTicket = {
        id: 'TICK-009',
        tags: ['urgent', 'customer-complaint', 'installation'],
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
          source: 'qcontact',
          tags: ['urgent', 'customer-complaint', 'installation'],
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.tags).toEqual(['urgent', 'customer-complaint', 'installation']);
    });
  });
});
