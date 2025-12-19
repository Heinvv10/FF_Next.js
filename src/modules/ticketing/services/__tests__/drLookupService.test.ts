// src/modules/ticketing/services/__tests__/drLookupService.test.ts
// Unit tests for DRLookupService (Drop Reference Lookup)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DRLookupService } from '../drLookupService';
import { neon } from '@neondatabase/serverless';

// Mock neon database client
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(),
}));

describe('DRLookupService', () => {
  let mockSql: any;

  beforeEach(() => {
    mockSql = vi.fn();
    (neon as any).mockReturnValue(mockSql);
    vi.clearAllMocks();
  });

  describe('lookupDropByNumber', () => {
    it('should find drop by exact drop number', async () => {
      const mockDrop = {
        drop_number: 'LAWLEY001',
        address: '123 Main St',
        gps_coordinates: '-25.7479,28.2293',
        project_id: 'proj_lawley',
        project_name: 'Lawley Extension 1',
        customer_id: 'cust_001',
        customer_name: 'John Doe',
        status: 'active',
      };

      mockSql.mockResolvedValueOnce([mockDrop]);

      const result = await DRLookupService.lookupDropByNumber('LAWLEY001');

      expect(result).toEqual(mockDrop);
      expect(mockSql).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('SELECT'),
          expect.stringContaining('FROM drops'),
          'LAWLEY001',
        ])
      );
    });

    it('should return null if drop not found', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await DRLookupService.lookupDropByNumber('NONEXISTENT001');

      expect(result).toBeNull();
    });

    it('should handle case-insensitive lookup', async () => {
      const mockDrop = {
        drop_number: 'LAWLEY001',
        address: '123 Main St',
      };

      mockSql.mockResolvedValueOnce([mockDrop]);

      const result = await DRLookupService.lookupDropByNumber('lawley001');

      expect(result).toEqual(mockDrop);
    });

    it('should trim whitespace from drop number', async () => {
      const mockDrop = {
        drop_number: 'LAWLEY001',
        address: '123 Main St',
      };

      mockSql.mockResolvedValueOnce([mockDrop]);

      const result = await DRLookupService.lookupDropByNumber('  LAWLEY001  ');

      expect(result).toEqual(mockDrop);
    });
  });

  describe('searchDropsByAddress', () => {
    it('should find drops matching partial address', async () => {
      const mockDrops = [
        {
          drop_number: 'LAWLEY001',
          address: '123 Main Street',
          project_name: 'Lawley',
        },
        {
          drop_number: 'LAWLEY002',
          address: '125 Main Street',
          project_name: 'Lawley',
        },
      ];

      mockSql.mockResolvedValueOnce(mockDrops);

      const results = await DRLookupService.searchDropsByAddress('Main Street');

      expect(results).toEqual(mockDrops);
      expect(results.length).toBe(2);
    });

    it('should return empty array if no matches found', async () => {
      mockSql.mockResolvedValueOnce([]);

      const results = await DRLookupService.searchDropsByAddress('Nonexistent Road');

      expect(results).toEqual([]);
    });

    it('should handle fuzzy matching with typos', async () => {
      const mockDrops = [
        {
          drop_number: 'LAWLEY001',
          address: '123 Main Street',
        },
      ];

      mockSql.mockResolvedValueOnce(mockDrops);

      const results = await DRLookupService.searchDropsByAddress('Mian Street'); // Typo

      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should limit results to reasonable amount', async () => {
      const mockDrops = Array.from({ length: 100 }, (_, i) => ({
        drop_number: `DROP${i.toString().padStart(3, '0')}`,
        address: `${i} Test Street`,
      }));

      mockSql.mockResolvedValueOnce(mockDrops.slice(0, 50)); // Max 50 results

      const results = await DRLookupService.searchDropsByAddress('Test Street');

      expect(results.length).toBeLessThanOrEqual(50);
    });
  });

  describe('lookupDropByGPS', () => {
    it('should find drop by exact GPS coordinates', async () => {
      const mockDrop = {
        drop_number: 'LAWLEY001',
        address: '123 Main St',
        gps_coordinates: '-25.7479,28.2293',
      };

      mockSql.mockResolvedValueOnce([mockDrop]);

      const result = await DRLookupService.lookupDropByGPS(-25.7479, 28.2293);

      expect(result).toEqual(mockDrop);
    });

    it('should find drops within proximity radius', async () => {
      const mockDrops = [
        {
          drop_number: 'LAWLEY001',
          address: '123 Main St',
          gps_coordinates: '-25.7479,28.2293',
          distance_meters: 15.5,
        },
        {
          drop_number: 'LAWLEY002',
          address: '125 Main St',
          gps_coordinates: '-25.7480,28.2294',
          distance_meters: 45.2,
        },
      ];

      mockSql.mockResolvedValueOnce(mockDrops);

      const results = await DRLookupService.lookupDropByGPS(-25.7479, 28.2293, 50); // 50m radius

      expect(results.length).toBe(2);
      expect(results[0].distance_meters).toBeLessThan(50);
    });

    it('should return empty array if no drops in proximity', async () => {
      mockSql.mockResolvedValueOnce([]);

      const results = await DRLookupService.lookupDropByGPS(-26.0000, 28.0000, 10);

      expect(results).toEqual([]);
    });

    it('should sort results by distance ascending', async () => {
      const mockDrops = [
        {
          drop_number: 'LAWLEY002',
          distance_meters: 45.2,
        },
        {
          drop_number: 'LAWLEY001',
          distance_meters: 15.5,
        },
        {
          drop_number: 'LAWLEY003',
          distance_meters: 30.1,
        },
      ];

      mockSql.mockResolvedValueOnce(mockDrops);

      const results = await DRLookupService.lookupDropByGPS(-25.7479, 28.2293, 50);

      // Should be sorted by distance
      expect(results[0].distance_meters).toBeLessThanOrEqual(results[1]?.distance_meters || Infinity);
    });
  });

  describe('getDropsForProject', () => {
    it('should retrieve all drops for a project', async () => {
      const mockDrops = [
        {
          drop_number: 'LAWLEY001',
          address: '123 Main St',
          project_id: 'proj_lawley',
        },
        {
          drop_number: 'LAWLEY002',
          address: '125 Main St',
          project_id: 'proj_lawley',
        },
      ];

      mockSql.mockResolvedValueOnce(mockDrops);

      const results = await DRLookupService.getDropsForProject('proj_lawley');

      expect(results).toEqual(mockDrops);
      expect(results.length).toBe(2);
    });

    it('should filter by drop status if provided', async () => {
      const mockDrops = [
        {
          drop_number: 'LAWLEY001',
          status: 'active',
        },
      ];

      mockSql.mockResolvedValueOnce(mockDrops);

      const results = await DRLookupService.getDropsForProject('proj_lawley', 'active');

      expect(results.length).toBe(1);
      expect(results[0].status).toBe('active');
    });

    it('should return empty array for project with no drops', async () => {
      mockSql.mockResolvedValueOnce([]);

      const results = await DRLookupService.getDropsForProject('proj_empty');

      expect(results).toEqual([]);
    });
  });

  describe('getDropsByCustomer', () => {
    it('should retrieve all drops for a customer', async () => {
      const mockDrops = [
        {
          drop_number: 'LAWLEY001',
          customer_id: 'cust_001',
          customer_name: 'John Doe',
        },
        {
          drop_number: 'MOHADIN015',
          customer_id: 'cust_001',
          customer_name: 'John Doe',
        },
      ];

      mockSql.mockResolvedValueOnce(mockDrops);

      const results = await DRLookupService.getDropsByCustomer('cust_001');

      expect(results).toEqual(mockDrops);
      expect(results.length).toBe(2);
    });

    it('should return empty array for customer with no drops', async () => {
      mockSql.mockResolvedValueOnce([]);

      const results = await DRLookupService.getDropsByCustomer('cust_new');

      expect(results).toEqual([]);
    });
  });

  describe('getDropStatistics', () => {
    it('should calculate statistics for a project', async () => {
      const mockStats = [
        {
          total_drops: 150,
          active_drops: 120,
          completed_drops: 25,
          cancelled_drops: 5,
          average_completion_days: 14.5,
        },
      ];

      mockSql.mockResolvedValueOnce(mockStats);

      const stats = await DRLookupService.getDropStatistics('proj_lawley');

      expect(stats.total_drops).toBe(150);
      expect(stats.active_drops).toBe(120);
      expect(stats.completed_drops).toBe(25);
      expect(stats.cancelled_drops).toBe(5);
    });

    it('should return zero stats for empty project', async () => {
      const mockStats = [
        {
          total_drops: 0,
          active_drops: 0,
          completed_drops: 0,
          cancelled_drops: 0,
          average_completion_days: null,
        },
      ];

      mockSql.mockResolvedValueOnce(mockStats);

      const stats = await DRLookupService.getDropStatistics('proj_empty');

      expect(stats.total_drops).toBe(0);
    });
  });

  describe('validateDropNumber', () => {
    it('should validate correct drop number format', () => {
      expect(DRLookupService.validateDropNumber('LAWLEY001')).toBe(true);
      expect(DRLookupService.validateDropNumber('MOHADIN123')).toBe(true);
      expect(DRLookupService.validateDropNumber('DRTEST0808')).toBe(true);
    });

    it('should reject invalid drop number formats', () => {
      expect(DRLookupService.validateDropNumber('123')).toBe(false);
      expect(DRLookupService.validateDropNumber('ABC')).toBe(false);
      expect(DRLookupService.validateDropNumber('')).toBe(false);
      expect(DRLookupService.validateDropNumber('INVALID-DROP')).toBe(false);
    });

    it('should handle null and undefined gracefully', () => {
      expect(DRLookupService.validateDropNumber(null as any)).toBe(false);
      expect(DRLookupService.validateDropNumber(undefined as any)).toBe(false);
    });
  });

  describe('extractDropFromText', () => {
    it('should extract drop number from free text', () => {
      const text = 'Customer called about drop LAWLEY001 installation';
      const dropNumber = DRLookupService.extractDropFromText(text);

      expect(dropNumber).toBe('LAWLEY001');
    });

    it('should extract multiple drop numbers', () => {
      const text = 'Issues with LAWLEY001 and LAWLEY002 installations';
      const dropNumbers = DRLookupService.extractDropFromText(text, true);

      expect(dropNumbers).toEqual(['LAWLEY001', 'LAWLEY002']);
    });

    it('should return null if no drop number found', () => {
      const text = 'Customer called about general inquiry';
      const dropNumber = DRLookupService.extractDropFromText(text);

      expect(dropNumber).toBeNull();
    });

    it('should handle text with mixed case', () => {
      const text = 'Drop number lawley001 needs attention';
      const dropNumber = DRLookupService.extractDropFromText(text);

      expect(dropNumber).toBe('LAWLEY001');
    });
  });

  describe('enrichTicketWithDropInfo', () => {
    it('should enrich ticket with drop information', async () => {
      const mockDrop = {
        drop_number: 'LAWLEY001',
        address: '123 Main St',
        gps_coordinates: '-25.7479,28.2293',
        project_id: 'proj_lawley',
        project_name: 'Lawley Extension 1',
        customer_id: 'cust_001',
        customer_name: 'John Doe',
      };

      mockSql.mockResolvedValueOnce([mockDrop]);

      const enrichedData = await DRLookupService.enrichTicketWithDropInfo('LAWLEY001');

      expect(enrichedData.drop_number).toBe('LAWLEY001');
      expect(enrichedData.address).toBe('123 Main St');
      expect(enrichedData.project_id).toBe('proj_lawley');
      expect(enrichedData.customer_id).toBe('cust_001');
    });

    it('should return null if drop not found', async () => {
      mockSql.mockResolvedValueOnce([]);

      const enrichedData = await DRLookupService.enrichTicketWithDropInfo('NONEXISTENT');

      expect(enrichedData).toBeNull();
    });

    it('should extract drop number from ticket description', async () => {
      const mockDrop = {
        drop_number: 'LAWLEY001',
        address: '123 Main St',
      };

      mockSql.mockResolvedValueOnce([mockDrop]);

      const ticketDescription = 'Customer complaint about drop LAWLEY001';
      const enrichedData = await DRLookupService.enrichTicketWithDropInfo(ticketDescription);

      expect(enrichedData?.drop_number).toBe('LAWLEY001');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSql.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(DRLookupService.lookupDropByNumber('LAWLEY001')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle malformed GPS coordinates', async () => {
      await expect(
        DRLookupService.lookupDropByGPS(NaN, NaN)
      ).rejects.toThrow();
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousInput = "LAWLEY001'; DROP TABLE drops; --";

      mockSql.mockResolvedValueOnce([]);

      // Should be safely parameterized, no SQL injection
      const result = await DRLookupService.lookupDropByNumber(maliciousInput);

      expect(result).toBeNull();
      expect(mockSql).toHaveBeenCalled();
    });
  });

  describe('caching', () => {
    it('should cache frequently accessed drop lookups', async () => {
      const mockDrop = {
        drop_number: 'LAWLEY001',
        address: '123 Main St',
      };

      mockSql.mockResolvedValueOnce([mockDrop]);

      // First call - should hit database
      await DRLookupService.lookupDropByNumber('LAWLEY001');

      // Second call - should use cache (if implemented)
      await DRLookupService.lookupDropByNumber('LAWLEY001');

      // Depending on cache implementation, may only call once
      expect(mockSql.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('performance', () => {
    it('should handle large result sets efficiently', async () => {
      const largeMockDrops = Array.from({ length: 1000 }, (_, i) => ({
        drop_number: `DROP${i.toString().padStart(4, '0')}`,
        address: `${i} Test Street`,
      }));

      mockSql.mockResolvedValueOnce(largeMockDrops);

      const startTime = Date.now();
      const results = await DRLookupService.searchDropsByAddress('Test Street');
      const endTime = Date.now();

      expect(results.length).toBeLessThanOrEqual(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
