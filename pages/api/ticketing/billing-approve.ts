// pages/api/ticketing/billing-approve.ts
// Approve or reject billable ticket costs
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';

const sql = neon(process.env.DATABASE_URL!);

interface BillingApprovalInput {
  ticket_id: string;
  approval_status: 'approved' | 'rejected';
  approval_notes?: string;
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

  return handleBillingApproval(req, res, userId);
}

async function handleBillingApproval(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const input = req.body as BillingApprovalInput;

    if (!input.ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id is required');
    }

    if (!input.approval_status) {
      return apiResponse.badRequest(res, 'approval_status is required');
    }

    if (!['approved', 'rejected'].includes(input.approval_status)) {
      return apiResponse.badRequest(
        res,
        'approval_status must be either "approved" or "rejected"'
      );
    }

    const checkQuery = `
      SELECT id, billing_type, requires_billing_approval
      FROM tickets
      WHERE id = $1
    `;

    const checkResult = await sql.query(checkQuery, [input.ticket_id]);

    if (checkResult.rows.length === 0) {
      return apiResponse.notFound(res, 'Ticket', input.ticket_id);
    }

    const ticket = checkResult.rows[0];

    if (!ticket.requires_billing_approval) {
      return apiResponse.badRequest(
        res,
        'This ticket does not require billing approval'
      );
    }

    const updateTicketQuery = `
      UPDATE tickets
      SET
        billing_approved_by = $1,
        billing_approved_at = NOW(),
        billing_notes = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    await sql.query(updateTicketQuery, [
      userId,
      input.approval_notes || null,
      input.ticket_id,
    ]);

    const updateBillingQuery = `
      UPDATE ticket_billing
      SET
        approval_status = $1,
        approved_by = $2,
        approved_at = NOW(),
        approval_notes = $3
      WHERE ticket_id = $4
      RETURNING *
    `;

    const billingResult = await sql.query(updateBillingQuery, [
      input.approval_status,
      userId,
      input.approval_notes || null,
      input.ticket_id,
    ]);

    if (billingResult.rows.length === 0) {
      return apiResponse.badRequest(
        res,
        'No billing record found for this ticket'
      );
    }

    const billing = billingResult.rows[0];

    return apiResponse.success(
      res,
      billing,
      `Billing ${input.approval_status} successfully`
    );
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
