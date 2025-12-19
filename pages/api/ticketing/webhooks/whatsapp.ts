// pages/api/ticketing/webhooks/whatsapp.ts
// WhatsApp webhook endpoint for receiving incoming messages and creating tickets
import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { WhatsAppBridgeService } from '@/modules/ticketing/integrations/whatsapp/whatsappBridge';

/**
 * POST /api/ticketing/webhooks/whatsapp
 * Receive WhatsApp messages and auto-create tickets
 *
 * Expected payload from WhatsApp Bridge:
 * {
 *   id: string;
 *   from: string;
 *   from_name: string;
 *   group_id: string;
 *   group_name: string;
 *   message: string;
 *   timestamp: string;
 *   media_url?: string;
 *   quoted_message?: string;
 *   project_id?: string;
 *   customer_id?: string;
 *   auto_create?: boolean;
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, req.method || 'UNKNOWN', ['POST']);
  }

  try {
    const {
      id,
      from,
      from_name,
      group_id,
      group_name,
      message,
      timestamp,
      media_url,
      quoted_message,
      project_id,
      customer_id,
      auto_create = true,
    } = req.body;

    // Validate required fields
    if (!id || !from || !from_name || !message) {
      return apiResponse.badRequest(res, 'Missing required fields: id, from, from_name, message');
    }

    // Validate webhook signature (if configured)
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'] as string;
      if (!signature || signature !== webhookSecret) {
        return apiResponse.unauthorized(res, 'Invalid webhook signature');
      }
    }

    // Process message and create ticket if needed
    const result = await WhatsAppBridgeService.processInboundMessage(
      {
        id,
        from,
        from_name,
        group_id: group_id || 'unknown',
        group_name: group_name || 'Direct Message',
        message,
        timestamp: new Date(timestamp || Date.now()),
        media_url,
        quoted_message,
      },
      {
        project_id,
        customer_id,
        auto_create,
      }
    );

    if (result.success) {
      return apiResponse.success(res, {
        message: result.ticket_id
          ? `Ticket created successfully: ${result.ticket_id}`
          : 'Message processed (no ticket created)',
        ticket_id: result.ticket_id,
        auto_created: !!result.ticket_id,
      });
    } else {
      return apiResponse.internalError(res, new Error(result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return apiResponse.internalError(res, error);
  }
}
