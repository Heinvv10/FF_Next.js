// tests/api/ticketing/webhooks/qcontact.test.ts
// Integration tests for POST /api/ticketing/webhooks/qcontact
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/ticketing/webhooks/qcontact';
import { QContactClient } from '@/modules/ticketing/integrations/qcontact/qcontactClient';

// Mock QContactClient
vi.mock('@/modules/ticketing/integrations/qcontact/qcontactClient');

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
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Method Not Allowed'),
      });
    });

    it('should accept POST requests', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
        success: true,
      });

      const { req, res} = createMocks({
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
    it('should reject requests without signature', async () => {
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
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid webhook signature'),
      });
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
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
        success: true,
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

      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
        success: true,
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
      (QContactClient.processInboundCall as any).mockResolvedValue({
        success: true,
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
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('call_id'),
      });
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
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('caller_number'),
      });
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
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('agent_id'),
      });
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
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('call_outcome'),
      });
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
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
      expect(QContactClient.processInboundCall).toHaveBeenCalled();
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
      expect(data.message).toContain('ignored');
      expect(data.processed).toBe(false);
      expect(QContactClient.processInboundCall).not.toHaveBeenCalled();
    });
  });

  describe('Ticket Creation Logic', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
    });

    it('should create ticket for escalated calls', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
      expect(data.ticket_id).toBe('TICK-001');
      expect(data.auto_created).toBe(true);
    });

    it('should create ticket for callback requests', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
      expect(data.ticket_id).toBe('TICK-002');
    });

    it('should create ticket for voicemail outcomes', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
      expect(data.ticket_id).toBe('TICK-003');
    });

    it('should not create ticket for resolved calls', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
      expect(data.message).toContain('Call processed');
      expect(data.ticket_id).toBeNull();
    });

    it('should attach call recording to ticket', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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

      expect(QContactClient.processInboundCall).toHaveBeenCalledWith(
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
      (QContactClient.findTicketByCallId as any).mockResolvedValueOnce({
        id: 'TICK-001',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          event_type: 'call_ended',
          call_id: 'call_123', // Duplicate call ID
          caller_number: '27821234567',
          agent_id: 'agent_456',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.message).toContain('already exists');
      expect(data.ticket_id).toBe('TICK-001');
      expect(data.already_exists).toBe(true);
      expect(QContactClient.processInboundCall).not.toHaveBeenCalled();
    });

    it('should process new calls normally', async () => {
      (QContactClient.findTicketByCallId as any).mockResolvedValueOnce(null);
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
          call_id: 'call_999', // New call ID
          caller_number: '27829999999',
          agent_id: 'agent_999',
          call_outcome: 'escalate',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.ticket_id).toBe('TICK-002');
      expect(data.already_exists).toBeUndefined();
      expect(QContactClient.processInboundCall).toHaveBeenCalled();
    });
  });

  describe('QContact Status Update', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
      (QContactClient.updateCallStatus as any).mockResolvedValue(undefined);
    });

    it('should update QContact call status after ticket creation', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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

      expect(QContactClient.updateCallStatus).toHaveBeenCalledWith(
        'call_666',
        'ticket_created'
      );
    });

    it('should not update status if no ticket created', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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

      expect(QContactClient.updateCallStatus).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.QCONTACT_WEBHOOK_SECRET = 'test-secret-key';
    });

    it('should handle service errors gracefully', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('Failed to create ticket'),
      });
    });

    it('should handle exceptions gracefully', async () => {
      (QContactClient.processInboundCall as any).mockRejectedValueOnce(
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
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (QContactClient.processInboundCall as any).mockRejectedValueOnce(
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
    });

    it('should return success response with ticket ID', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
      expect(data).toMatchObject({
        success: true,
        message: expect.stringContaining('TICK-123'),
        ticket_id: 'TICK-123',
        auto_created: true,
      });
    });

    it('should return success without ticket for resolved calls', async () => {
      (QContactClient.processInboundCall as any).mockResolvedValueOnce({
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
      expect(data).toMatchObject({
        success: true,
        message: expect.stringContaining('Call processed'),
      });
    });
  });
});
