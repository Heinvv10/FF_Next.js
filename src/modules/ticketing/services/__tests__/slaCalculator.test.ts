// src/modules/ticketing/services/__tests__/slaCalculator.test.ts
// Unit tests for SLACalculator service
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SLACalculator } from '../slaCalculator';
import type { TicketPriority } from '../../types';

describe('SLACalculator', () => {
  beforeEach(() => {
    // Reset Date.now() mock before each test
    vi.restoreAllMocks();
  });

  describe('calculateSLADeadlines', () => {
    it('should calculate correct deadlines for critical priority', () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      const result = SLACalculator.calculateSLADeadlines('critical' as TicketPriority, createdAt);

      // Critical: Response 1h, Resolution 4h
      const expectedResponse = new Date('2025-01-15T11:00:00Z');
      const expectedResolution = new Date('2025-01-15T14:00:00Z');

      expect(result.response_deadline.getTime()).toBe(expectedResponse.getTime());
      expect(result.resolution_deadline.getTime()).toBe(expectedResolution.getTime());
      expect(result.priority).toBe('critical');
      expect(result.response_hours).toBe(1);
      expect(result.resolution_hours).toBe(4);
    });

    it('should calculate correct deadlines for high priority', () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      const result = SLACalculator.calculateSLADeadlines('high' as TicketPriority, createdAt);

      // High: Response 4h, Resolution 8h
      const expectedResponse = new Date('2025-01-15T14:00:00Z');
      const expectedResolution = new Date('2025-01-15T18:00:00Z');

      expect(result.response_deadline.getTime()).toBe(expectedResponse.getTime());
      expect(result.resolution_deadline.getTime()).toBe(expectedResolution.getTime());
      expect(result.response_hours).toBe(4);
      expect(result.resolution_hours).toBe(8);
    });

    it('should calculate correct deadlines for medium priority', () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      const result = SLACalculator.calculateSLADeadlines('medium' as TicketPriority, createdAt);

      // Medium: Response 8h, Resolution 24h
      const expectedResponse = new Date('2025-01-15T18:00:00Z');
      const expectedResolution = new Date('2025-01-16T10:00:00Z');

      expect(result.response_deadline.getTime()).toBe(expectedResponse.getTime());
      expect(result.resolution_deadline.getTime()).toBe(expectedResolution.getTime());
      expect(result.response_hours).toBe(8);
      expect(result.resolution_hours).toBe(24);
    });

    it('should calculate correct deadlines for low priority', () => {
      const createdAt = new Date('2025-01-15T10:00:00Z');

      const result = SLACalculator.calculateSLADeadlines('low' as TicketPriority, createdAt);

      // Low: Response 24h, Resolution 48h
      const expectedResponse = new Date('2025-01-16T10:00:00Z');
      const expectedResolution = new Date('2025-01-17T10:00:00Z');

      expect(result.response_deadline.getTime()).toBe(expectedResponse.getTime());
      expect(result.resolution_deadline.getTime()).toBe(expectedResolution.getTime());
      expect(result.response_hours).toBe(24);
      expect(result.resolution_hours).toBe(48);
    });

    it('should use current time if no createdAt provided', () => {
      const fixedTime = new Date('2025-01-15T10:00:00Z');
      vi.setSystemTime(fixedTime);

      const result = SLACalculator.calculateSLADeadlines('critical' as TicketPriority);

      const expectedResponse = new Date('2025-01-15T11:00:00Z');
      const expectedResolution = new Date('2025-01-15T14:00:00Z');

      expect(result.response_deadline.getTime()).toBe(expectedResponse.getTime());
      expect(result.resolution_deadline.getTime()).toBe(expectedResolution.getTime());
    });
  });

  describe('checkSLAStatus', () => {
    it('should detect response deadline breach', () => {
      const fixedTime = new Date('2025-01-15T12:00:00Z');
      vi.setSystemTime(fixedTime);

      const ticket = {
        sla_response_deadline: new Date('2025-01-15T11:00:00Z'), // 1 hour ago
        sla_resolution_deadline: new Date('2025-01-15T14:00:00Z'),
        status: 'open' as const,
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      expect(result.response_breached).toBe(true);
      expect(result.resolution_breached).toBe(false);
      expect(result.is_breached).toBe(true);
      expect(result.response_remaining_ms).toBeLessThan(0);
      expect(result.resolution_remaining_ms).toBeGreaterThan(0);
    });

    it('should detect resolution deadline breach', () => {
      const fixedTime = new Date('2025-01-15T15:00:00Z');
      vi.setSystemTime(fixedTime);

      const ticket = {
        sla_response_deadline: new Date('2025-01-15T11:00:00Z'),
        sla_resolution_deadline: new Date('2025-01-15T14:00:00Z'), // 1 hour ago
        status: 'in_progress' as const,
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      expect(result.response_breached).toBe(true);
      expect(result.resolution_breached).toBe(true);
      expect(result.is_breached).toBe(true);
    });

    it('should detect when SLA is at risk (within 2 hours)', () => {
      const fixedTime = new Date('2025-01-15T10:30:00Z');
      vi.setSystemTime(fixedTime);

      const ticket = {
        sla_response_deadline: new Date('2025-01-15T12:00:00Z'), // 1.5 hours away
        sla_resolution_deadline: new Date('2025-01-15T14:00:00Z'),
        status: 'open' as const,
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      expect(result.response_breached).toBe(false);
      expect(result.resolution_breached).toBe(false);
      expect(result.is_breached).toBe(false);
      expect(result.is_at_risk).toBe(true); // Within 2 hours
    });

    it('should return safe status when plenty of time remains', () => {
      const fixedTime = new Date('2025-01-15T10:00:00Z');
      vi.setSystemTime(fixedTime);

      const ticket = {
        sla_response_deadline: new Date('2025-01-15T14:00:00Z'), // 4 hours away
        sla_resolution_deadline: new Date('2025-01-15T18:00:00Z'), // 8 hours away
        status: 'open' as const,
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      expect(result.response_breached).toBe(false);
      expect(result.resolution_breached).toBe(false);
      expect(result.is_breached).toBe(false);
      expect(result.is_at_risk).toBe(false);
    });

    it('should handle paused SLA (awaiting_customer status)', () => {
      const fixedTime = new Date('2025-01-15T15:00:00Z');
      vi.setSystemTime(fixedTime);

      const ticket = {
        sla_response_deadline: new Date('2025-01-15T11:00:00Z'), // Would be breached
        sla_resolution_deadline: new Date('2025-01-15T14:00:00Z'), // Would be breached
        status: 'awaiting_customer' as const, // SLA paused
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      // SLA is paused, so no breaches
      expect(result.response_breached).toBe(false);
      expect(result.resolution_breached).toBe(false);
      expect(result.is_breached).toBe(false);
    });

    it('should handle resolved status (SLA no longer applies)', () => {
      const fixedTime = new Date('2025-01-15T15:00:00Z');
      vi.setSystemTime(fixedTime);

      const ticket = {
        sla_response_deadline: new Date('2025-01-15T11:00:00Z'),
        sla_resolution_deadline: new Date('2025-01-15T14:00:00Z'),
        status: 'resolved' as const, // Ticket resolved
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      // SLA no longer applies
      expect(result.response_breached).toBe(false);
      expect(result.resolution_breached).toBe(false);
      expect(result.is_breached).toBe(false);
    });

    it('should handle closed status (SLA no longer applies)', () => {
      const fixedTime = new Date('2025-01-15T15:00:00Z');
      vi.setSystemTime(fixedTime);

      const ticket = {
        sla_response_deadline: new Date('2025-01-15T11:00:00Z'),
        sla_resolution_deadline: new Date('2025-01-15T14:00:00Z'),
        status: 'closed' as const,
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      expect(result.is_breached).toBe(false);
    });
  });

  describe('getSLAConfiguration', () => {
    it('should return correct configuration for all priorities', () => {
      const critical = SLACalculator['getSLAConfiguration']('critical');
      expect(critical.response_hours).toBe(1);
      expect(critical.resolution_hours).toBe(4);

      const high = SLACalculator['getSLAConfiguration']('high');
      expect(high.response_hours).toBe(4);
      expect(high.resolution_hours).toBe(8);

      const medium = SLACalculator['getSLAConfiguration']('medium');
      expect(medium.response_hours).toBe(8);
      expect(medium.resolution_hours).toBe(24);

      const low = SLACalculator['getSLAConfiguration']('low');
      expect(low.response_hours).toBe(24);
      expect(low.resolution_hours).toBe(48);
    });
  });

  describe('edge cases', () => {
    it('should handle exactly at deadline boundary', () => {
      const deadline = new Date('2025-01-15T11:00:00Z');
      vi.setSystemTime(deadline);

      const ticket = {
        sla_response_deadline: deadline,
        sla_resolution_deadline: new Date('2025-01-15T14:00:00Z'),
        status: 'open' as const,
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      // At exact deadline time, should not be breached (0ms remaining)
      expect(result.response_breached).toBe(false);
      expect(result.response_remaining_ms).toBe(0);
    });

    it('should handle very old tickets with extreme breaches', () => {
      const fixedTime = new Date('2025-01-20T10:00:00Z');
      vi.setSystemTime(fixedTime);

      const ticket = {
        sla_response_deadline: new Date('2025-01-15T11:00:00Z'), // 5 days ago
        sla_resolution_deadline: new Date('2025-01-15T14:00:00Z'), // 5 days ago
        status: 'open' as const,
      };

      const result = SLACalculator.checkSLAStatus(ticket);

      expect(result.response_breached).toBe(true);
      expect(result.resolution_breached).toBe(true);
      expect(result.response_remaining_ms).toBeLessThan(-432000000); // More than 5 days in ms
    });

    it('should calculate deadlines spanning across midnight', () => {
      const createdAt = new Date('2025-01-15T23:00:00Z'); // 11 PM

      const result = SLACalculator.calculateSLADeadlines('high' as TicketPriority, createdAt);

      // High: Response 4h = 3 AM next day
      const expectedResponse = new Date('2025-01-16T03:00:00Z');

      expect(result.response_deadline.getTime()).toBe(expectedResponse.getTime());
    });
  });
});
