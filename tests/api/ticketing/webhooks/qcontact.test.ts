// tests/api/ticketing/webhooks/qcontact.test.ts
// Integration tests for POST /api/ticketing/webhooks/qcontact
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/ticketing/webhooks/qcontact';

// Mock QContactClient
const mockProcessInboundCall = vi.fn();
const mockFindTicketByCallId = vi.fn();
const mockUpdateCallStatus = vi.fn();

vi.mock('@/modules/ticketing/integrations/qcontact/qcontactClient', () => ({
  QContactClient: {
    processInboundCall: (data: unknown) => mockProcessInboundCall(data),
    findTicketByCallId: (id: string) => mockFindTicketByCallId(id),
    updateCallStatus: (id: string, status: string) => mockUpdateCallStatus(id, status),
  },
}));

describe('POST /api/ticketing/webhooks/qcontact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
  });

  describe('HTTP Method Validation', () => {
    it('should reject GET requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('should accept POST requests', async () => {
      mockFindTicketByCallId.mockResolvedValueOnce(null);
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Webhook Signature Validation', () => {
    it('should reject requests without signature when configured', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid signature', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'wrong-secret',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should accept requests with valid signature', async () => {
      mockFindTicketByCallId.mockResolvedValueOnce(null);
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should skip signature validation if not configured', async () => {
      delete process.env.QCONTACT_WEBHOOK_SECRET;

      mockFindTicketByCallId.mockResolvedValueOnce(null);
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockFindTicketByCallId.mockResolvedValue(null);
      mockProcessInboundCall.mockResolvedValue({
        success: true,
        ticket_id: null,
      });
    });

    it('should require call_id field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BAD_REQUEST');
      expect(data.error.message).toContain('call_id');
    });

    it('should require caller_number field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BAD_REQUEST');
      expect(data.error.message).toContain('caller_number');
    });

    it('should require agent_id field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BAD_REQUEST');
      expect(data.error.message).toContain('agent_id');
    });

    it('should require call_outcome field', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('BAD_REQUEST');
      expect(data.error.message).toContain('call_outcome');
    });

    it('should accept all optional fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          caller_name: 'John Doe',
          agent_id: 'agent_456',
          agent_name: 'Jane Smith',
          call_start: '2025-01-15T10:00:00Z',
          call_end: '2025-01-15T10:15:00Z',
          call_duration: 900,
          call_notes: 'Customer reported installation issue',
          call_recording_url: 'https://qcontact.com/recordings/call_123.mp3',
          call_outcome: 'escalate',
          customer_id: 'cust_789',
          project_id: 'proj_lawley',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Event Type Filtering', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
    });

    it('should process call_ended events', async () => {
      mockFindTicketByCallId.mockResolvedValueOnce(null);
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-001',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockProcessInboundCall).toHaveBeenCalled();
    });

    it('should ignore other event types', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_started',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'in_progress',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.message).toContain('ignored');
      expect(data.data.processed).toBe(false);
      expect(mockProcessInboundCall).not.toHaveBeenCalled();
    });
  });

  describe('Ticket Creation Logic', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
      mockFindTicketByCallId.mockResolvedValue(null);
    });

    it('should create ticket for escalated calls', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-001',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          caller_name: 'John Doe',
          agent_id: 'agent_456',
          agent_name: 'Jane Smith',
          call_start: '2025-01-15T10:00:00Z',
          call_end: '2025-01-15T10:15:00Z',
          call_duration: 900,
          call_notes: 'Customer unhappy, needs follow-up',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.data.ticket_id).toBe('TICK-001');
      expect(data.data.auto_created).toBe(true);
    });

    it('should create ticket for callback requests', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-002',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_456',
          caller_number: '27829876543',
          agent_id: 'agent_789',
          call_outcome: 'callback',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.ticket_id).toBe('TICK-002');
    });

    it('should create ticket for voicemail outcomes', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-003',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_789',
          caller_number: '27825554444',
          agent_id: 'agent_123',
          call_outcome: 'voicemail',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.ticket_id).toBe('TICK-003');
    });

    it('should not create ticket for resolved calls', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_999',
          caller_number: '27821111111',
          agent_id: 'agent_111',
          call_outcome: 'resolved',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.message).toContain('Call processed');
      expect(data.data.ticket_id).toBeNull();
    });

    it('should attach call recording to ticket', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-004',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_555',
          caller_number: '27822222222',
          agent_id: 'agent_222',
          call_outcome: 'escalate',
          call_recording_url: 'https://qcontact.com/recordings/call_555.mp3',
        },
      });

      await handler(req, res);

      expect(mockProcessInboundCall).toHaveBeenCalledWith(
        expect.objectContaining({
          call_recording_url: 'https://qcontact.com/recordings/call_555.mp3',
        })
      );
    });
  });

  describe('Duplicate Prevention', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
    });

    it('should detect duplicate calls', async () => {
      mockFindTicketByCallId.mockResolvedValueOnce({
        id: 'TICK-001',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123',
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.message).toContain('already exists');
      expect(data.data.ticket_id).toBe('TICK-001');
      expect(data.data.already_exists).toBe(true);
      expect(mockProcessInboundCall).not.toHaveBeenCalled();
    });

    it('should process new calls normally', async () => {
      mockFindTicketByCallId.mockResolvedValueOnce(null);
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-002',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_999',
          caller_number: '27829999999',
          agent_id: 'agent_999',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.data.ticket_id).toBe('TICK-002');
      expect(data.data.already_exists).toBeUndefined();
      expect(mockProcessInboundCall).toHaveBeenCalled();
    });
  });

  describe('QContact Status Update', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
      mockFindTicketByCallId.mockResolvedValue(null);
      mockUpdateCallStatus.mockResolvedValue(undefined);
    });

    it('should update QContact call status after ticket creation', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-005',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_666',
          caller_number: '27823333333',
          agent_id: 'agent_333',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(mockUpdateCallStatus).toHaveBeenCalledWith(
        'call_666',
        'ticket_created'
      );
    });

    it('should not update status if no ticket created', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_777',
          caller_number: '27824444444',
          agent_id: 'agent_444',
          call_outcome: 'resolved',
        },
      });

      await handler(req, res);

      expect(mockUpdateCallStatus).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
      mockFindTicketByCallId.mockResolvedValue(null);
    });

    it('should handle service errors gracefully', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: false,
        error: 'Failed to create ticket',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_888',
          caller_number: '27825555555',
          agent_id: 'agent_555',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle exceptions gracefully', async () => {
      mockProcessInboundCall.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_888',
          caller_number: '27825555555',
          agent_id: 'agent_555',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockProcessInboundCall.mockRejectedValueOnce(
        new Error('Test error')
      );

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_999',
          caller_number: '27826666666',
          agent_id: 'agent_666',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'QContact webhook error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
      mockFindTicketByCallId.mockResolvedValue(null);
    });

    it('should return success response with ticket ID', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-123',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_final',
          caller_number: '27827777777',
          agent_id: 'agent_777',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.message).toContain('TICK-123');
      expect(data.data.ticket_id).toBe('TICK-123');
      expect(data.data.auto_created).toBe(true);
    });

    it('should return success without ticket for resolved calls', async () => {
      mockProcessInboundCall.mockResolvedValueOnce({
        success: true,
        ticket_id: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_resolved',
          caller_number: '27828888888',
          agent_id: 'agent_888',
          call_outcome: 'resolved',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.data.message).toContain('Call processed');
    });
  });
});
