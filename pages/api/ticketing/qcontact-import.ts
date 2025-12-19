// pages/api/ticketing/qcontact-import.ts
// Manually import calls from QContact and create tickets
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { apiResponse } from '@/lib/apiResponse';
import { QContactClient } from '@/modules/ticketing/integrations/qcontact/qcontactClient';

/**
 * POST /api/ticketing/qcontact-import
 * Manually fetch call from QContact and create ticket
 *
 * Body: {
 *   call_id: string;
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, req.method || 'UNKNOWN', ['POST']);
  }

  try {
    // Authenticate user
    const { userId } = getAuth(req);
    if (!userId) {
      return apiResponse.unauthorized(res, 'Authentication required');
    }

    const { call_id } = req.body;

    // Validate required fields
    if (!call_id) {
      return apiResponse.badRequest(res, 'Missing required field: call_id');
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

    // Fetch call details from QContact API
    const callDetails = await QContactClient.fetchCallDetails(call_id);

    if (!callDetails) {
      return apiResponse.notFound(res, 'Call', call_id);
    }

    // Process call and create ticket
    const result = await QContactClient.processInboundCall(callDetails);

    if (result.success) {
      // Update call status in QContact
      if (result.ticket_id) {
        await QContactClient.updateCallStatus(call_id, 'ticket_created');
      }

      return apiResponse.success(res, {
        message: result.ticket_id
          ? `Ticket created successfully: ${result.ticket_id}`
          : 'Call does not require ticket creation',
        ticket_id: result.ticket_id,
        call_details: callDetails,
      });
    } else {
      return apiResponse.internalError(res, new Error(result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('QContact import error:', error);
    return apiResponse.internalError(res, error);
  }
}
