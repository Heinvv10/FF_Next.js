// tests/unit/ticketing/drLookupService.test.ts
// Unit tests for DRLookupService (Drop Reference Lookup)
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
import { DRLookupService } from '@/modules/ticketing/services/drLookupService';

describe('DRLookupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('lookupDR', () => {
    it('should find DR in SOW drops table', async () => {
      // Mock SOW drops query - found
      mockQuery.mockResolvedValueOnce({
        rows: [{
          drop_number: 'DR123456',
          project_id: 'project-1',
          address: '123 Test Street',
          latitude: '-26.2041',
          longitude: '28.0473',
          status: 'installed',
        }],
      });

      // Mock project name lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{ name: 'Test Project' }],
      });

      // Mock guarantee check
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock SOW data
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await DRLookupService.lookupDR('DR123456');

      expect(result.exists).toBe(true);
      expect(result.dr_number).toBe('DR123456');
      expect(result.project_id).toBe('project-1');
      expect(result.address).toBe('123 Test Street');
    });

    it('should return not found for non-existent DR', async () => {
      // Mock SOW drops query - not found
      mockQuery.mockResolvedValueOnce({ rows: [] });

      // Mock WA Monitor query - not found
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await DRLookupService.lookupDR('DR999999');

      expect(result.exists).toBe(false);
      expect(result.dr_number).toBe('DR999999');
    });

    it('should include guarantee details when covered', async () => {
      // Mock SOW drops query - found the drop
      mockQuery.mockResolvedValueOnce({
        rows: [{
          drop_number: 'DR123456',
          project_id: 'project-1',
          address: '123 Test Street',
          latitude: '-26.2041',
          longitude: '28.0473',
          status: 'installed',
        }],
      });

      // Mock guarantee check - DR is in the guarantee list
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'guarantee-1',
          project_name: 'Test Project',
          end_date: new Date('2026-01-01'),
          incident_limit: 10,
          incident_count: 2,
          dr_numbers: ['DR123456'], // This DR is covered
        }],
      });

      // Mock SOW fibre data lookup
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await DRLookupService.lookupDR('DR123456');

      expect(result.is_guaranteed).toBe(true);
      expect(result.guarantee_details).toBeDefined();
      expect(result.guarantee_details?.incident_count).toBe(2);
    });
  });

  describe('validateDR', () => {
    it('should validate correctly formatted DR number', async () => {
      const result = await DRLookupService.validateDR('DR123456');

      expect(result.is_valid).toBe(true);
      expect(result.dr_number).toBe('DR123456');
    });

    it('should reject invalid DR format', async () => {
      const result = await DRLookupService.validateDR('INVALID');

      expect(result.is_valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide suggestions for common mistakes', async () => {
      const result = await DRLookupService.validateDR('123456');

      expect(result.is_valid).toBe(false);
      expect(result.suggestions).toContain('DR123456');
    });
  });

  describe('searchDRNumbers', () => {
    it('should return matching DR numbers', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { drop_number: 'DR123456', project_id: 'p1', latitude: '-26.2', longitude: '28.0', status: 'installed' },
          { drop_number: 'DR123457', project_id: 'p1', latitude: '-26.2', longitude: '28.0', status: 'pending' },
        ],
      });

      // Mock guarantee checks for each result
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const results = await DRLookupService.searchDRNumbers({
        search_term: 'DR1234',
        limit: 10,
      });

      expect(results).toHaveLength(2);
      expect(results[0].dr_number).toBe('DR123456');
    });

    it('should filter by project_id when provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { drop_number: 'DR123456', project_id: 'project-1', latitude: '-26.2', longitude: '28.0', status: 'installed' },
        ],
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });

      const results = await DRLookupService.searchDRNumbers({
        search_term: 'DR123',
        project_id: 'project-1',
        limit: 5,
      });

      expect(results).toHaveLength(1);
    });

    it('should respect limit parameter', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { drop_number: 'DR100001', project_id: 'p1', latitude: '-26.2', longitude: '28.0', status: 'installed' },
          { drop_number: 'DR100002', project_id: 'p1', latitude: '-26.2', longitude: '28.0', status: 'installed' },
        ],
      });

      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const results = await DRLookupService.searchDRNumbers({
        search_term: 'DR1',
        limit: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });
});
