// pages/api/ticketing/tickets-assign.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type { TicketAssignment, Ticket } from '@/modules/ticketing/types';

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

  return handleAssignTicket(req, res, userId);
}

async function handleAssignTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { ticket_id, assigned_to, assignment_reason } =
      req.body as TicketAssignment & { assignment_reason?: string };

    if (!ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id is required');
    }

    if (!assigned_to) {
      return apiResponse.badRequest(res, 'assigned_to is required');
    }

    const checkQuery = `SELECT id, assigned_to FROM tickets WHERE id = $1`;
    const checkResult = await sql(checkQuery, [ticket_id]);

    if (checkResult.length === 0) {
      return apiResponse.notFound(res, 'Ticket', ticket_id);
    }

    const ticket = checkResult[0] as Ticket;
    const previous_assignee = ticket.assigned_to;

    const updateQuery = `
      UPDATE tickets
      SET assigned_to = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const updateResult = await sql(updateQuery, [assigned_to, ticket_id]);
    const updatedTicket = updateResult[0] as Ticket;

    const historyQuery = `
      INSERT INTO ticket_assignment_history (
        ticket_id,
        assigned_to,
        assigned_by,
        assignment_reason,
        previous_assignee
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await sql(historyQuery, [
      ticket_id,
      assigned_to,
      userId,
      assignment_reason || null,
      previous_assignee,
    ]);

    return apiResponse.success(
      res,
      updatedTicket,
      'Ticket assigned successfully'
    );
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
