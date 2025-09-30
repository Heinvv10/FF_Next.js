import twilio from 'twilio';
import Pusher from 'pusher-js';
import { NotificationPayload } from '../types';

// Notification Service for DROPS Quality Control
export class NotificationService {
  private static twilioClient: twilio.Twilio;
  private static pusher: Pusher;

  // Initialize Twilio client
  static initializeTwilio() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio credentials not found. WhatsApp notifications disabled.');
      return;
    }

    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // Initialize Pusher for browser notifications
  static initializePusher() {
    if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      console.warn('Pusher credentials not found. Browser notifications disabled.');
      return;
    }

    this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
  }

  // Send WhatsApp notification
  static async sendWhatsAppNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        this.initializeTwilio();
      }

      if (!this.twilioClient) {
        console.error('Twilio client not initialized');
        return false;
      }

      const message = this.formatWhatsAppMessage(payload);

      await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:${payload.recipient}`,
      });

      console.log(`WhatsApp notification sent to ${payload.recipient}`);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      return false;
    }
  }

  // Format WhatsApp message
  private static formatWhatsAppMessage(payload: NotificationPayload): string {
    const dropUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/contractor/drops/${payload.drop_id}`;

    let message = `🚨 *DROPS Quality Control Update*\n\n`;
    message += `Drop: ${payload.drop_number}\n`;
    message += `Status: ${payload.feedback || 'Needs attention'}\n\n`;

    if (payload.missing_steps && payload.missing_steps.length > 0) {
      message += `*Missing Steps:*\n`;
      payload.missing_steps.forEach(step => {
        message += `• Step ${step}\n`;
      });
      message += '\n';
    }

    message += `Please rectify and resubmit immediately.\n\n`;
    message += `View details: ${dropUrl}\n\n`;
    message += `⚠️ *Note: Incomplete submissions will be marked as unpaid until rectified.*`;

    return message;
  }

  // Trigger browser notification via Pusher
  static async triggerBrowserNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      // This would typically be done server-side with Pusher's REST API
      // For now, we'll simulate the notification

      const channelName = `contractor-${payload.recipient}`;
      const eventName = 'drops-status-update';

      console.log(`Browser notification triggered for ${channelName}: ${eventName}`);

      // In a real implementation, you would use Pusher's REST API:
      // await pusher.trigger(channelName, eventName, payload);

      return true;
    } catch (error) {
      console.error('Error triggering browser notification:', error);
      return false;
    }
  }

  // Send browser notification to client (client-side)
  static sendBrowserNotification(payload: NotificationPayload) {
    if (typeof window === 'undefined') return;

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('DROPS Quality Control Update', {
        body: `Drop ${payload.drop_number}: ${payload.feedback}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `drops-${payload.drop_id}`,
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Details'
          }
        ]
      });
    }
  }

  // Subscribe to contractor notifications (client-side)
  static subscribeToContractorNotifications(
    contractorId: string,
    callbacks: {
      onStatusUpdate?: (data: any) => void;
      onNewMessage?: (data: any) => void;
    }
  ) {
    if (typeof window === 'undefined') return;

    this.initializePusher();

    if (!this.pusher) return;

    const channelName = `contractor-${contractorId}`;
    const channel = this.pusher.subscribe(channelName);

    channel.bind('drops-status-update', (data: any) => {
      console.log('Received drops status update:', data);
      callbacks.onStatusUpdate?.(data);

      // Show browser notification
      this.sendBrowserNotification({
        type: 'browser',
        recipient: contractorId,
        message: data.feedback,
        drop_id: data.drop_id,
        drop_number: data.drop_number,
        contractor_name: data.contractor_name,
        missing_steps: data.missing_steps,
        feedback: data.feedback
      });
    });

    channel.bind('drops-new-message', (data: any) => {
      console.log('Received drops new message:', data);
      callbacks.onNewMessage?.(data);
    });

    return () => {
      this.pusher?.unsubscribe(channelName);
    };
  }

  // Send comprehensive notification (WhatsApp + Browser)
  static async sendNotification(payload: NotificationPayload): Promise<{
    whatsappSent: boolean;
    browserSent: boolean;
  }> {
    const results = {
      whatsappSent: false,
      browserSent: false,
    };

    try {
      // Send WhatsApp notification
      if (payload.type === 'whatsapp' || payload.type === 'both') {
        results.whatsappSent = await this.sendWhatsAppNotification(payload);
      }

      // Trigger browser notification
      if (payload.type === 'browser' || payload.type === 'both') {
        results.browserSent = await this.triggerBrowserNotification(payload);
      }

      console.log('Notification results:', results);
      return results;
    } catch (error) {
      console.error('Error sending notifications:', error);
      return results;
    }
  }

  // Send notification for new review (when agent submits review)
  static async sendReviewNotification(reviewData: {
    submission_id: string;
    drop_id: string;
    drop_number: string;
    contractor_id: string;
    contractor_name: string;
    whatsapp_number: string;
    status: 'approved' | 'needs-rectification';
    feedback: string;
    missing_steps: number[];
    reviewed_by: string;
  }): Promise<{
    whatsappSent: boolean;
    browserSent: boolean;
  }> {
    if (reviewData.status === 'approved') {
      // For approved status, only send a mild notification
      return await this.sendNotification({
        type: 'browser',
        recipient: reviewData.contractor_id,
        message: `Great job! Drop ${reviewData.drop_number} has been approved.`,
        drop_id: reviewData.drop_id,
        drop_number: reviewData.drop_number,
        contractor_name: reviewData.contractor_name,
        feedback: 'Your installation has been approved and meets all quality standards.'
      });
    } else {
      // For needs-rectification, send urgent notification via both channels
      return await this.sendNotification({
        type: 'both',
        recipient: reviewData.whatsapp_number,
        message: reviewData.feedback,
        drop_id: reviewData.drop_id,
        drop_number: reviewData.drop_number,
        contractor_name: reviewData.contractor_name,
        missing_steps: reviewData.missing_steps,
        feedback: reviewData.feedback
      });
    }
  }

  // Send notification for new submission
  static async sendSubmissionNotification(submissionData: {
    drop_id: string;
    drop_number: string;
    contractor_name: string;
  }): Promise<boolean> {
    // This would notify agents about new submissions requiring review
    try {
      const message = `New submission received for Drop ${submissionData.drop_number} by ${submissionData.contractor_name}`;
      console.log('Submission notification:', message);

      // In a real implementation, this would send to agents/admins
      // via email, Slack, or other internal notification systems

      return true;
    } catch (error) {
      console.error('Error sending submission notification:', error);
      return false;
    }
  }

  // Test notification endpoints
  static async testWhatsApp(phoneNumber: string): Promise<boolean> {
    return await this.sendWhatsAppNotification({
      type: 'whatsapp',
      recipient: phoneNumber,
      message: 'Test message from DROPS Quality Control system',
      drop_id: 'test',
      drop_number: 'TEST001',
      contractor_name: 'Test Contractor',
      feedback: 'This is a test notification'
    });
  }

  static testBrowserNotification() {
    this.sendBrowserNotification({
      type: 'browser',
      recipient: 'test',
      message: 'Test browser notification from DROPS system',
      drop_id: 'test',
      drop_number: 'TEST001',
      contractor_name: 'Test Contractor',
      feedback: 'This is a test browser notification'
    });
  }
}