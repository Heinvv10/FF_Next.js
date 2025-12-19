// pages/api/ticketing/webhooks/email.ts
// Webhook endpoint for incoming emails (e.g., from tickets@fibreflow.app)
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import {
  parseEmailToTicket,
  validateEmailPayload,
} from '@/modules/ticketing/integrations/email/emailParser';

const sql = neon(process.env.DATABASE_URL!);

// Webhook secret for verification (set in environment)
const WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, ['POST']);
  }

  // Verify webhook secret if configured
  if (WEBHOOK_SECRET) {
    const authHeader = req.headers['x-webhook-secret'] || req.headers.authorization;
    if (authHeader !== WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return apiResponse.unauthorized(res);
    }
  }

  return handleEmailWebhook(req, res);
}

async function handleEmailWebhook(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const payload = req.body;

    // Validate payload structure
    if (!validateEmailPayload(payload)) {
      return apiResponse.badRequest(res, 'Invalid email payload structure');
    }

    // Parse email into ticket data
    const { ticket, metadata } = parseEmailToTicket({
      from: payload.from,
      fromName: payload.fromName || '',
      subject: payload.subject,
      body: payload.body,
      bodyHtml: payload.bodyHtml,
      receivedAt: payload.receivedAt || new Date().toISOString(),
      messageId: payload.messageId,
      attachments: payload.attachments || [],
    });

    // Check for duplicate (same messageId)
    if (metadata.messageId) {
      const duplicateCheck = await sql(
        'SELECT id FROM tickets WHERE external_id = $1 AND source = $2',
        [metadata.messageId, 'email']
      );

      if (duplicateCheck.length > 0) {
        return apiResponse.success(res, {
          ticket_id: duplicateCheck[0].id,
          status: 'duplicate',
          message: 'Email already processed',
        });
      }
    }

    // Create the ticket
    const insertQuery = `
      INSERT INTO tickets (
        source,
        external_id,
        title,
        description,
        priority,
        type,
        dr_number,
        client_name,
        client_email,
        tags,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        (SELECT id FROM users LIMIT 1)
      )
      RETURNING id, ticket_uid
    `;

    const result = await sql(insertQuery, [
      ticket.source,
      ticket.external_id || null,
      ticket.title,
      ticket.description || null,
      ticket.priority,
      ticket.type || null,
      ticket.dr_number || null,
      ticket.client_name || null,
      ticket.client_email || null,
      ticket.tags || [],
    ]);

    if (result.length === 0) {
      return apiResponse.internalError(res, new Error('Failed to create ticket'));
    }

    const createdTicket = result[0];

    // Log to notification_log
    await sql(
      `INSERT INTO notification_log (
        ticket_id,
        notification_type,
        recipient,
        subject,
        message,
        status,
        trigger_event
      ) VALUES ($1, 'email', $2, $3, $4, 'delivered', 'email_webhook')`,
      [
        createdTicket.id,
        metadata.fromEmail,
        ticket.title,
        `Email received from ${metadata.fromEmail}`,
      ]
    );

    return apiResponse.success(
      res,
      {
        ticket_id: createdTicket.id,
        ticket_uid: createdTicket.ticket_uid,
        status: 'created',
        source: 'email',
        from: metadata.fromEmail,
      },
      'Ticket created from email',
      201
    );
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

// Disable body parsing for raw webhook payload if needed
export const config = {
  api: {
    bodyParser: true,
  },
};
