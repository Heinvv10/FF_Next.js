// tests/api/ticketing/list.test.ts
// Integration tests for GET /api/ticketing (list tickets)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../pages/api/ticketing/tickets';
import { getAuth } from '@clerk/nextjs/server';
import { mockSql } from '../../../vitest.setup';

// Mock dependencies
vi.mock('@clerk/nextjs/server');

describe('GET /api/ticketing (List Tickets)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSql.mockReset();
    mockSql.mockResolvedValue([]);
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: null });

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should accept authenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce([{ total: '0' }]); // Count
      mockSql.mockResolvedValueOnce([]); // Empty list

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should return paginated results with default page size', async () => {
      const mockTickets = Array.from({ length: 20 }, (_, i) => ({
        id: `TICK-${i.toString().padStart(3, '0')}`,
        title: `Ticket ${i}`,
      }));

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData()).data;
      expect(data.data.length).toBe(20);
      expect({ page: data.page, per_page: data.per_page }).toMatchObject({
        page: 1,
        per_page: 20,
      });
    });

    it('should accept custom page size', async () => {
      const mockTickets = Array.from({ length: 50 }, (_, i) => ({
        id: `TICK-${i}`,
      }));

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { per_page: '50' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data.length).toBe(50);
      expect(data.per_page).toBe(50);
    });

    it('should navigate to specific page', async () => {
      const mockTickets = Array.from({ length: 20 }, (_, i) => ({
        id: `TICK-${i + 20}`, // Page 2 results
      }));

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '2' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.page).toBe(2);
    });

    it('should limit maximum page size to 100', async () => {
      const mockTickets = Array.from({ length: 100 }, (_, i) => ({
        id: `TICK-${i}`,
      }));

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { per_page: '500' }, // Exceeds max
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.per_page).toBeLessThanOrEqual(100);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should filter by status', async () => {
      const mockTickets = [
        { id: 'TICK-001', status: 'open' },
        { id: 'TICK-002', status: 'open' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { status: 'open' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data.every((t: any) => t.status === 'open')).toBe(true);
    });

    it('should filter by priority', async () => {
      const mockTickets = [
        { id: 'TICK-001', priority: 'critical' },
        { id: 'TICK-002', priority: 'critical' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { priority: 'critical' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data.every((t: any) => t.priority === 'critical')).toBe(true);
    });

    it('should filter by assigned user', async () => {
      const mockTickets = [
        { id: 'TICK-001', assigned_to: 'user_456' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { assigned_to: 'user_456' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0].assigned_to).toBe('user_456');
    });

    it('should filter by project', async () => {
      const mockTickets = [
        { id: 'TICK-001', project_id: 'proj_lawley' },
        { id: 'TICK-002', project_id: 'proj_lawley' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { project_id: 'proj_lawley' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data.every((t: any) => t.project_id === 'proj_lawley')).toBe(true);
    });

    it('should filter by SLA breach status', async () => {
      const mockTickets = [
        { id: 'TICK-001', is_sla_breached: true },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { sla_breached: 'true' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0].is_sla_breached).toBe(true);
    });

    it('should combine multiple filters', async () => {
      const mockTickets = [
        {
          id: 'TICK-001',
          status: 'open',
          priority: 'high',
          project_id: 'proj_lawley',
        },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          status: 'open',
          priority: 'high',
          project_id: 'proj_lawley',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0]).toMatchObject({
        status: 'open',
        priority: 'high',
        project_id: 'proj_lawley',
      });
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should sort by created_at descending by default', async () => {
      const mockTickets = [
        { id: 'TICK-003', created_at: '2025-01-15T12:00:00Z' },
        { id: 'TICK-002', created_at: '2025-01-15T11:00:00Z' },
        { id: 'TICK-001', created_at: '2025-01-15T10:00:00Z' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0].id).toBe('TICK-003'); // Most recent first
    });

    it('should sort by priority', async () => {
      const mockTickets = [
        { id: 'TICK-001', priority: 'critical' },
        { id: 'TICK-002', priority: 'high' },
        { id: 'TICK-003', priority: 'medium' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { sort_by: 'priority' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0].priority).toBe('critical');
    });

    it('should sort ascending or descending', async () => {
      const mockTickets = [
        { id: 'TICK-001', created_at: '2025-01-15T10:00:00Z' },
        { id: 'TICK-002', created_at: '2025-01-15T11:00:00Z' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { sort_by: 'created_at', sort_order: 'asc' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0].id).toBe('TICK-001'); // Oldest first
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should search by ticket ID', async () => {
      const mockTickets = [
        { id: 'TICK-123', title: 'Ticket 123' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'TICK-123' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0].id).toBe('TICK-123');
    });

    it('should search in title', async () => {
      const mockTickets = [
        { id: 'TICK-001', title: 'Network connectivity issue' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'connectivity' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0].title).toContain('connectivity');
    });

    it('should search in description', async () => {
      const mockTickets = [
        {
          id: 'TICK-001',
          title: 'Issue',
          description: 'Customer reported installation problem',
        },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'installation' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0].description).toContain('installation');
    });

    it('should be case-insensitive', async () => {
      const mockTickets = [
        { id: 'TICK-001', title: 'Network Issue' },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'network' }, // Lowercase
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should return complete ticket objects', async () => {
      const mockTickets = [
        {
          id: 'TICK-001',
          title: 'Test Ticket',
          description: 'Test description',
          priority: 'high',
          status: 'open',
          source: 'qcontact',
          assigned_to: 'user_456',
          created_by: 'user_123',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ];

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data[0]).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        priority: expect.any(String),
        status: expect.any(String),
      });
    });

    it('should include pagination metadata', async () => {
      mockSql.mockResolvedValueOnce([{ total: '0' }]); // Count
      mockSql.mockResolvedValueOnce([]); // Tickets

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data).toMatchObject({
        page: expect.any(Number),
        per_page: expect.any(Number),
        total: expect.any(Number),
        total_pages: expect.any(Number),
      });
    });

    it('should return empty array when no tickets match', async () => {
      mockSql.mockResolvedValueOnce([{ total: '0' }]); // Count
      mockSql.mockResolvedValueOnce([]); // Tickets

      const { req, res } = createMocks({
        method: 'GET',
        query: { status: 'nonexistent_status' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData()).data;
      expect(data.data).toEqual([]);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle large result sets efficiently', async () => {
      const mockTickets = Array.from({ length: 100 }, (_, i) => ({
        id: `TICK-${i}`,
      }));

      mockSql.mockResolvedValueOnce([{ total: String(mockTickets.length) }]); mockSql.mockResolvedValueOnce(mockTickets);

      const startTime = Date.now();

      const { req, res } = createMocks({
        method: 'GET',
        query: { per_page: '100' },
      });

      await handler(req, res);

      const endTime = Date.now();

      expect(res._getStatusCode()).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.objectContaining({ code: expect.any(String) }),
      });
    });

    it('should handle invalid query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: 'invalid' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });
});
