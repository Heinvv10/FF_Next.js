// pages/api/ticketing/__tests__/export.test.ts
// Integration tests for GET /api/ticketing/export
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../export';
import { getAuth } from '@clerk/nextjs/server';
import { neon } from '@neondatabase/serverless';

// Mock dependencies
vi.mock('@clerk/nextjs/server');
vi.mock('@neondatabase/serverless');

describe('GET /api/ticketing/export (Export Tickets)', () => {
  let mockSql: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSql = vi.fn();
    (neon as any).mockReturnValue(mockSql);
  });

  describe('HTTP Method Validation', () => {
    it('should reject POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Method Not Allowed'),
      });
    });

    it('should accept GET requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: 'user_123' });

      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Test',
          status: 'open',
          priority: 'medium',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      (getAuth as any).mockReturnValueOnce({ userId: null });

      const { req, res } = createMocks({
        method: 'GET',
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

      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Export Format', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should export as CSV by default', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Test Ticket',
          description: 'Test description',
          status: 'open',
          priority: 'medium',
          created_at: '2025-01-15T10:00:00Z',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toContain('text/csv');
      expect(res._getHeaders()['content-disposition']).toContain(
        'attachment; filename='
      );
    });

    it('should export as Excel when format=xlsx', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Test',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'xlsx' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('should reject invalid format parameter', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'pdf' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid format'),
      });
    });

    it('should export as JSON when format=json', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Test',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-type']).toContain('application/json');
      const data = JSON.parse(res._getData());
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Field Selection', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should export all fields by default', async () => {
      const mockTicket = {
        id: 'TICK-001',
        title: 'Test Ticket',
        description: 'Test description',
        status: 'open',
        priority: 'medium',
        source: 'qcontact',
        assigned_to: 'user_456',
        created_by: 'user_123',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      mockSql.mockResolvedValueOnce([mockTicket]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0]).toMatchObject(mockTicket);
    });

    it('should export only selected fields', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Test Ticket',
          status: 'open',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          fields: 'id,title,status',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0]).toMatchObject({
        id: 'TICK-001',
        title: 'Test Ticket',
        status: 'open',
      });
      expect(data[0].description).toBeUndefined();
      expect(data[0].priority).toBeUndefined();
    });

    it('should handle field aliases', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Test Ticket',
          status: 'open',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          fields: 'ticket_id,ticket_title,ticket_status',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0]).toHaveProperty('ticket_id', 'TICK-001');
      expect(data[0]).toHaveProperty('ticket_title', 'Test Ticket');
      expect(data[0]).toHaveProperty('ticket_status', 'open');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should filter by status', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', status: 'open' },
        { id: 'TICK-002', status: 'open' },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          status: 'open',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.every((t: any) => t.status === 'open')).toBe(true);
    });

    it('should filter by priority', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', priority: 'critical' },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          priority: 'critical',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].priority).toBe('critical');
    });

    it('should filter by date range', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          created_at: '2025-01-15T12:00:00Z',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          date_from: '2025-01-15',
          date_to: '2025-01-16',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.length).toBeGreaterThan(0);
    });

    it('should filter by project', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', project_id: 'proj_lawley' },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          project_id: 'proj_lawley',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].project_id).toBe('proj_lawley');
    });

    it('should combine multiple filters', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          status: 'open',
          priority: 'high',
          project_id: 'proj_lawley',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          status: 'open',
          priority: 'high',
          project_id: 'proj_lawley',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0]).toMatchObject({
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
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-003', created_at: '2025-01-15T12:00:00Z' },
        { id: 'TICK-002', created_at: '2025-01-15T11:00:00Z' },
        { id: 'TICK-001', created_at: '2025-01-15T10:00:00Z' },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].id).toBe('TICK-003');
    });

    it('should sort by specified field', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', priority: 'critical' },
        { id: 'TICK-002', priority: 'high' },
        { id: 'TICK-003', priority: 'medium' },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          sort_by: 'priority',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].priority).toBe('critical');
    });

    it('should sort ascending when specified', async () => {
      mockSql.mockResolvedValueOnce([
        { id: 'TICK-001', created_at: '2025-01-15T10:00:00Z' },
        { id: 'TICK-002', created_at: '2025-01-15T11:00:00Z' },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          sort_by: 'created_at',
          sort_order: 'asc',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].id).toBe('TICK-001');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should limit results to 1000 by default', async () => {
      const mockTickets = Array.from({ length: 1000 }, (_, i) => ({
        id: `TICK-${i.toString().padStart(3, '0')}`,
      }));

      mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.length).toBeLessThanOrEqual(1000);
    });

    it('should accept custom limit', async () => {
      const mockTickets = Array.from({ length: 500 }, (_, i) => ({
        id: `TICK-${i}`,
      }));

      mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          limit: '500',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.length).toBe(500);
    });

    it('should reject limit exceeding maximum', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          limit: '10000', // Exceeds max
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Maximum limit'),
      });
    });

    it('should support offset for pagination', async () => {
      const mockTickets = Array.from({ length: 100 }, (_, i) => ({
        id: `TICK-${i + 100}`, // Second page
      }));

      mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          limit: '100',
          offset: '100',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].id).toBe('TICK-100');
    });
  });

  describe('CSV Formatting', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should include headers in CSV', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Test',
          status: 'open',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
      });

      await handler(req, res);

      const csv = res._getData();
      expect(csv).toContain('id,title,status');
    });

    it('should escape commas in CSV values', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Issue with drop, causing delays',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
      });

      await handler(req, res);

      const csv = res._getData();
      expect(csv).toContain('"Issue with drop, causing delays"');
    });

    it('should escape quotes in CSV values', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Customer said "urgent"',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
      });

      await handler(req, res);

      const csv = res._getData();
      expect(csv).toContain('Customer said ""urgent""');
    });

    it('should handle newlines in CSV values', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          description: 'Line 1\nLine 2\nLine 3',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
      });

      await handler(req, res);

      const csv = res._getData();
      expect(csv).toContain('"Line 1\nLine 2\nLine 3"');
    });
  });

  describe('Excel Formatting', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should create Excel workbook with ticket data', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Test Ticket',
          status: 'open',
          priority: 'medium',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'xlsx' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()['content-disposition']).toContain('.xlsx');
    });

    it('should format dates properly in Excel', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T11:00:00Z',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'xlsx' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should apply column widths in Excel', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          title: 'Very long ticket title that should auto-size',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'xlsx' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Filename Generation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should generate filename with timestamp', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001' }]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
      });

      await handler(req, res);

      const disposition = res._getHeaders()['content-disposition'];
      expect(disposition).toMatch(/tickets_\d{8}_\d{6}\.csv/);
    });

    it('should include filter info in filename', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001' }]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          status: 'open',
          priority: 'high',
        },
      });

      await handler(req, res);

      const disposition = res._getHeaders()['content-disposition'];
      expect(disposition).toContain('open');
      expect(disposition).toContain('high');
    });

    it('should sanitize filename', async () => {
      mockSql.mockResolvedValueOnce([{ id: 'TICK-001' }]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          project_id: 'Project/With\\Special:Chars',
        },
      });

      await handler(req, res);

      const disposition = res._getHeaders()['content-disposition'];
      expect(disposition).not.toContain('/');
      expect(disposition).not.toContain('\\');
      expect(disposition).not.toContain(':');
    });
  });

  describe('Empty Results', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle empty result set for CSV', async () => {
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
      });

      await handler(req, res);

      const csv = res._getData();
      expect(csv).toContain('id,title,status'); // Headers only
    });

    it('should handle empty result set for JSON', async () => {
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data).toEqual([]);
    });

    it('should handle empty result set for Excel', async () => {
      mockSql.mockResolvedValueOnce([]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'xlsx' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should handle large exports efficiently', async () => {
      const mockTickets = Array.from({ length: 1000 }, (_, i) => ({
        id: `TICK-${i.toString().padStart(4, '0')}`,
        title: `Ticket ${i}`,
        status: 'open',
        priority: 'medium',
      }));

      mockSql.mockResolvedValueOnce(mockTickets);

      const startTime = Date.now();

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      const endTime = Date.now();

      expect(res._getStatusCode()).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Complete within 5 seconds
    });

    it('should stream large CSV exports', async () => {
      const mockTickets = Array.from({ length: 5000 }, (_, i) => ({
        id: `TICK-${i}`,
      }));

      mockSql.mockResolvedValueOnce(mockTickets);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'csv' },
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
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it('should handle invalid query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'csv',
          limit: 'invalid',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSql.mockRejectedValueOnce(new Error('Test error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Export error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Transformation', () => {
    beforeEach(() => {
      (getAuth as any).mockReturnValue({ userId: 'user_123' });
    });

    it('should format dates for human readability', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          created_at: '2025-01-15T10:30:45Z',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: { format: 'json' },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].created_at).toBeDefined();
    });

    it('should expand enum values', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          status: 'open',
          priority: 'critical',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          expand_enums: 'true',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].status).toBeDefined();
    });

    it('should include computed fields', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          created_at: '2025-01-15T10:00:00Z',
          resolved_at: '2025-01-15T14:00:00Z',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          include_computed: 'true',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0]).toHaveProperty('resolution_time_hours');
    });

    it('should mask sensitive fields', async () => {
      mockSql.mockResolvedValueOnce([
        {
          id: 'TICK-001',
          customer_email: 'customer@example.com',
          customer_phone: '0821234567',
        },
      ]);

      const { req, res } = createMocks({
        method: 'GET',
        query: {
          format: 'json',
          mask_sensitive: 'true',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data[0].customer_email).toContain('***');
      expect(data[0].customer_phone).toContain('***');
    });
  });
});
