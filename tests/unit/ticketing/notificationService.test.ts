// tests/unit/ticketing/notificationService.test.ts
// Unit tests for NotificationService
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

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-notification-uuid'),
});

// Import after mocking
import { NotificationService } from '@/modules/ticketing/services/notificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('sendNotification', () => {
    it('should send email notification successfully', async () => {
      // Mock log insertion
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await NotificationService.sendNotification({
        recipient_id: 'user-1',
        recipient_email: 'test@example.com',
        subject: 'Test Notification',
        message: 'This is a test message',
        channels: ['email'],
        priority: 'medium',
      });

      expect(result.notification_id).toBeDefined();
      expect(result.channels_sent).toContain('email');
      expect(result.channels_failed).toHaveLength(0);
    });

    it('should handle multiple channels', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationService.sendNotification({
        recipient_id: 'user-1',
        recipient_email: 'test@example.com',
        recipient_phone: '+27123456789',
        subject: 'Multi-channel Test',
        message: 'Testing all channels',
        channels: ['email', 'sms', 'in_app'],
        priority: 'high',
      });

      expect(result.channels_sent.length).toBeGreaterThan(0);
    });

    it('should include ticket_id in metadata when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationService.sendNotification({
        recipient_id: 'user-1',
        recipient_email: 'test@example.com',
        subject: 'Ticket Update',
        message: 'Your ticket has been updated',
        channels: ['email'],
        priority: 'medium',
        ticket_id: 'ticket-123',
      });

      expect(result).toBeDefined();
      expect(result.sent_at).toBeInstanceOf(Date);
    });

    it('should handle urgent priority notifications', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationService.sendNotification({
        recipient_id: 'user-1',
        recipient_email: 'test@example.com',
        recipient_phone: '+27123456789',
        subject: 'URGENT: Critical Issue',
        message: 'Immediate attention required',
        channels: ['email', 'sms', 'whatsapp'],
        priority: 'urgent',
      });

      expect(result.notification_id).toBeDefined();
    });
  });

  describe('sendTicketNotification', () => {
    it('should send notification for ticket creation', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationService.sendTicketNotification({
        ticket_id: 'ticket-1',
        ticket_uid: 'TKT-001',
        event: 'created',
        recipient_id: 'user-1',
        recipient_email: 'test@example.com',
        ticket_title: 'New support request',
        priority: 'high',
      });

      expect(result).toBeDefined();
      expect(result.channels_sent.length).toBeGreaterThan(0);
    });

    it('should send notification for ticket status update', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationService.sendTicketNotification({
        ticket_id: 'ticket-1',
        ticket_uid: 'TKT-001',
        event: 'status_changed',
        recipient_id: 'user-1',
        recipient_email: 'test@example.com',
        ticket_title: 'Support request',
        priority: 'medium',
        old_status: 'open',
        new_status: 'in_progress',
      });

      expect(result).toBeDefined();
    });

    it('should send notification for ticket assignment', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationService.sendTicketNotification({
        ticket_id: 'ticket-1',
        ticket_uid: 'TKT-001',
        event: 'assigned',
        recipient_id: 'technician-1',
        recipient_email: 'tech@example.com',
        ticket_title: 'Fiber installation',
        priority: 'high',
        assigned_to_name: 'John Technician',
      });

      expect(result).toBeDefined();
    });

    it('should send SLA warning notification', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationService.sendTicketNotification({
        ticket_id: 'ticket-1',
        ticket_uid: 'TKT-001',
        event: 'sla_warning',
        recipient_id: 'manager-1',
        recipient_email: 'manager@example.com',
        ticket_title: 'Critical issue',
        priority: 'critical',
        sla_deadline: new Date(),
        time_remaining_minutes: 30,
      });

      expect(result).toBeDefined();
    });
  });

  describe('getNotificationHistory', () => {
    it('should return notification history for a user', async () => {
      // Mock count query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: '2', unread: '1' }],
      });

      // Mock data query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'notif-1',
            user_id: 'user-1',
            ticket_id: 'ticket-1',
            title: 'Ticket Update',
            message: 'Your ticket was updated',
            is_read: true,
            created_at: new Date(),
          },
          {
            id: 'notif-2',
            user_id: 'user-1',
            ticket_id: 'ticket-2',
            title: 'New Assignment',
            message: 'You were assigned a ticket',
            is_read: false,
            created_at: new Date(),
          },
        ],
      });

      const result = await NotificationService.getNotificationHistory({ user_id: 'user-1' });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.unread_count).toBe(1);
    });

    it('should return empty array when no notifications found', async () => {
      // Mock count query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: '0', unread: '0' }],
      });

      // Mock data query
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await NotificationService.getNotificationHistory({ user_id: 'user-999' });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getNotificationPreferences', () => {
    it('should return user notification preferences', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          user_id: 'user-1',
          email_enabled: true,
          sms_enabled: false,
          whatsapp_enabled: true,
          in_app_enabled: true,
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
        }],
      });

      const prefs = await NotificationService.getNotificationPreferences('user-1');

      expect(prefs).toBeDefined();
      expect(prefs?.email_enabled).toBe(true);
      expect(prefs?.sms_enabled).toBe(false);
    });

    it('should return null when preferences not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const prefs = await NotificationService.getNotificationPreferences('unknown-user');

      expect(prefs).toBeNull();
    });
  });
});
