// tests/unit/ticketing/slaCalculator.test.ts
// Unit tests for SLACalculator service
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to create mock before hoisting
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

// Mock the neon database
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => ({
    query: mockQuery,
  })),
}));

// Import after mocking
import { SLACalculator } from '@/modules/ticketing/services/slaCalculator';

describe('SLACalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('calculateSLA', () => {
    it('should throw error when SLA config not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        SLACalculator.calculateSLA({
          ticket_id: 'ticket-1',
          sla_config_id: 'invalid-config',
          created_at: new Date(),
          priority: 'high',
        })
      ).rejects.toThrow('SLA configuration not found');
    });

    it('should calculate SLA for 24/7 config', async () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      // Mock SLA config query
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'sla-1',
          name: 'Standard SLA',
          business_hours_only: false,
          critical_response_minutes: 60,
          high_response_minutes: 240,
          medium_response_minutes: 480,
          low_response_minutes: 1440,
          critical_resolution_minutes: 240,
          high_resolution_minutes: 480,
          medium_resolution_minutes: 1440,
          low_resolution_minutes: 2880,
        }],
      });

      const result = await SLACalculator.calculateSLA({
        ticket_id: 'ticket-1',
        sla_config_id: 'sla-1',
        created_at: createdAt,
        priority: 'high',
        current_time: new Date('2025-01-15T11:00:00Z'), // 1 hour later
      });

      expect(result).toBeDefined();
      expect(result.sla_config_id).toBe('sla-1');
      expect(result.sla_config_name).toBe('Standard SLA');
      expect(result.response_deadline).toBeInstanceOf(Date);
      expect(result.resolution_deadline).toBeInstanceOf(Date);
      expect(result.is_breached).toBe(false); // 1hr elapsed, 8hr resolution for high
    });

    it('should detect response breach when past response deadline', async () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'sla-1',
          name: 'Standard SLA',
          business_hours_only: false,
          critical_response_minutes: 60,
          high_response_minutes: 240, // 4 hours
          medium_response_minutes: 480,
          low_response_minutes: 1440,
          critical_resolution_minutes: 240,
          high_resolution_minutes: 480, // 8 hours
          medium_resolution_minutes: 1440,
          low_resolution_minutes: 2880,
        }],
      });

      const result = await SLACalculator.calculateSLA({
        ticket_id: 'ticket-1',
        sla_config_id: 'sla-1',
        created_at: createdAt,
        priority: 'high',
        current_time: new Date('2025-01-15T15:00:00Z'), // 5 hours later (past 4h response)
      });

      expect(result.breach_status).toBe('response_breached');
    });

    it('should detect resolution breach when past resolution deadline', async () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'sla-1',
          name: 'Standard SLA',
          business_hours_only: false,
          critical_response_minutes: 60,
          high_response_minutes: 240,
          medium_response_minutes: 480,
          low_response_minutes: 1440,
          critical_resolution_minutes: 240,
          high_resolution_minutes: 480, // 8 hours
          medium_resolution_minutes: 1440,
          low_resolution_minutes: 2880,
        }],
      });

      const result = await SLACalculator.calculateSLA({
        ticket_id: 'ticket-1',
        sla_config_id: 'sla-1',
        created_at: createdAt,
        priority: 'high',
        current_time: new Date('2025-01-15T20:00:00Z'), // 10 hours later (past 8h resolution)
      });

      expect(result.is_breached).toBe(true);
      expect(result.breach_status).toBe('both_breached');
    });

    it('should handle critical priority with shortest deadlines', async () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'sla-1',
          name: 'Critical SLA',
          business_hours_only: false,
          critical_response_minutes: 60, // 1 hour
          high_response_minutes: 240,
          medium_response_minutes: 480,
          low_response_minutes: 1440,
          critical_resolution_minutes: 240, // 4 hours
          high_resolution_minutes: 480,
          medium_resolution_minutes: 1440,
          low_resolution_minutes: 2880,
        }],
      });

      const result = await SLACalculator.calculateSLA({
        ticket_id: 'ticket-1',
        sla_config_id: 'sla-1',
        created_at: createdAt,
        priority: 'critical',
        current_time: createdAt,
      });

      // Response deadline should be 1 hour from creation
      const expectedResponse = new Date(createdAt.getTime() + 60 * 60000);
      expect(result.response_deadline.getTime()).toBe(expectedResponse.getTime());

      // Resolution deadline should be 4 hours from creation
      const expectedResolution = new Date(createdAt.getTime() + 240 * 60000);
      expect(result.resolution_deadline.getTime()).toBe(expectedResolution.getTime());
    });

    it('should calculate warning threshold at 80% elapsed time', async () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'sla-1',
          name: 'Standard SLA',
          business_hours_only: false,
          critical_response_minutes: 60,
          high_response_minutes: 240,
          medium_response_minutes: 480,
          low_response_minutes: 1440,
          critical_resolution_minutes: 240,
          high_resolution_minutes: 480, // 8 hours = 480 min
          medium_resolution_minutes: 1440,
          low_resolution_minutes: 2880,
        }],
      });

      // 80% of 480 minutes = 384 minutes = 6.4 hours
      const result = await SLACalculator.calculateSLA({
        ticket_id: 'ticket-1',
        sla_config_id: 'sla-1',
        created_at: createdAt,
        priority: 'high',
        current_time: new Date('2025-01-15T17:00:00Z'), // 7 hours later (87.5% elapsed)
      });

      expect(result.warning_threshold_reached).toBe(true);
    });
  });

  describe('pauseSLA', () => {
    it('should pause SLA tracking for a ticket', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'ticket-1',
          sla_paused_at: new Date(),
          sla_paused_duration: 0,
          due_at: new Date('2025-01-16T10:00:00Z'),
        }],
      });

      const result = await SLACalculator.pauseSLA('ticket-1');

      expect(result).toBeDefined();
      expect(result.ticket_id).toBe('ticket-1');
      expect(result.paused_at).toBeInstanceOf(Date);
      expect(result.paused_duration_minutes).toBe(0);
    });

    it('should throw error when ticket not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(SLACalculator.pauseSLA('invalid-ticket')).rejects.toThrow(
        'Ticket not found'
      );
    });
  });

  describe('resumeSLA', () => {
    it('should resume SLA tracking and calculate pause duration', async () => {
      const pausedAt = new Date('2025-01-15T10:00:00Z');
      const dueAt = new Date('2025-01-15T18:00:00Z');

      // Mock get ticket query
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'ticket-1',
          sla_paused_at: pausedAt,
          sla_paused_duration: 0,
          due_at: dueAt,
        }],
      });

      // Mock update query
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'ticket-1',
          sla_paused_at: null,
          sla_paused_duration: 120,
          due_at: new Date(dueAt.getTime() + 120 * 60000),
        }],
      });

      const result = await SLACalculator.resumeSLA('ticket-1');

      expect(result).toBeDefined();
      expect(result.paused_at).toBeNull();
      expect(result.paused_duration_minutes).toBeGreaterThan(0);
    });

    it('should throw error when ticket not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(SLACalculator.resumeSLA('invalid-ticket')).rejects.toThrow(
        'Ticket not found'
      );
    });

    it('should throw error when ticket is not paused', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'ticket-1',
          sla_paused_at: null, // Not paused
          sla_paused_duration: 0,
          due_at: new Date(),
        }],
      });

      await expect(SLACalculator.resumeSLA('ticket-1')).rejects.toThrow(
        'not currently paused'
      );
    });
  });

  describe('getBreachedTickets', () => {
    it('should return tickets with breached SLAs', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'ticket-1', sla_breached: true, priority: 'high' },
          { id: 'ticket-2', sla_breached: true, priority: 'critical' },
        ],
      });

      const tickets = await SLACalculator.getBreachedTickets({});

      expect(tickets).toHaveLength(2);
      expect(tickets[0].sla_breached).toBe(true);
    });

    it('should filter by project_id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ticket-1', project_id: 'project-1', sla_breached: true }],
      });

      const tickets = await SLACalculator.getBreachedTickets({
        project_id: 'project-1',
      });

      expect(tickets).toHaveLength(1);
    });

    it('should filter by priority', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ticket-1', priority: 'critical', sla_breached: true }],
      });

      const tickets = await SLACalculator.getBreachedTickets({
        priority: 'critical',
      });

      expect(tickets).toHaveLength(1);
    });
  });

  describe('checkSLAAtRisk', () => {
    it('should return false when ticket is paused', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'ticket-1',
          created_at: new Date(),
          due_at: new Date(),
          sla_paused_at: new Date(), // Paused
          sla_config_id: 'sla-1',
          priority: 'high',
        }],
      });

      const atRisk = await SLACalculator.checkSLAAtRisk('ticket-1');

      expect(atRisk).toBe(false);
    });
  });
});
