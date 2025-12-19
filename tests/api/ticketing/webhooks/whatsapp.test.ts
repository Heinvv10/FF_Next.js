// tests/api/ticketing/webhooks/whatsapp.test.ts
// Integration tests for POST /api/ticketing/webhooks/whatsapp
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import handler from '../../../../pages/api/ticketing/webhooks/whatsapp';
import { WhatsAppBridgeService } from '@/modules/ticketing/integrations/whatsapp/whatsappBridge';

// Mock WhatsAppBridgeService
vi.mock('@/modules/ticketing/integrations/whatsapp/whatsappBridge');

describe('POST /api/ticketing/webhooks/whatsapp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WHATSAPP_WEBHOOK_SECRET = 'test-secret-key';
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
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          from_name: 'John Doe',
          message: 'Issue with drop LAWLEY001',
          timestamp: '2025-01-15T10:00:00Z',
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
          id: 'msg_123',
          from: '27821234567',
          message: 'Test message',
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
          id: 'msg_123',
          from: '27821234567',
          message: 'Test message',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should accept requests with valid signature', async () => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          message: 'Test message',
          timestamp: '2025-01-15T10:00:00Z',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should skip signature validation if not configured', async () => {
      delete process.env.WHATSAPP_WEBHOOK_SECRET;

      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          id: 'msg_123',
          from: '27821234567',
          message: 'Test message',
          timestamp: '2025-01-15T10:00:00Z',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValue({
        success: true,
      });
    });

    it('should require message ID', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          from: '27821234567',
          message: 'Test message',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('id'),
      });
    });

    it('should require sender phone number', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          message: 'Test message',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('from'),
      });
    });

    it('should require message content', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: expect.stringContaining('message'),
      });
    });

    it('should accept optional fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          from_name: 'John Doe',
          group_id: 'group_456',
          group_name: 'Lawley Support',
          message: 'Test message',
          timestamp: '2025-01-15T10:00:00Z',
          media_url: 'https://example.com/photo.jpg',
          project_id: 'proj_lawley',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  describe('Ticket Creation', () => {
    beforeEach(() => {
      process.env.WHATSAPP_WEBHOOK_SECRET = 'test-secret-key';
    });

    it('should create ticket for message with trigger keywords', async () => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-001',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          from_name: 'John Doe',
          message: 'Issue with drop LAWLEY001 - not connecting',
          timestamp: '2025-01-15T10:00:00Z',
          project_id: 'proj_lawley',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.ticket_id).toBe('TICK-001');
      expect(data.auto_created).toBe(true);
    });

    it('should not create ticket for messages without trigger keywords', async () => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
        ticket_id: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          message: 'Thanks for the update',
          timestamp: '2025-01-15T10:00:00Z',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.message).toContain('Message processed');
      expect(data.ticket_id).toBeNull();
    });

    it('should attach reply to existing ticket', async () => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-001',
        note_added: true,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_456',
          from: '27821234567',
          message: 'Additional information about the issue',
          timestamp: '2025-01-15T11:00:00Z',
          quoted_message: 'msg_123', // Replying to previous message
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.ticket_id).toBe('TICK-001');
    });

    it('should handle media attachments', async () => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-002',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_789',
          from: '27821234567',
          message: 'Problem with installation - see photo',
          timestamp: '2025-01-15T12:00:00Z',
          media_url: 'https://example.com/issue-photo.jpg',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.ticket_id).toBe('TICK-002');
    });
  });

  describe('Duplicate Prevention', () => {
    beforeEach(() => {
      process.env.WHATSAPP_WEBHOOK_SECRET = 'test-secret-key';
    });

    it('should detect duplicate messages', async () => {
      (WhatsAppBridgeService.findTicketByMessageId as any).mockResolvedValueOnce({
        id: 'TICK-001',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123', // Duplicate message ID
          from: '27821234567',
          message: 'Issue with drop LAWLEY001',
          timestamp: '2025-01-15T10:00:00Z',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.message).toContain('already exists');
      expect(data.ticket_id).toBe('TICK-001');
      expect(data.already_exists).toBe(true);
    });

    it('should process new messages normally', async () => {
      (WhatsAppBridgeService.findTicketByMessageId as any).mockResolvedValueOnce(null);
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-002',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_999', // New message ID
          from: '27821234567',
          message: 'Problem with installation',
          timestamp: '2025-01-15T13:00:00Z',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data.ticket_id).toBe('TICK-002');
      expect(data.already_exists).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.WHATSAPP_WEBHOOK_SECRET = 'test-secret-key';
    });

    it('should handle service errors gracefully', async () => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: false,
        error: 'Failed to create ticket',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          message: 'Issue with installation',
          timestamp: '2025-01-15T10:00:00Z',
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
      (WhatsAppBridgeService.processInboundMessage as any).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          message: 'Issue with installation',
          timestamp: '2025-01-15T10:00:00Z',
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

      (WhatsAppBridgeService.processInboundMessage as any).mockRejectedValueOnce(
        new Error('Test error')
      );

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          message: 'Test message',
          timestamp: '2025-01-15T10:00:00Z',
        },
      });

      await handler(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'WhatsApp webhook error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      process.env.WHATSAPP_WEBHOOK_SECRET = 'test-secret-key';
    });

    it('should return success response with ticket ID', async () => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
        ticket_id: 'TICK-123',
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          message: 'Issue with drop',
          timestamp: '2025-01-15T10:00:00Z',
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

    it('should return success without ticket for non-trigger messages', async () => {
      (WhatsAppBridgeService.processInboundMessage as any).mockResolvedValueOnce({
        success: true,
        ticket_id: null,
      });

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'x-webhook-signature': 'test-secret-key',
        },
        body: {
          id: 'msg_123',
          from: '27821234567',
          message: 'Thanks',
          timestamp: '2025-01-15T10:00:00Z',
        },
      });

      await handler(req, res);

      const data = JSON.parse(res._getData());
      expect(data).toMatchObject({
        success: true,
        message: expect.stringContaining('Message processed'),
      });
    });
  });
});
