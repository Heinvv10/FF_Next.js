// pages/api/ticketing/whatsapp-notify.ts
// Send ticket updates to WhatsApp contacts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { apiResponse } from '@/lib/apiResponse';
import { WhatsAppBridgeService } from '@/modules/ticketing/integrations/whatsapp/whatsappBridge';

/**
 * POST /api/ticketing/whatsapp-notify
 * Send ticket update notification to WhatsApp
 *
 * Body: {
 *   ticket_id: string;
 *   message: string;
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

    const { ticket_id, message } = req.body;

    // Validate required fields
    if (!ticket_id || !message) {
      return apiResponse.badRequest(res, 'Missing required fields: ticket_id, message');
    }

    // Send update to WhatsApp
    await WhatsAppBridgeService.sendTicketUpdateToWhatsApp(ticket_id, message);

    return apiResponse.success(res, {
      message: 'WhatsApp notification sent successfully',
      ticket_id,
    });
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return apiResponse.internalError(res, error);
  }
}
