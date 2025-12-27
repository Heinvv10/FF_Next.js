import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('Debug API Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should debug GET request', async () => {
    const mockResponse = {
      tickets: [],
      pagination: {
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0,
      },
    };

    vi.mocked(ticketService.listTickets).mockResolvedValue(mockResponse);

    const { GET } = await import('../../../../app/api/ticketing/tickets/route');

    const { req } = createMocks({
      method: 'GET',
      url: '/api/ticketing/tickets',
    });

    const response = await GET(req as any);
    const data = await response.json();

    // Debug output
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    expect(response.status).toBe(200);
  });

  it('should debug POST request', async () => {
    const createPayload = {
      source: 'manual',
      title: 'Test',
      ticket_type: 'maintenance',
    };

    const mockTicket = {
      id: '123',
      ticket_uid: 'FT123456',
      ...createPayload,
    };

    vi.mocked(ticketService.createTicket).mockResolvedValue(mockTicket as any);

    const { POST } = await import('../../../../app/api/ticketing/tickets/route');

    const { req } = createMocks({
      method: 'POST',
      url: '/api/ticketing/tickets',
      body: createPayload,
    });

    const response = await POST(req as any);
    const data = await response.json();

    // Debug output
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  });
});
