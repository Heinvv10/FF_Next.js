// pages/api/ticketing/webhooks/qcontact.ts
// QContact webhook endpoint for receiving call events and creating tickets
import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { QContactClient } from '@/modules/ticketing/integrations/qcontact/qcontactClient';

/**
 * POST /api/ticketing/webhooks/qcontact
 * Receive QContact call events and auto-create tickets
 *
 * Expected payload from QContact:
 * {
 *   event_type: 'call_ended';
 *   call_id: string;
 *   caller_number: string;
 *   caller_name?: string;
 *   agent_id: string;
 *   agent_name: string;
 *   call_start: string;
 *   call_end: string;
 *   call_duration: number;
 *   call_notes?: string;
 *   call_recording_url?: string;
 *   call_outcome: 'resolved' | 'escalate' | 'callback' | 'voicemail' | 'abandoned';
 *   customer_id?: string;
 *   project_id?: string;
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, req.method || 'UNKNOWN', ['POST']);
  }

  try {
    const {
      event_type,
      call_id,
      caller_number,
      caller_name,
      agent_id,
      agent_name,
      call_start,
      call_end,
      call_duration,
      call_notes,
      call_recording_url,
      call_outcome,
      customer_id,
      project_id,
    } = req.body;

    // Validate required fields
    if (!call_id || !caller_number || !agent_id || !call_outcome) {
      return apiResponse.badRequest(
        res,
        'Missing required fields: call_id, caller_number, agent_id, call_outcome'
      );
    }

    // Validate webhook signature (if configured)
    const webhookSecret = process.env.QCONTACT_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'] as string;
      if (!signature || signature !== webhookSecret) {
        return apiResponse.unauthorized(res, 'Invalid webhook signature');
      }
    }

    // Only process call_ended events
    if (event_type !== 'call_ended') {
      return apiResponse.success(res, {
        message: `Event type ${event_type} ignored`,
        processed: false,
      });
    }

    // Check if ticket already exists for this call
    const existingTicket = await QContactClient.findTicketByCallId(call_id);
    if (existingTicket) {
      return apiResponse.success(res, {
        message: 'Ticket already exists for this call',
        ticket_id: existingTicket.id,
        already_exists: true,
      });
    }

    // Process call and create ticket if needed
    const result = await QContactClient.processInboundCall({
      call_id,
      caller_number,
      caller_name,
      agent_id,
      agent_name,
      call_start: new Date(call_start),
      call_end: new Date(call_end),
      call_duration,
      call_notes,
      call_recording_url,
      call_outcome,
      customer_id,
      project_id,
    });

    if (result.success) {
      // Update call status in QContact
      if (result.ticket_id) {
        await QContactClient.updateCallStatus(call_id, 'ticket_created');
      }

      return apiResponse.success(res, {
        message: result.ticket_id
          ? `Ticket created successfully: ${result.ticket_id}`
          : 'Call processed (no ticket created)',
        ticket_id: result.ticket_id,
        auto_created: !!result.ticket_id,
      });
    } else {
      return apiResponse.internalError(res, new Error(result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('QContact webhook error:', error);
    return apiResponse.internalError(res, error);
  }
}
