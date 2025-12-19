// src/modules/ticketing/services/notificationService.ts
// Business logic for sending notifications (email, SMS, WhatsApp, in-app)
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationPayload {
  recipient_id: string;
  recipient_email?: string;
  recipient_phone?: string;
  subject: string;
  message: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  ticket_id?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  notification_id: string;
  channels_sent: NotificationChannel[];
  channels_failed: NotificationChannel[];
  sent_at: Date;
  errors?: Record<NotificationChannel, string>;
}

export class NotificationService {
  /**
   * Send a notification through multiple channels
   */
  static async sendNotification(
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    const notificationId = crypto.randomUUID();
    const sentAt = new Date();
    const channelsSent: NotificationChannel[] = [];
    const channelsFailed: NotificationChannel[] = [];
    const errors: Record<NotificationChannel, string> = {} as Record<
      NotificationChannel,
      string
    >;

    // Send through each requested channel
    for (const channel of payload.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmail(payload);
            channelsSent.push('email');
            break;

          case 'sms':
            await this.sendSMS(payload);
            channelsSent.push('sms');
            break;

          case 'whatsapp':
            await this.sendWhatsApp(payload);
            channelsSent.push('whatsapp');
            break;

          case 'in_app':
            await this.sendInApp(payload);
            channelsSent.push('in_app');
            break;

          default:
            channelsFailed.push(channel);
            errors[channel] = `Unsupported channel: ${channel}`;
        }
      } catch (error: any) {
        channelsFailed.push(channel);
        errors[channel] = error.message || 'Unknown error';
      }
    }

    // Log notification in database
    await this.logNotification({
      id: notificationId,
      recipient_id: payload.recipient_id,
      ticket_id: payload.ticket_id,
      channel: payload.channels.join(','),
      subject: payload.subject,
      message: payload.message,
      sent_at: sentAt,
      status: channelsFailed.length === 0 ? 'sent' : 'partial',
      metadata: payload.metadata,
    });

    return {
      notification_id: notificationId,
      channels_sent: channelsSent,
      channels_failed: channelsFailed,
      sent_at: sentAt,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  }

  /**
   * Send email notification
   */
  private static async sendEmail(payload: NotificationPayload): Promise<void> {
    // 🟡 PARTIAL: Email sending integration placeholder
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`📧 Email notification to ${payload.recipient_email}:`, {
      subject: payload.subject,
      message: payload.message,
    });

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(payload: NotificationPayload): Promise<void> {
    // 🟡 PARTIAL: SMS sending integration placeholder
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`📱 SMS notification to ${payload.recipient_phone}:`, {
      message: payload.message,
    });

    // Simulate SMS sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Send WhatsApp notification
   */
  private static async sendWhatsApp(
    payload: NotificationPayload
  ): Promise<void> {
    // 🟡 PARTIAL: WhatsApp sending integration placeholder
    // TODO: Integrate with WhatsApp Business API or whatsapp-bridge
    console.log(`💬 WhatsApp notification to ${payload.recipient_phone}:`, {
      message: payload.message,
    });

    // Simulate WhatsApp sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Send in-app notification
   */
  private static async sendInApp(payload: NotificationPayload): Promise<void> {
    // 🟢 WORKING: In-app notifications stored in database
    const insertQuery = `
      INSERT INTO user_notifications (
        id,
        user_id,
        ticket_id,
        title,
        message,
        is_read,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;

    await sql.query(insertQuery, [
      crypto.randomUUID(),
      payload.recipient_id,
      payload.ticket_id || null,
      payload.subject,
      payload.message,
      false,
    ]);
  }

  /**
   * Log notification in notification_log table
   */
  private static async logNotification(data: {
    id: string;
    recipient_id: string;
    ticket_id?: string;
    channel: string;
    subject: string;
    message: string;
    sent_at: Date;
    status: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const insertQuery = `
      INSERT INTO notification_log (
        id,
        recipient_id,
        ticket_id,
        channel,
        subject,
        message,
        sent_at,
        status,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await sql.query(insertQuery, [
      data.id,
      data.recipient_id,
      data.ticket_id || null,
      data.channel,
      data.subject,
      data.message,
      data.sent_at,
      data.status,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]);
  }

  /**
   * Notify assigned user when ticket is assigned
   */
  static async notifyTicketAssignment(params: {
    ticket_id: string;
    assigned_to: string;
    assigned_by: string;
    ticket_title: string;
    priority: string;
  }): Promise<NotificationResult> {
    // Get user notification preferences
    const userQuery = `
      SELECT email, phone, notification_preferences
      FROM users
      WHERE id = $1
    `;

    const userResult = await sql.query(userQuery, [params.assigned_to]);

    if (userResult.rows.length === 0) {
      throw new Error(`User not found: ${params.assigned_to}`);
    }

    const user = userResult.rows[0];
    const preferences = user.notification_preferences || {};

    // Determine channels based on priority and user preferences
    const channels: NotificationChannel[] = ['in_app'];

    if (params.priority === 'critical' || params.priority === 'high') {
      channels.push('email');
      if (preferences.sms_enabled) {
        channels.push('sms');
      }
    }

    return this.sendNotification({
      recipient_id: params.assigned_to,
      recipient_email: user.email,
      recipient_phone: user.phone,
      subject: `Ticket Assigned: ${params.ticket_title}`,
      message: `You have been assigned a ${params.priority} priority ticket: "${params.ticket_title}". Please review and respond accordingly.`,
      channels,
      priority: params.priority as NotificationPriority,
      ticket_id: params.ticket_id,
      metadata: {
        event: 'ticket_assignment',
        assigned_by: params.assigned_by,
      },
    });
  }

  /**
   * Notify when ticket status changes
   */
  static async notifyStatusChange(params: {
    ticket_id: string;
    old_status: string;
    new_status: string;
    changed_by: string;
    created_by: string;
    assigned_to?: string;
    ticket_title: string;
  }): Promise<NotificationResult[]> {
    const notifications: NotificationResult[] = [];

    // Notify ticket creator
    const creatorNotif = await this.sendNotification({
      recipient_id: params.created_by,
      subject: `Ticket Status Updated: ${params.ticket_title}`,
      message: `Your ticket "${params.ticket_title}" status changed from "${params.old_status}" to "${params.new_status}".`,
      channels: ['in_app', 'email'],
      priority: 'medium',
      ticket_id: params.ticket_id,
      metadata: {
        event: 'status_change',
        old_status: params.old_status,
        new_status: params.new_status,
      },
    });

    notifications.push(creatorNotif);

    // Notify assigned user if different from creator
    if (params.assigned_to && params.assigned_to !== params.created_by) {
      const assignedNotif = await this.sendNotification({
        recipient_id: params.assigned_to,
        subject: `Ticket Status Updated: ${params.ticket_title}`,
        message: `Ticket "${params.ticket_title}" status changed from "${params.old_status}" to "${params.new_status}".`,
        channels: ['in_app'],
        priority: 'low',
        ticket_id: params.ticket_id,
        metadata: {
          event: 'status_change',
          old_status: params.old_status,
          new_status: params.new_status,
        },
      });

      notifications.push(assignedNotif);
    }

    return notifications;
  }

  /**
   * Notify when SLA is at risk (80% time elapsed)
   */
  static async notifySLAAtRisk(params: {
    ticket_id: string;
    assigned_to: string;
    ticket_title: string;
    time_remaining_minutes: number;
  }): Promise<NotificationResult> {
    return this.sendNotification({
      recipient_id: params.assigned_to,
      subject: `⚠️ SLA Alert: ${params.ticket_title}`,
      message: `Ticket "${params.ticket_title}" is at risk of SLA breach. Only ${params.time_remaining_minutes} minutes remaining!`,
      channels: ['in_app', 'email', 'sms'],
      priority: 'urgent',
      ticket_id: params.ticket_id,
      metadata: {
        event: 'sla_at_risk',
        time_remaining_minutes: params.time_remaining_minutes,
      },
    });
  }

  /**
   * Notify when SLA is breached
   */
  static async notifySLABreach(params: {
    ticket_id: string;
    assigned_to: string;
    created_by: string;
    ticket_title: string;
    breach_type: 'response' | 'resolution';
  }): Promise<NotificationResult[]> {
    const notifications: NotificationResult[] = [];

    // Notify assigned user
    const assignedNotif = await this.sendNotification({
      recipient_id: params.assigned_to,
      subject: `🚨 SLA BREACHED: ${params.ticket_title}`,
      message: `URGENT: Ticket "${params.ticket_title}" has breached its ${params.breach_type} SLA. Immediate action required!`,
      channels: ['in_app', 'email', 'sms'],
      priority: 'urgent',
      ticket_id: params.ticket_id,
      metadata: {
        event: 'sla_breach',
        breach_type: params.breach_type,
      },
    });

    notifications.push(assignedNotif);

    // Notify ticket creator
    const creatorNotif = await this.sendNotification({
      recipient_id: params.created_by,
      subject: `SLA Breached: ${params.ticket_title}`,
      message: `Your ticket "${params.ticket_title}" has breached its ${params.breach_type} SLA. We are escalating this issue.`,
      channels: ['in_app', 'email'],
      priority: 'high',
      ticket_id: params.ticket_id,
      metadata: {
        event: 'sla_breach',
        breach_type: params.breach_type,
      },
    });

    notifications.push(creatorNotif);

    return notifications;
  }

  /**
   * Notify when new note/comment is added
   */
  static async notifyNewNote(params: {
    ticket_id: string;
    created_by: string;
    assigned_to?: string;
    ticket_creator: string;
    note_content: string;
    ticket_title: string;
  }): Promise<NotificationResult[]> {
    const notifications: NotificationResult[] = [];
    const recipients = new Set<string>();

    // Add assigned user
    if (params.assigned_to && params.assigned_to !== params.created_by) {
      recipients.add(params.assigned_to);
    }

    // Add ticket creator
    if (params.ticket_creator !== params.created_by) {
      recipients.add(params.ticket_creator);
    }

    // Send notifications to all recipients
    for (const recipientId of recipients) {
      const notif = await this.sendNotification({
        recipient_id: recipientId,
        subject: `New comment on: ${params.ticket_title}`,
        message: `New comment added to ticket "${params.ticket_title}": ${params.note_content.substring(0, 100)}${params.note_content.length > 100 ? '...' : ''}`,
        channels: ['in_app'],
        priority: 'low',
        ticket_id: params.ticket_id,
        metadata: {
          event: 'new_note',
          created_by: params.created_by,
        },
      });

      notifications.push(notif);
    }

    return notifications;
  }

  /**
   * Notify when billing approval is required
   */
  static async notifyBillingApprovalRequired(params: {
    ticket_id: string;
    approver_id: string;
    ticket_title: string;
    estimated_cost: number;
  }): Promise<NotificationResult> {
    return this.sendNotification({
      recipient_id: params.approver_id,
      subject: `Billing Approval Required: ${params.ticket_title}`,
      message: `Ticket "${params.ticket_title}" requires billing approval for R${params.estimated_cost.toFixed(2)}. Please review and approve.`,
      channels: ['in_app', 'email'],
      priority: 'high',
      ticket_id: params.ticket_id,
      metadata: {
        event: 'billing_approval_required',
        estimated_cost: params.estimated_cost,
      },
    });
  }

  /**
   * Get notification history for a user
   */
  static async getNotificationHistory(params: {
    user_id: string;
    limit?: number;
    offset?: number;
    is_read?: boolean;
  }): Promise<{
    data: any[];
    total: number;
    unread_count: number;
  }> {
    const whereConditions: string[] = ['user_id = $1'];
    const queryParams: unknown[] = [params.user_id];
    let paramIndex = 2;

    if (params.is_read !== undefined) {
      whereConditions.push(`is_read = $${paramIndex}`);
      queryParams.push(params.is_read);
      paramIndex++;
    }

    const countQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = FALSE) as unread
      FROM user_notifications
      WHERE user_id = $1
    `;

    const countResult = await sql.query(countQuery, [params.user_id]);
    const total = parseInt(countResult.rows[0].total, 10);
    const unreadCount = parseInt(countResult.rows[0].unread, 10);

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    queryParams.push(limit);
    const limitParam = paramIndex;
    paramIndex++;

    queryParams.push(offset);
    const offsetParam = paramIndex;

    const query = `
      SELECT *
      FROM user_notifications
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const result = await sql.query(query, queryParams);

    return {
      data: result.rows,
      total,
      unread_count: unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const updateQuery = `
      UPDATE user_notifications
      SET is_read = TRUE, read_at = NOW()
      WHERE id = $1
    `;

    await sql.query(updateQuery, [notificationId]);
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const updateQuery = `
      UPDATE user_notifications
      SET is_read = TRUE, read_at = NOW()
      WHERE user_id = $1 AND is_read = FALSE
    `;

    await sql.query(updateQuery, [userId]);
  }
}
