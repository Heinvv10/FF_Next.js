import { describe, it, vi, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import * as ticketService from '../../services/ticketService';

// Mock the ticket service
vi.mock('../../services/ticketService');

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe('Simple Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should work', async () => {
    const mockResponse = {
      tickets: [],
      pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
    };

    vi.mocked(ticketService.listTickets).mockResolvedValue(mockResponse);

    const { GET } = await import('../../../../app/api/ticketing/tickets/route');

    const { req } = createMocks({
      method: 'GET',
      url: '/api/ticketing/tickets',
    });

    try {
      const response = await GET(req as any);
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.log('Error caught:', error.message);
      console.log('Stack:', error.stack);
    }
  });
});
