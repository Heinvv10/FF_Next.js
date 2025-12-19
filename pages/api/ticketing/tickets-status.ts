// pages/api/ticketing/tickets-status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type { Ticket, TicketStatus } from '@/modules/ticketing/types';

const sql = neon(process.env.DATABASE_URL!);

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

  return handleStatusChange(req, res, userId);
}

async function handleStatusChange(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      ticket_id,
      status,
      reason,
    }: { ticket_id: string; status: TicketStatus; reason?: string } = req.body;

    if (!ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id is required');
    }

    if (!status) {
      return apiResponse.badRequest(res, 'status is required');
    }

    const validStatuses: TicketStatus[] = [
      'new',
      'triaged',
      'assigned',
      'in_progress',
      'blocked',
      'resolved',
      'closed',
      'cancelled',
      'pending_approval',
    ];

    if (!validStatuses.includes(status)) {
      return apiResponse.badRequest(res, `Invalid status: ${status}`);
    }

    const checkQuery = `SELECT id, status FROM tickets WHERE id = $1`;
    const checkResult = await sql(checkQuery, [ticket_id]);

    if (checkResult.length === 0) {
      return apiResponse.notFound(res, 'Ticket', ticket_id);
    }

    const ticket = checkResult[0] as Ticket;
    const oldStatus = ticket.status;

    if (oldStatus === status) {
      return apiResponse.badRequest(
        res,
        `Ticket is already in ${status} status`
      );
    }

    const updateFields: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: unknown[] = [status];
    let paramIndex = 2;

    if (status === 'blocked') {
      updateFields.push(`sla_paused_at = NOW()`);
      if (reason) {
        updateFields.push(`sla_pause_reason = $${paramIndex}`);
        params.push(reason);
        paramIndex++;
      }
    } else if (oldStatus === 'blocked') {
      updateFields.push(`sla_paused_at = NULL`);
      updateFields.push(`sla_pause_reason = NULL`);
    }

    params.push(ticket_id);
    const ticketIdParam = paramIndex;

    const updateQuery = `
      UPDATE tickets
      SET ${updateFields.join(', ')}
      WHERE id = $${ticketIdParam}
      RETURNING *
    `;

    const updateResult = await sql(updateQuery, params);
    const updatedTicket = updateResult[0] as Ticket;

    return apiResponse.success(
      res,
      updatedTicket,
      `Ticket status changed to ${status}`
    );
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
