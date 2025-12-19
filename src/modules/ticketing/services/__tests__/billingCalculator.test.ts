// src/modules/ticketing/services/__tests__/billingCalculator.test.ts
// Unit tests for BillingCalculator service
import { describe, it, expect } from 'vitest';
import { BillingCalculator } from '../billingCalculator';
import type { TicketPriority, TicketSource } from '../../types';

describe('BillingCalculator', () => {
  describe('calculateBillableAmount', () => {
    it('should calculate billable amount for critical priority', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'critical' as TicketPriority,
        source: 'qcontact' as TicketSource,
        estimated_hours: 2,
        billable_type: 'adhoc',
        billable_reason: 'Emergency fix',
      });

      expect(result.is_billable).toBe(true);
      expect(result.base_rate).toBe(250); // Critical rate
      expect(result.estimated_hours).toBe(2);
      expect(result.estimated_cost).toBe(500); // 250 * 2
      expect(result.billable_type).toBe('adhoc');
    });

    it('should calculate billable amount for high priority', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'high' as TicketPriority,
        source: 'email' as TicketSource,
        estimated_hours: 1.5,
        billable_type: 'adhoc',
        billable_reason: 'Urgent support',
      });

      expect(result.is_billable).toBe(true);
      expect(result.base_rate).toBe(200); // High rate
      expect(result.estimated_cost).toBe(300); // 200 * 1.5
    });

    it('should calculate billable amount for medium priority', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'medium' as TicketPriority,
        source: 'whatsapp_inbound' as TicketSource,
        estimated_hours: 3,
        billable_type: 'adhoc',
        billable_reason: 'Configuration change',
      });

      expect(result.is_billable).toBe(true);
      expect(result.base_rate).toBe(150); // Medium rate
      expect(result.estimated_cost).toBe(450); // 150 * 3
    });

    it('should calculate billable amount for low priority', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'low' as TicketPriority,
        source: 'internal' as TicketSource,
        estimated_hours: 1,
        billable_type: 'adhoc',
        billable_reason: 'Minor update',
      });

      expect(result.is_billable).toBe(true);
      expect(result.base_rate).toBe(100); // Low rate
      expect(result.estimated_cost).toBe(100); // 100 * 1
    });

    it('should apply emergency multiplier for critical after-hours', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'critical' as TicketPriority,
        source: 'qcontact' as TicketSource,
        estimated_hours: 1,
        billable_type: 'emergency',
        billable_reason: 'System down after hours',
      });

      expect(result.is_billable).toBe(true);
      expect(result.billable_type).toBe('emergency');
      expect(result.base_rate).toBe(250);
      // Emergency multiplier: 1.5x
      expect(result.estimated_cost).toBe(375); // 250 * 1 * 1.5
    });

    it('should return non-billable for construction source', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'high' as TicketPriority,
        source: 'construction' as TicketSource,
        estimated_hours: 2,
        billable_type: 'warranty',
        billable_reason: 'Under warranty',
      });

      expect(result.is_billable).toBe(false);
      expect(result.billable_type).toBe('warranty');
      expect(result.estimated_cost).toBe(0);
    });

    it('should return non-billable for internal source', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'medium' as TicketPriority,
        source: 'internal' as TicketSource,
        estimated_hours: 1,
        billable_type: 'warranty',
        billable_reason: 'Internal process',
      });

      expect(result.is_billable).toBe(false);
      expect(result.estimated_cost).toBe(0);
    });

    it('should handle zero estimated hours', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'high' as TicketPriority,
        source: 'qcontact' as TicketSource,
        estimated_hours: 0,
        billable_type: 'adhoc',
        billable_reason: 'Quick question',
      });

      expect(result.is_billable).toBe(true);
      expect(result.estimated_cost).toBe(0);
    });

    it('should handle fractional hours correctly', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'medium' as TicketPriority,
        source: 'email' as TicketSource,
        estimated_hours: 0.25, // 15 minutes
        billable_type: 'adhoc',
        billable_reason: 'Brief support',
      });

      expect(result.is_billable).toBe(true);
      expect(result.base_rate).toBe(150);
      expect(result.estimated_cost).toBe(37.5); // 150 * 0.25
    });

    it('should include project_id in calculation result', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'high' as TicketPriority,
        source: 'qcontact' as TicketSource,
        estimated_hours: 1,
        billable_type: 'adhoc',
        billable_reason: 'Support call',
        project_id: 'proj123',
      });

      expect(result.project_id).toBe('proj123');
    });

    it('should include customer_id in calculation result', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'medium' as TicketPriority,
        source: 'email' as TicketSource,
        estimated_hours: 2,
        billable_type: 'adhoc',
        billable_reason: 'Custom work',
        customer_id: 'cust456',
      });

      expect(result.customer_id).toBe('cust456');
    });
  });

  describe('getBillableRateForPriority', () => {
    it('should return correct rates for all priorities', () => {
      expect(BillingCalculator['getBillableRateForPriority']('critical')).toBe(250);
      expect(BillingCalculator['getBillableRateForPriority']('high')).toBe(200);
      expect(BillingCalculator['getBillableRateForPriority']('medium')).toBe(150);
      expect(BillingCalculator['getBillableRateForPriority']('low')).toBe(100);
    });
  });

  describe('isBillableSource', () => {
    it('should return true for billable sources', () => {
      expect(BillingCalculator['isBillableSource']('qcontact')).toBe(true);
      expect(BillingCalculator['isBillableSource']('whatsapp_inbound')).toBe(true);
      expect(BillingCalculator['isBillableSource']('whatsapp_outbound')).toBe(true);
      expect(BillingCalculator['isBillableSource']('email')).toBe(true);
      expect(BillingCalculator['isBillableSource']('adhoc')).toBe(true);
    });

    it('should return false for non-billable sources', () => {
      expect(BillingCalculator['isBillableSource']('construction')).toBe(false);
      expect(BillingCalculator['isBillableSource']('internal')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very large hour estimates', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'high' as TicketPriority,
        source: 'qcontact' as TicketSource,
        estimated_hours: 100,
        billable_type: 'adhoc',
        billable_reason: 'Major project',
      });

      expect(result.estimated_cost).toBe(20000); // 200 * 100
    });

    it('should handle emergency multiplier with fractional hours', () => {
      const result = BillingCalculator.calculateBillableAmount({
        priority: 'critical' as TicketPriority,
        source: 'qcontact' as TicketSource,
        estimated_hours: 0.5,
        billable_type: 'emergency',
        billable_reason: 'After hours emergency',
      });

      expect(result.estimated_cost).toBe(187.5); // 250 * 0.5 * 1.5
    });
  });
});
