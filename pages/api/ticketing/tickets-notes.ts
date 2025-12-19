// pages/api/ticketing/tickets-notes.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { apiResponse } from '@/lib/apiResponse';
import { getAuth } from '@clerk/nextjs/server';
import type { TicketNote, CreateTicketNoteInput } from '@/modules/ticketing/types';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  if (req.method === 'GET') {
    return handleGetNotes(req, res, userId);
  }

  if (req.method === 'POST') {
    return handleCreateNote(req, res, userId);
  }

  return apiResponse.methodNotAllowed(res, req.method!, ['GET', 'POST']);
}

async function handleGetNotes(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const {
      ticket_id,
      note_type,
      created_by,
      limit = '50',
      offset = '0',
    } = req.query;

    if (!ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id query parameter is required');
    }

    const whereConditions: string[] = ['ticket_id = $1'];
    const params: unknown[] = [ticket_id];
    let paramIndex = 2;

    if (note_type) {
      whereConditions.push(`note_type = $${paramIndex}`);
      params.push(note_type);
      paramIndex++;
    }

    if (created_by) {
      whereConditions.push(`created_by = $${paramIndex}`);
      params.push(created_by);
      paramIndex++;
    }

    const perPage = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const whereSQL = whereConditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM ticket_notes WHERE ${whereSQL}`;
    const countResult = await sql.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    params.push(perPage);
    const limitParam = paramIndex;
    paramIndex++;

    params.push(offsetNum);
    const offsetParam = paramIndex;

    const query = `
      SELECT * FROM ticket_notes
      WHERE ${whereSQL}
      ORDER BY created_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const result = await sql.query(query, params);
    const notes = result.rows as TicketNote[];

    const page = Math.floor(offsetNum / perPage) + 1;
    const totalPages = Math.ceil(total / perPage);

    return apiResponse.success(res, {
      data: notes,
      total,
      page,
      per_page: perPage,
      total_pages: totalPages,
    });
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}

async function handleCreateNote(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const input = req.body as CreateTicketNoteInput;

    if (!input.ticket_id) {
      return apiResponse.badRequest(res, 'ticket_id is required');
    }

    if (!input.note_text) {
      return apiResponse.badRequest(res, 'note_text is required');
    }

    const checkQuery = `SELECT id FROM tickets WHERE id = $1`;
    const checkResult = await sql.query(checkQuery, [input.ticket_id]);

    if (checkResult.rows.length === 0) {
      return apiResponse.notFound(res, 'Ticket', input.ticket_id);
    }

    const insertQuery = `
      INSERT INTO ticket_notes (
        ticket_id,
        note_text,
        note_type,
        created_by,
        is_internal
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await sql.query(insertQuery, [
      input.ticket_id,
      input.note_text,
      input.note_type || 'general',
      userId,
      input.is_internal ?? false,
    ]);

    const note = result.rows[0] as TicketNote;

    return apiResponse.success(res, note, 'Note created successfully', 201);
  } catch (error) {
    return apiResponse.internalError(res, error);
  }
}
