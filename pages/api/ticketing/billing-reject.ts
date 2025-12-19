// pages/api/ticketing/billing-reject.ts
// Reject billable ticket with reason
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

const sql = neon(process.env.DATABASE_URL!);

interface BillingRejectInput {
  ticket_id: string;
  rejection_reason: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return apiResponse.methodNotAllowed(res, ['POST']);
  }

  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  return handleBillingRejection(req, res, userId);
}

async function handleBillingRejection(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const input = req.body as BillingRejectInput;

    if (!input.ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id is required');
    }

    if (!input.rejection_reason) {
      return apiResponse.badRequest(res, 'rejection_reason is required');
    }

    // Check ticket exists and requires approval
    const checkQuery = `
      SELECT id, ticket_uid, billing_type, requires_billing_approval, status
      FROM tickets
      WHERE id = $1
    `;

    const checkResult = await sql(checkQuery, [input.ticket_id]);

    if (checkResult.length === 0) {
      return apiResponse.notFound(res, 'Ticket', input.ticket_id);
    }

    const ticket = checkResult[0];

    if (!ticket.requires_billing_approval) {
      return apiResponse.badRequest(
        res,
        'This ticket does not require billing approval'
      );
    }

    if (ticket.status !== 'pending_approval') {
      return apiResponse.badRequest(
        res,
        'Ticket is not in pending_approval status'
      );
    }

    // Update ticket status to cancelled
    const updateTicketQuery = `
      UPDATE tickets
      SET
        status = 'cancelled',
        billing_notes = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    await sql(updateTicketQuery, [
      input.rejection_reason,
      input.ticket_id,
    ]);

    // Update billing record
    const updateBillingQuery = `
      UPDATE ticket_billing
      SET
        approval_status = 'rejected',
        approved_by = $1,
        approved_at = NOW(),
        rejection_reason = $2,
        updated_at = NOW()
      WHERE ticket_id = $3
      RETURNING *
    `;

    const billingResult = await sql(updateBillingQuery, [
      userId,
      input.rejection_reason,
      input.ticket_id,
    ]);

    // Log to ticket history
    const historyQuery = `
      INSERT INTO ticket_history (
        ticket_id,
        action,
        field_changed,
        old_value,
        new_value,
        changed_by,
        change_reason
      ) VALUES ($1, 'billing_rejected', 'status', 'pending_approval', 'cancelled', $2, $3)
    `;

    await sql(historyQuery, [
      input.ticket_id,
      userId,
      input.rejection_reason,
    ]);

    const billing = billingResult.length > 0 ? billingResult[0] : null;

    return apiResponse.success(
      res,
      {
        ticket_id: input.ticket_id,
        ticket_uid: ticket.ticket_uid,
        status: 'cancelled',
        billing,
      },
      'Billing rejected successfully'
    );
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
