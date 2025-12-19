// src/modules/ticketing/integrations/qcontact/qcontactClient.ts
// QContact API Integration - Automatic ticket creation from phone calls
// Connects to QContact call center system

import { neon } from '@neondatabase/serverless';
import type { Ticket, TicketPriority, TicketSource } from '../../types';

const sql = neon(process.env.DATABASE_URL!);

interface QContactCall {
  call_id: string;
  caller_number: string;
  caller_name?: string;
  agent_id: string;
  agent_name: string;
  call_start: Date;
  call_end: Date;
  call_duration: number;
  call_notes?: string;
  call_recording_url?: string;
  call_outcome: 'resolved' | 'escalate' | 'callback' | 'voicemail' | 'abandoned';
  customer_id?: string;
  project_id?: string;
}

interface TicketCreationResult {
  success: boolean;
  ticket_id?: string;
  error?: string;
}

/**
 * QContact API Client
 * Handles integration with QContact call center system
 */
export class QContactClient {
  private static baseUrl = process.env.QCONTACT_API_URL || 'https://api.qcontact.com/v1';
  private static apiKey = process.env.QCONTACT_API_KEY || '';

  /**
   * Process incoming call and create ticket if needed
   */
  static async processInboundCall(call: QContactCall): Promise<TicketCreationResult> {
    try {
      // Check if call should trigger ticket creation
      const shouldCreateTicket = this.shouldCreateTicket(call);

      if (!shouldCreateTicket) {
        return {
          success: true,
          error: 'Call does not require ticket creation',
        };
      }

      // Extract ticket information from call
      const ticketData = this.extractTicketData(call);

      // Create ticket
      const ticket = await this.createTicketFromCall(ticketData);

      // Link call to ticket
      await this.linkCallToTicket(call.call_id, ticket.id);

      // Upload call recording as attachment (if available)
      if (call.call_recording_url) {
        await this.attachCallRecording(ticket.id, call.call_recording_url, call.call_id);
      }

      return {
        success: true,
        ticket_id: ticket.id,
      };
    } catch (error) {
      console.error('Failed to process QContact call for ticket creation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determine if call should trigger ticket creation
   */
  private static shouldCreateTicket(call: QContactCall): boolean {
    // Don't create ticket if call was resolved on the spot
    if (call.call_outcome === 'resolved') {
      return false;
    }

    // Create ticket for escalations, callbacks, and unresolved calls
    return ['escalate', 'callback', 'voicemail'].includes(call.call_outcome);
  }

  /**
   * Extract ticket data from call
   */
  private static extractTicketData(call: QContactCall): Partial<Ticket> {
    // Determine priority based on call outcome
    const priority = this.extractPriority(call);

    // Generate title based on call outcome
    const title = this.generateTitle(call);

    // Build description from call details
    const description = `
Call from: ${call.caller_name || call.caller_number}
Phone: ${call.caller_number}
Agent: ${call.agent_name}
Duration: ${Math.round(call.call_duration / 60)} minutes
Outcome: ${call.call_outcome}
Date: ${call.call_start.toISOString()}

${call.call_notes ? `Notes:\n${call.call_notes}` : ''}

${call.call_recording_url ? `Call recording: ${call.call_recording_url}` : ''}
    `.trim();

    return {
      title,
      description,
      priority,
      source: 'qcontact' as TicketSource,
      status: call.call_outcome === 'escalate' ? 'open' : 'awaiting_customer',
      assigned_to: call.call_outcome === 'escalate' ? undefined : call.agent_id,
      customer_id: call.customer_id,
      project_id: call.project_id,
      metadata: {
        qcontact_call_id: call.call_id,
        qcontact_caller_number: call.caller_number,
        qcontact_caller_name: call.caller_name,
        qcontact_agent_id: call.agent_id,
        qcontact_agent_name: call.agent_name,
        qcontact_call_start: call.call_start.toISOString(),
        qcontact_call_end: call.call_end.toISOString(),
        qcontact_call_duration: call.call_duration,
        qcontact_call_outcome: call.call_outcome,
        qcontact_call_recording_url: call.call_recording_url,
      },
    };
  }

  /**
   * Extract priority from call outcome
   */
  private static extractPriority(call: QContactCall): TicketPriority {
    // Escalations are high priority
    if (call.call_outcome === 'escalate') {
      return 'high';
    }

    // Callbacks are medium priority
    if (call.call_outcome === 'callback') {
      return 'medium';
    }

    // Voicemails are low priority
    return 'low';
  }

  /**
   * Generate ticket title from call
   */
  private static generateTitle(call: QContactCall): string {
    const callerName = call.caller_name || call.caller_number;

    switch (call.call_outcome) {
      case 'escalate':
        return `Escalated Call: ${callerName}`;
      case 'callback':
        return `Callback Required: ${callerName}`;
      case 'voicemail':
        return `Voicemail Follow-up: ${callerName}`;
      default:
        return `Call from ${callerName}`;
    }
  }

  /**
   * Create ticket from call data
   */
  private static async createTicketFromCall(
    ticketData: Partial<Ticket>
  ): Promise<{ id: string }> {
    const [ticket] = await sql`
      INSERT INTO tickets (
        title,
        description,
        priority,
        source,
        status,
        assigned_to,
        customer_id,
        project_id,
        metadata,
        created_at
      )
      VALUES (
        ${ticketData.title},
        ${ticketData.description},
        ${ticketData.priority},
        ${ticketData.source},
        ${ticketData.status},
        ${ticketData.assigned_to || null},
        ${ticketData.customer_id || null},
        ${ticketData.project_id || null},
        ${JSON.stringify(ticketData.metadata || {})},
        NOW()
      )
      RETURNING id
    `;

    return ticket;
  }

  /**
   * Link QContact call to ticket for tracking
   */
  private static async linkCallToTicket(callId: string, ticketId: string): Promise<void> {
    await sql`
      INSERT INTO qcontact_ticket_links (
        qcontact_call_id,
        ticket_id,
        created_at
      )
      VALUES (${callId}, ${ticketId}, NOW())
      ON CONFLICT (qcontact_call_id) DO NOTHING
    `;
  }

  /**
   * Attach call recording to ticket
   */
  private static async attachCallRecording(
    ticketId: string,
    recordingUrl: string,
    callId: string
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO ticket_attachments (
          ticket_id,
          filename,
          file_url,
          file_size,
          file_type,
          uploaded_by,
          uploaded_by_name,
          uploaded_at
        )
        VALUES (
          ${ticketId},
          ${'call_recording_' + callId + '.mp3'},
          ${recordingUrl},
          0,
          'audio/mpeg',
          'qcontact_system',
          'QContact System',
          NOW()
        )
      `;
    } catch (error) {
      console.error('Failed to attach call recording:', error);
      // Don't throw - attachment is optional
    }
  }

  /**
   * Fetch call details from QContact API
   */
  static async fetchCallDetails(callId: string): Promise<QContactCall | null> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`QContact API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        call_id: data.id,
        caller_number: data.caller.phone,
        caller_name: data.caller.name,
        agent_id: data.agent.id,
        agent_name: data.agent.name,
        call_start: new Date(data.start_time),
        call_end: new Date(data.end_time),
        call_duration: data.duration,
        call_notes: data.notes,
        call_recording_url: data.recording_url,
        call_outcome: data.outcome,
        customer_id: data.customer_id,
        project_id: data.project_id,
      };
    } catch (error) {
      console.error('Failed to fetch call details from QContact:', error);
      return null;
    }
  }

  /**
   * Update call status in QContact
   */
  static async updateCallStatus(
    callId: string,
    status: 'ticket_created' | 'resolved' | 'escalated'
  ): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/calls/${callId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error('Failed to update call status in QContact:', error);
      // Don't throw - status update is optional
    }
  }

  /**
   * Find existing ticket by QContact call ID
   */
  static async findTicketByCallId(callId: string): Promise<{ id: string } | null> {
    const [result] = await sql`
      SELECT ticket_id as id
      FROM qcontact_ticket_links
      WHERE qcontact_call_id = ${callId}
      LIMIT 1
    `;

    return result || null;
  }
}
