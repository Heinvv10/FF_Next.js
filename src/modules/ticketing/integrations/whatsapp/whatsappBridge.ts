// src/modules/ticketing/integrations/whatsapp/whatsappBridge.ts
// WhatsApp Bridge Integration - Automatic ticket creation from WhatsApp messages
// Connects to existing WhatsApp Bridge service on Velocity Server

import { neon } from '@neondatabase/serverless';
import type { Ticket, TicketPriority, TicketSource } from '../../types';

const sql = neon(process.env.DATABASE_URL!);

interface WhatsAppMessage {
  id: string;
  from: string;
  from_name: string;
  group_id: string;
  group_name: string;
  message: string;
  timestamp: Date;
  media_url?: string;
  quoted_message?: string;
}

interface TicketCreationResult {
  success: boolean;
  ticket_id?: string;
  error?: string;
}

/**
 * WhatsApp Bridge Service
 * Handles automatic ticket creation from WhatsApp messages
 */
export class WhatsAppBridgeService {
  /**
   * Process incoming WhatsApp message and create ticket if needed
   */
  static async processInboundMessage(
    message: WhatsAppMessage,
    context: {
      project_id?: string;
      customer_id?: string;
      auto_create?: boolean;
    }
  ): Promise<TicketCreationResult> {
    try {
      // Check if message should trigger ticket creation
      const shouldCreateTicket = await this.shouldCreateTicket(message, context);

      if (!shouldCreateTicket) {
        return {
          success: true,
          error: 'Message does not require ticket creation',
        };
      }

      // Extract ticket information from message
      const ticketData = await this.extractTicketData(message, context);

      // Create ticket
      const ticket = await this.createTicketFromWhatsApp(ticketData);

      // Link WhatsApp message to ticket
      await this.linkMessageToTicket(message.id, ticket.id);

      // Send confirmation back to WhatsApp (optional)
      if (context.auto_create) {
        await this.sendWhatsAppConfirmation(message.from, ticket.id);
      }

      return {
        success: true,
        ticket_id: ticket.id,
      };
    } catch (error) {
      console.error('Failed to process WhatsApp message for ticket creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determine if WhatsApp message should trigger ticket creation
   */
  private static async shouldCreateTicket(
    message: WhatsAppMessage,
    context: { auto_create?: boolean }
  ): Promise<boolean> {
    // Don't auto-create if disabled
    if (!context.auto_create) {
      return false;
    }

    // Check for ticket trigger keywords
    const triggerKeywords = [
      'issue',
      'problem',
      'help',
      'urgent',
      'broken',
      'not working',
      'error',
      'complaint',
      'support',
      'ticket',
    ];

    const messageLower = message.message.toLowerCase();
    const hasKeyword = triggerKeywords.some((keyword) => messageLower.includes(keyword));

    // Check if message is a reply to existing ticket
    if (message.quoted_message) {
      const existingTicket = await this.findTicketByWhatsAppMessage(message.quoted_message);
      if (existingTicket) {
        // Add as note to existing ticket instead
        await this.addNoteToTicket(existingTicket.id, message);
        return false;
      }
    }

    return hasKeyword;
  }

  /**
   * Extract ticket data from WhatsApp message
   */
  private static async extractTicketData(
    message: WhatsAppMessage,
    context: { project_id?: string; customer_id?: string }
  ): Promise<Partial<Ticket>> {
    // Determine priority based on keywords
    const priority = this.extractPriority(message.message);

    // Generate title from first line or first 100 chars
    const title = message.message.split('\n')[0].substring(0, 100) || 'WhatsApp Support Request';

    // Build description with context
    const description = `
WhatsApp Message from: ${message.from_name} (${message.from})
Group: ${message.group_name}
Received: ${message.timestamp.toISOString()}

Message:
${message.message}

${message.quoted_message ? `\nQuoted Message:\n${message.quoted_message}` : ''}
${message.media_url ? `\nMedia: ${message.media_url}` : ''}
    `.trim();

    return {
      title,
      description,
      priority,
      source: 'whatsapp_inbound' as TicketSource,
      status: 'open',
      project_id: context.project_id,
      customer_id: context.customer_id,
      metadata: {
        whatsapp_from: message.from,
        whatsapp_from_name: message.from_name,
        whatsapp_group_id: message.group_id,
        whatsapp_group_name: message.group_name,
        whatsapp_message_id: message.id,
        whatsapp_timestamp: message.timestamp.toISOString(),
      },
    };
  }

  /**
   * Extract priority from message content
   */
  private static extractPriority(message: string): TicketPriority {
    const messageLower = message.toLowerCase();

    // Critical keywords
    if (
      messageLower.includes('urgent') ||
      messageLower.includes('critical') ||
      messageLower.includes('emergency') ||
      messageLower.includes('down') ||
      messageLower.includes('outage')
    ) {
      return 'critical';
    }

    // High priority keywords
    if (
      messageLower.includes('asap') ||
      messageLower.includes('important') ||
      messageLower.includes('broken')
    ) {
      return 'high';
    }

    // Default to medium priority
    return 'medium';
  }

  /**
   * Create ticket from WhatsApp data
   */
  private static async createTicketFromWhatsApp(
    ticketData: Partial<Ticket>
  ): Promise<{ id: string }> {
    const [ticket] = await sql`
      INSERT INTO tickets (
        title,
        description,
        priority,
        source,
        status,
        project_id,
        customer_id,
        metadata,
        created_at
      )
      VALUES (
        ${ticketData.title},
        ${ticketData.description},
        ${ticketData.priority},
        ${ticketData.source},
        ${ticketData.status},
        ${ticketData.project_id || null},
        ${ticketData.customer_id || null},
        ${JSON.stringify(ticketData.metadata || {})},
        NOW()
      )
      RETURNING id
    `;

    return ticket;
  }

  /**
   * Link WhatsApp message to ticket for tracking
   */
  private static async linkMessageToTicket(messageId: string, ticketId: string): Promise<void> {
    await sql`
      INSERT INTO whatsapp_ticket_links (
        whatsapp_message_id,
        ticket_id,
        created_at
      )
      VALUES (${messageId}, ${ticketId}, NOW())
      ON CONFLICT (whatsapp_message_id) DO NOTHING
    `;
  }

  /**
   * Find existing ticket by WhatsApp message ID
   */
  private static async findTicketByWhatsAppMessage(
    messageId: string
  ): Promise<{ id: string } | null> {
    const [result] = await sql`
      SELECT ticket_id as id
      FROM whatsapp_ticket_links
      WHERE whatsapp_message_id = ${messageId}
      LIMIT 1
    `;

    return result || null;
  }

  /**
   * Add WhatsApp message as note to existing ticket
   */
  private static async addNoteToTicket(
    ticketId: string,
    message: WhatsAppMessage
  ): Promise<void> {
    const noteContent = `
WhatsApp Reply from: ${message.from_name} (${message.from})
Group: ${message.group_name}
Received: ${message.timestamp.toISOString()}

${message.message}
    `.trim();

    await sql`
      INSERT INTO ticket_notes (
        ticket_id,
        content,
        is_internal,
        created_by,
        created_by_name,
        created_at
      )
      VALUES (
        ${ticketId},
        ${noteContent},
        false,
        'whatsapp_bridge',
        ${message.from_name},
        NOW()
      )
    `;

    // Add to history
    await sql`
      INSERT INTO ticket_history (
        ticket_id,
        change_type,
        description,
        changed_by,
        changed_by_name,
        metadata,
        created_at
      )
      VALUES (
        ${ticketId},
        'note_added',
        'WhatsApp reply added to ticket',
        'whatsapp_bridge',
        ${message.from_name},
        ${JSON.stringify({ whatsapp_message_id: message.id })},
        NOW()
      )
    `;
  }

  /**
   * Send WhatsApp confirmation message (requires WhatsApp Bridge API)
   */
  private static async sendWhatsAppConfirmation(
    phoneNumber: string,
    ticketId: string
  ): Promise<void> {
    try {
      // Call WhatsApp Bridge API to send message
      const whatsappBridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3100';

      await fetch(`${whatsappBridgeUrl}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message: `✅ Support ticket created: ${ticketId}\n\nWe've received your message and created a ticket. Our team will respond shortly.`,
        }),
      });
    } catch (error) {
      console.error('Failed to send WhatsApp confirmation:', error);
      // Don't throw - confirmation is optional
    }
  }

  /**
   * Send ticket update to WhatsApp
   */
  static async sendTicketUpdateToWhatsApp(ticketId: string, update: string): Promise<void> {
    try {
      // Get WhatsApp contact from ticket metadata
      const [ticket] = await sql`
        SELECT metadata
        FROM tickets
        WHERE id = ${ticketId}
      `;

      if (!ticket?.metadata?.whatsapp_from) {
        return; // No WhatsApp contact associated
      }

      const whatsappBridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3100';

      await fetch(`${whatsappBridgeUrl}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ticket.metadata.whatsapp_from,
          message: `📋 Ticket Update: ${ticketId}\n\n${update}`,
        }),
      });
    } catch (error) {
      console.error('Failed to send WhatsApp update:', error);
      // Don't throw - updates are optional
    }
  }
}
