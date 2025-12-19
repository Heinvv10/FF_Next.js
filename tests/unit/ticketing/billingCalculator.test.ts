// tests/unit/ticketing/billingCalculator.test.ts
// Unit tests for BillingCalculator service
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
import { BillingCalculator } from '@/modules/ticketing/services/billingCalculator';

describe('BillingCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('calculateBilling', () => {
    it('should return guarantee billing when project has active guarantee with matching DR', async () => {
      // Mock guarantee check - active guarantee found with DR
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'guarantee-1',
          project_id: 'project-1',
          project_name: 'Test Project',
          is_active: true,
          incident_count: 5,
          incident_limit: 10,
          dr_numbers: ['DR123456'],
        }],
      });

      const result = await BillingCalculator.calculateBilling({
        project_id: 'project-1',
        ticket_type: 'fault',
        priority: 'high',
        dr_number: 'DR123456',
      });

      expect(result.billing_type).toBe('guarantee');
      expect(result.estimated_cost).toBe(0);
    });

    it('should return SLA billing when covered by contract', async () => {
      // Mock guarantee check - no guarantee
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock SLA contract check - active contract
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'contract-1',
          client_id: 'client-1',
          contract_number: 'CNT-001',
          monthly_fee: 5000,
          is_active: true,
        }],
      });

      // Mock SLA config lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'sla-1', name: 'Standard SLA' }],
      });

      const result = await BillingCalculator.calculateBilling({
        project_id: 'project-1',
        ticket_type: 'fault',
        priority: 'high',
        sla_config_id: 'sla-1',
      });

      expect(result.billing_type).toBe('sla');
      expect(result.estimated_cost).not.toBeNull();
    });

    it('should calculate billable cost when no guarantee or contract', async () => {
      // Mock guarantee check - no guarantee
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock SLA contract check - no contract
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock fee schedule lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'fee-1',
          service_type: 'fault_repair',
          base_fee: 500,
          hourly_rate: 150,
          parts_markup_percent: 15,
          travel_fee: 100,
        }],
      });

      const result = await BillingCalculator.calculateBilling({
        project_id: 'project-1',
        ticket_type: 'fault',
        priority: 'high',
        service_type: 'fault_repair',
      });

      expect(result.billing_type).toBe('billable');
      expect(result.estimated_cost).toBeGreaterThan(0);
    });

    it('should return billable with requires_approval when no fee schedule', async () => {
      // Mock guarantee check - no guarantee
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock SLA contract check - no contract
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock fee schedule lookup - not found
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await BillingCalculator.calculateBilling({
        project_id: 'project-1',
        ticket_type: 'fault',
        priority: 'medium',
      });

      expect(result.billing_type).toBe('billable');
      expect(result.requires_approval).toBe(true);
    });

    it('should not return guarantee when DR not in covered list', async () => {
      // Mock guarantee check - guarantee exists but different DR
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'guarantee-1',
          project_id: 'project-1',
          dr_numbers: ['DR999999'], // Different DR
        }],
      });

      // Mock SLA contract check
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock fee schedule
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'fee-1',
          service_type: 'fault_repair',
          base_fee: 500,
        }],
      });

      const result = await BillingCalculator.calculateBilling({
        project_id: 'project-1',
        ticket_type: 'fault',
        priority: 'high',
        dr_number: 'DR123456', // Not in guarantee list
      });

      // Should fall through to billable
      expect(result.billing_type).toBe('billable');
    });
  });

  describe('edge cases', () => {
    it('should handle guarantee with null dr_numbers', async () => {
      // Guarantee with null dr_numbers does not automatically cover DR-based tickets
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'guarantee-1',
          project_id: 'project-1',
          dr_numbers: null, // No specific DRs
          service_types: ['fault_repair'], // Covers this service type
          is_active: true,
          incident_count: 0,
          incident_limit: null,
        }],
      });

      const result = await BillingCalculator.calculateBilling({
        project_id: 'project-1',
        ticket_type: 'fault',
        priority: 'high',
        service_type: 'fault_repair',
      });

      // Service type based guarantee should cover
      expect(result.billing_type).toBe('guarantee');
    });

    it('should handle guarantee at incident limit', async () => {
      // Guarantee at limit should not be returned by query
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({
        rows: [{
          base_fee: 500,
        }],
      });

      const result = await BillingCalculator.calculateBilling({
        project_id: 'project-1',
        ticket_type: 'fault',
        priority: 'high',
      });

      expect(result.billing_type).toBe('billable');
    });
  });
});
