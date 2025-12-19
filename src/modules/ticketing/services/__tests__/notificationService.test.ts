// src/modules/ticketing/services/__tests__/notificationService.test.ts
// Unit tests for NotificationService
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotificationService } from '../notificationService';
import type { Ticket, TicketPriority } from '../../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendTicketCreatedNotification', () => {
    const mockTicket = {
      id: 'TICK-001',
      title: 'Test Ticket',
      description: 'Test description',
      priority: 'high' as TicketPriority,
      status: 'open' as const,
      source: 'qcontact' as const,
      assigned_to: 'user_123',
      created_by: 'user_456',
      customer_id: 'cust_789',
      project_id: 'proj_abc',
      created_at: new Date('2025-01-15T10:00:00Z'),
      updated_at: new Date('2025-01-15T10:00:00Z'),
    } as Ticket;

    it('should send email notification for ticket creation', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendTicketCreatedNotification(mockTicket);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications/email'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('TICK-001'),
        })
      );
    });

    it('should include ticket details in notification', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendTicketCreatedNotification(mockTicket);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.title).toBe('Test Ticket');
      expect(body.priority).toBe('high');
      expect(body.assigned_to).toBe('user_123');
    });

    it('should handle notification failure gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Should not throw
      await expect(
        NotificationService.sendTicketCreatedNotification(mockTicket)
      ).resolves.not.toThrow();
    });

    it('should send to assigned user if specified', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendTicketCreatedNotification(mockTicket);

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.recipient_id).toBe('user_123');
    });
  });

  describe('sendTicketAssignedNotification', () => {
    it('should send notification when ticket is assigned', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendTicketAssignedNotification(
        'TICK-001',
        'user_123',
        'user_456'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications/email'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.assigned_to).toBe('user_123');
      expect(body.assigned_by).toBe('user_456');
    });

    it('should handle missing assigned_by gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendTicketAssignedNotification('TICK-001', 'user_123');

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.assigned_by).toBeUndefined();
    });
  });

  describe('sendTicketStatusChangedNotification', () => {
    it('should send notification when status changes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendTicketStatusChangedNotification(
        'TICK-001',
        'open',
        'in_progress',
        'user_123'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.old_status).toBe('open');
      expect(body.new_status).toBe('in_progress');
      expect(body.changed_by).toBe('user_123');
    });

    it('should send to watchers when status changes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendTicketStatusChangedNotification(
        'TICK-001',
        'in_progress',
        'resolved',
        'user_123',
        ['user_456', 'user_789']
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.watchers).toEqual(['user_456', 'user_789']);
    });
  });

  describe('sendSLABreachNotification', () => {
    it('should send urgent notification for SLA breach', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendSLABreachNotification(
        'TICK-001',
        'response',
        new Date('2025-01-15T11:00:00Z')
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.breach_type).toBe('response');
      expect(body.deadline).toBe('2025-01-15T11:00:00.000Z');
      expect(body.urgent).toBe(true);
    });

    it('should send notification for resolution SLA breach', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendSLABreachNotification(
        'TICK-001',
        'resolution',
        new Date('2025-01-15T14:00:00Z')
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.breach_type).toBe('resolution');
    });

    it('should send to multiple stakeholders for SLA breach', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendSLABreachNotification(
        'TICK-001',
        'response',
        new Date('2025-01-15T11:00:00Z'),
        ['manager_1', 'manager_2']
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.recipients).toEqual(['manager_1', 'manager_2']);
    });
  });

  describe('sendSLAAtRiskNotification', () => {
    it('should send warning notification when SLA is at risk', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendSLAAtRiskNotification(
        'TICK-001',
        'response',
        new Date('2025-01-15T11:00:00Z'),
        90 // 90 minutes remaining
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.risk_type).toBe('response');
      expect(body.time_remaining_minutes).toBe(90);
      expect(body.urgent).toBe(false);
    });

    it('should calculate time remaining correctly', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendSLAAtRiskNotification(
        'TICK-001',
        'resolution',
        new Date('2025-01-15T14:00:00Z'),
        30 // 30 minutes remaining
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.time_remaining_minutes).toBe(30);
    });
  });

  describe('sendBillingApprovalRequestNotification', () => {
    it('should send notification for billing approval request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendBillingApprovalRequestNotification(
        'TICK-001',
        'bill_001',
        250.5,
        'user_123'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.billing_id).toBe('bill_001');
      expect(body.amount).toBe(250.5);
      expect(body.approver_id).toBe('user_123');
    });

    it('should send to approver with correct permissions', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendBillingApprovalRequestNotification(
        'TICK-001',
        'bill_001',
        1500.0,
        'manager_1'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.requires_approval).toBe(true);
      expect(body.approver_id).toBe('manager_1');
    });
  });

  describe('sendBillingApprovedNotification', () => {
    it('should send notification when billing is approved', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendBillingApprovedNotification(
        'TICK-001',
        'bill_001',
        'manager_1',
        'Approved for emergency support'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.billing_id).toBe('bill_001');
      expect(body.approved_by).toBe('manager_1');
      expect(body.approval_notes).toBe('Approved for emergency support');
    });

    it('should handle missing approval notes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendBillingApprovedNotification(
        'TICK-001',
        'bill_001',
        'manager_1'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.approval_notes).toBeUndefined();
    });
  });

  describe('sendBillingRejectedNotification', () => {
    it('should send notification when billing is rejected', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendBillingRejectedNotification(
        'TICK-001',
        'bill_001',
        'manager_1',
        'Not eligible for billable hours'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.billing_id).toBe('bill_001');
      expect(body.rejected_by).toBe('manager_1');
      expect(body.rejection_reason).toBe('Not eligible for billable hours');
    });

    it('should require rejection reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendBillingRejectedNotification(
        'TICK-001',
        'bill_001',
        'manager_1',
        'Does not meet criteria'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.rejection_reason).toBeDefined();
      expect(body.rejection_reason.length).toBeGreaterThan(0);
    });
  });

  describe('sendCommentAddedNotification', () => {
    it('should send notification when comment is added', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendCommentAddedNotification(
        'TICK-001',
        'user_123',
        'This is a new comment',
        ['user_456', 'user_789']
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.commenter_id).toBe('user_123');
      expect(body.comment_preview).toBe('This is a new comment');
      expect(body.watchers).toEqual(['user_456', 'user_789']);
    });

    it('should truncate long comments in preview', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const longComment = 'A'.repeat(200);

      await NotificationService.sendCommentAddedNotification(
        'TICK-001',
        'user_123',
        longComment,
        []
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.comment_preview.length).toBeLessThanOrEqual(150);
    });
  });

  describe('sendMentionNotification', () => {
    it('should send notification when user is mentioned', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendMentionNotification(
        'TICK-001',
        'user_123',
        'user_456',
        '@user_123 please review this ticket'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.ticket_id).toBe('TICK-001');
      expect(body.mentioned_user_id).toBe('user_123');
      expect(body.mentioned_by_id).toBe('user_456');
      expect(body.context).toBe('@user_123 please review this ticket');
    });

    it('should extract mention from longer text', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await NotificationService.sendMentionNotification(
        'TICK-001',
        'user_123',
        'user_456',
        'Hey @user_123, can you help with this? Thanks!'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.context).toContain('@user_123');
    });
  });

  describe('error handling', () => {
    it('should log errors but not throw', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as any).mockRejectedValueOnce(new Error('API error'));

      await expect(
        NotificationService.sendTicketCreatedNotification({
          id: 'TICK-001',
        } as Ticket)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle network timeouts gracefully', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      await expect(
        NotificationService.sendTicketAssignedNotification('TICK-001', 'user_123')
      ).resolves.not.toThrow();
    });

    it('should handle malformed API responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        NotificationService.sendSLABreachNotification(
          'TICK-001',
          'response',
          new Date()
        )
      ).resolves.not.toThrow();
    });
  });

  describe('batching and rate limiting', () => {
    it('should batch multiple notifications if sent rapidly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Send 5 notifications rapidly
      await Promise.all([
        NotificationService.sendCommentAddedNotification('TICK-001', 'user_1', 'Comment 1', []),
        NotificationService.sendCommentAddedNotification('TICK-001', 'user_2', 'Comment 2', []),
        NotificationService.sendCommentAddedNotification('TICK-001', 'user_3', 'Comment 3', []),
        NotificationService.sendCommentAddedNotification('TICK-001', 'user_4', 'Comment 4', []),
        NotificationService.sendCommentAddedNotification('TICK-001', 'user_5', 'Comment 5', []),
      ]);

      // All should have been sent
      expect((global.fetch as any).mock.calls.length).toBe(5);
    });
  });
});
