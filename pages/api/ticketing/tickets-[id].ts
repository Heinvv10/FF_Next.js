// pages/api/ticketing/tickets-[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type { Ticket, UpdateTicketInput } from '@/modules/ticketing/types';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId, sessionClaims } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  const isAdmin = sessionClaims?.metadata?.role === 'admin';
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return apiResponse.badRequest(res, 'Ticket ID is required');
  }

  if (req.method === 'GET') {
    return handleGetTicket(req, res, id);
  }

  if (req.method === 'PATCH') {
    return handleUpdateTicket(req, res, id, userId);
  }

  if (req.method === 'DELETE') {
    return handleDeleteTicket(req, res, id, userId, isAdmin);
  }

  return apiResponse.methodNotAllowed(res, req.method!, ['GET', 'PATCH', 'DELETE']);
}

async function handleGetTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string
) {
  try {
    const query = `SELECT * FROM tickets WHERE id = $1`;
    const result = await sql(query, [ticketId]);

    if (result.length === 0) {
      return apiResponse.notFound(res, 'Ticket', ticketId);
    }

    const ticket = result[0] as Ticket;

    return apiResponse.success(res, ticket);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

async function handleUpdateTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userId: string
) {
  try {
    const input = req.body as UpdateTicketInput;

    // Validate status if provided
    if (input.status !== undefined) {
      const validStatuses = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
      if (!validStatuses.includes(input.status)) {
        return apiResponse.badRequest(res, `Invalid status. Valid values: ${validStatuses.join(', ')}`);
      }
    }

    // Validate priority if provided
    if (input.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(input.priority)) {
        return apiResponse.badRequest(res, `Invalid priority. Valid values: ${validPriorities.join(', ')}`);
      }
    }

    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      params.push(input.title);
      paramIndex++;
    }

    if (input.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      params.push(input.description);
      paramIndex++;
    }

    if (input.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(input.status);
      paramIndex++;
    }

    if (input.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex}`);
      params.push(input.priority);
      paramIndex++;
    }

    if (input.type !== undefined) {
      updateFields.push(`type = $${paramIndex}`);
      params.push(input.type);
      paramIndex++;
    }

    if (input.assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex}`);
      params.push(input.assigned_to);
      paramIndex++;
    }

    if (input.project_id !== undefined) {
      updateFields.push(`project_id = $${paramIndex}`);
      params.push(input.project_id);
      paramIndex++;
    }

    if (input.dr_number !== undefined) {
      updateFields.push(`dr_number = $${paramIndex}`);
      params.push(input.dr_number);
      paramIndex++;
    }

    if (input.client_name !== undefined) {
      updateFields.push(`client_name = $${paramIndex}`);
      params.push(input.client_name);
      paramIndex++;
    }

    if (input.client_contact !== undefined) {
      updateFields.push(`client_contact = $${paramIndex}`);
      params.push(input.client_contact);
      paramIndex++;
    }

    if (input.client_email !== undefined) {
      updateFields.push(`client_email = $${paramIndex}`);
      params.push(input.client_email);
      paramIndex++;
    }

    if (input.address !== undefined) {
      updateFields.push(`address = $${paramIndex}`);
      params.push(input.address);
      paramIndex++;
    }

    if (input.gps_coordinates !== undefined) {
      updateFields.push(`gps_coordinates = $${paramIndex}`);
      params.push(input.gps_coordinates);
      paramIndex++;
    }

    if (input.billing_notes !== undefined) {
      updateFields.push(`billing_notes = $${paramIndex}`);
      params.push(input.billing_notes);
      paramIndex++;
    }

    if (input.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex}`);
      params.push(input.tags);
      paramIndex++;
    }

    // Billing fields
    if ((input as any).billable_type !== undefined) {
      updateFields.push(`billable_type = $${paramIndex}`);
      params.push((input as any).billable_type);
      paramIndex++;
    }

    if ((input as any).estimated_hours !== undefined) {
      updateFields.push(`estimated_hours = $${paramIndex}`);
      params.push((input as any).estimated_hours);
      paramIndex++;
    }

    if ((input as any).actual_hours !== undefined) {
      updateFields.push(`actual_hours = $${paramIndex}`);
      params.push((input as any).actual_hours);
      paramIndex++;
    }

    if ((input as any).hourly_rate !== undefined) {
      updateFields.push(`hourly_rate = $${paramIndex}`);
      params.push((input as any).hourly_rate);
      paramIndex++;
    }

    if ((input as any).metadata !== undefined) {
      updateFields.push(`metadata = $${paramIndex}`);
      params.push(JSON.stringify((input as any).metadata));
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return apiResponse.badRequest(res, 'No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);

    params.push(ticketId);
    const ticketIdParam = paramIndex;

    const updateQuery = `
      UPDATE tickets
      SET ${updateFields.join(', ')}
      WHERE id = $${ticketIdParam}
      RETURNING *
    `;

    const result = await sql(updateQuery, params);

    if (result.length === 0) {
      return apiResponse.notFound(res, 'Ticket', ticketId);
    }

    const ticket = result[0] as Ticket;

    return apiResponse.success(res, ticket, 'Ticket updated successfully');
  } catch (error) {
    console.error('Update ticket error:', error);
    return apiResponse.internalError(res, error);
  }
}

async function handleDeleteTicket(
  req: NextApiRequest,
  res: NextApiResponse,
  ticketId: string,
  userId: string,
  isAdmin: boolean
) {
  try {
    // Check if ticket exists
    const checkQuery = `SELECT id, created_by, status, billing_status FROM tickets WHERE id = $1`;
    const checkResult = await sql(checkQuery, [ticketId]);

    if (checkResult.length === 0) {
      return apiResponse.notFound(res, 'Ticket', ticketId);
    }

    const ticket = checkResult[0] as { id: string; created_by?: string; status?: string; billing_status?: string };

    // Authorization: Only creator or admin can delete (skip if created_by not set)
    if (ticket.created_by && ticket.created_by !== userId && !isAdmin) {
      return apiResponse.forbidden(res, 'Only the ticket creator or admin can delete this ticket');
    }

    // Prevent deletion of closed tickets
    if (ticket.status === 'closed') {
      return apiResponse.badRequest(res, 'Cannot delete closed tickets');
    }

    // Prevent deletion of tickets with approved billing
    if (ticket.billing_status === 'approved') {
      return apiResponse.badRequest(res, 'Cannot delete ticket with approved billing');
    }

    const { force } = req.query;

    if (force === 'true') {
      // Hard delete (admin only)
      if (!isAdmin) {
        return apiResponse.forbidden(res, 'Admin access required for hard delete');
      }
      const deleteQuery = `DELETE FROM tickets WHERE id = $1`;
      await sql(deleteQuery, [ticketId]);
      return apiResponse.success(res, null, 'Ticket permanently deleted');
    } else {
      // Soft delete
      const softDeleteQuery = `
        UPDATE tickets
        SET deleted = true, deleted_at = NOW(), deleted_by = $2
        WHERE id = $1
        RETURNING id, deleted, deleted_at, deleted_by
      `;
      const deleteResult = await sql(softDeleteQuery, [ticketId, userId]);
      const deletedTicket = deleteResult[0] || { deleted: true };
      return apiResponse.success(res, deletedTicket, 'Ticket soft deleted successfully');
    }
  } catch (error) {
    console.error('Delete ticket error:', error);
    return apiResponse.internalError(res, error);
  }
}
