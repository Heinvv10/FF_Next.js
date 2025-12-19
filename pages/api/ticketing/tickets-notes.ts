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
  const { userId, sessionClaims } = getAuth(req);

  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  const isAdmin = sessionClaims?.metadata?.role === 'admin';
  const { noteId } = req.query;

  if (req.method === 'GET') {
    return handleGetNotes(req, res, userId, isAdmin);
  }

  if (req.method === 'POST') {
    return handleCreateNote(req, res, userId);
  }

  if (req.method === 'PATCH') {
    return handleUpdateNote(req, res, userId, isAdmin, noteId as string);
  }

  if (req.method === 'DELETE') {
    return handleDeleteNote(req, res, userId, isAdmin, noteId as string);
  }

  return apiResponse.methodNotAllowed(res, req.method!, ['GET', 'POST', 'PATCH', 'DELETE']);
}

async function handleGetNotes(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  isAdmin: boolean
) {
  try {
    const {
      ticket_id,
      note_type,
      visibility,
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

    // Filter internal notes for non-staff
    if (!isAdmin && visibility !== 'all') {
      whereConditions.push(`(is_internal = false OR created_by = $${paramIndex})`);
      params.push(userId);
      paramIndex++;
    }

    if (visibility === 'internal') {
      whereConditions.push('is_internal = true');
    } else if (visibility === 'public') {
      whereConditions.push('is_internal = false');
    }

    const whereSQL = whereConditions.join(' AND ');

    const query = `
      SELECT * FROM ticket_notes
      WHERE ${whereSQL}
      ORDER BY created_at ASC
    `;

    const result = await sql(query, params);
    const notes = result as TicketNote[];

    return apiResponse.success(res, { notes });
  } catch (error) {
    console.error('Notes API error:', error);
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
    // Accept ticket_id from query or body
    const ticketId = (req.query.ticket_id as string) || input.ticket_id;

    if (!ticketId) {
      return apiResponse.badRequest(res, 'ticket_id is required');
    }

    if (!input.content && !input.note_text) {
      return apiResponse.badRequest(res, 'content is required');
    }

    // Trim whitespace from content
    const content = (input.content || input.note_text || '').trim();

    if (!content) {
      return apiResponse.badRequest(res, 'content is required');
    }

    const insertQuery = `
      INSERT INTO ticket_notes (
        ticket_id,
        content,
        note_type,
        created_by,
        is_internal
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await sql(insertQuery, [
      ticketId,
      content,
      input.note_type || 'general',
      userId,
      input.is_internal ?? false,
    ]);

    const note = result[0] as TicketNote;

    // Update ticket's updated_at timestamp
    await sql(`UPDATE tickets SET updated_at = NOW() WHERE id = $1`, [ticketId]);

    return apiResponse.success(res, note, 'Note created successfully', 201);
  } catch (error) {
    console.error('Notes API error:', error);
    return apiResponse.internalError(res, error);
  }
}

async function handleUpdateNote(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  isAdmin: boolean,
  noteId: string
) {
  try {
    if (!noteId) {
      return apiResponse.badRequest(res, 'noteId is required');
    }

    // Check if note exists and get ownership
    const checkQuery = `SELECT id, created_by FROM ticket_notes WHERE id = $1`;
    const checkResult = await sql(checkQuery, [noteId]);

    if (checkResult.length === 0) {
      return apiResponse.notFound(res, 'Note', noteId);
    }

    const note = checkResult[0] as { id: string; created_by: string };

    // Only author or admin can edit
    if (note.created_by !== userId && !isAdmin) {
      return apiResponse.forbidden(res, 'Only the author or admin can edit this note');
    }

    const { content, is_internal } = req.body;

    const updateFields: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex}`);
      params.push(content.trim());
      paramIndex++;
    }

    if (is_internal !== undefined) {
      updateFields.push(`is_internal = $${paramIndex}`);
      params.push(is_internal);
      paramIndex++;
    }

    params.push(noteId);

    const updateQuery = `
      UPDATE ticket_notes
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await sql(updateQuery, params);
    const updatedNote = result[0] as TicketNote;

    return apiResponse.success(res, updatedNote, 'Note updated successfully');
  } catch (error) {
    console.error('Notes API error:', error);
    return apiResponse.internalError(res, error);
  }
}

async function handleDeleteNote(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  isAdmin: boolean,
  noteId: string
) {
  try {
    if (!noteId) {
      return apiResponse.badRequest(res, 'noteId is required');
    }

    // Check if note exists and get ownership
    const checkQuery = `SELECT id, created_by FROM ticket_notes WHERE id = $1`;
    const checkResult = await sql(checkQuery, [noteId]);

    if (checkResult.length === 0) {
      return apiResponse.notFound(res, 'Note', noteId);
    }

    const note = checkResult[0] as { id: string; created_by: string };

    // Only author or admin can delete
    if (note.created_by !== userId && !isAdmin) {
      return apiResponse.forbidden(res, 'Only the author or admin can delete this note');
    }

    const { force } = req.query;

    if (force === 'true') {
      // Hard delete
      await sql(`DELETE FROM ticket_notes WHERE id = $1`, [noteId]);
    } else {
      // Soft delete
      await sql(`
        UPDATE ticket_notes
        SET deleted = true, deleted_at = NOW(), deleted_by = $1
        WHERE id = $2
      `, [userId, noteId]);
    }

    return apiResponse.success(res, null, 'Note deleted successfully');
  } catch (error) {
    console.error('Notes API error:', error);
    return apiResponse.internalError(res, error);
  }
}
